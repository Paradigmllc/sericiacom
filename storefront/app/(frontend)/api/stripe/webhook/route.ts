import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { decrementVariantInventory } from "@/lib/medusa-admin";
import { notifySlackOrderPaid } from "@/lib/slack";
import { verifyWebhookEvent } from "@/lib/stripe";

/**
 * F58 — Stripe webhook receiver.
 *
 * Mirrors /api/hyperswitch/webhook + /api/crossmint-webhook semantics.
 * Identical post-paid side-effects: Supabase ledger flip → Medusa stock
 * decrement → events row → Slack bell → Resend email → n8n escalation.
 *
 * Differences from Hyperswitch:
 *   - Signature: Stripe's `constructEvent()` (HMAC SHA-256 + replay guard)
 *   - Header: `stripe-signature` (lowercase, set by Stripe edge)
 *   - Event types: payment_intent.succeeded / payment_intent.payment_failed
 *   - Payment id prefix: `pi_*` (vs Crossmint `cm_*` / Hyperswitch `pay_*`)
 *
 * Same fail-close stance for production: without STRIPE_WEBHOOK_SECRET we
 * 503 every webhook. Stripe retries 5xx with exponential backoff (3 days,
 * 16 attempts), so legit events survive an operator config gap.
 *
 * IMPORTANT: this route MUST receive the raw bytes for signature
 * verification. Next.js App Router gives us `req.text()` which preserves
 * the exact bytes — DO NOT switch to `req.json()` (re-stringifying breaks
 * the signature).
 *
 * Docs: https://docs.stripe.com/webhooks/signatures
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  // ── Fail-close: production rejects unsigned/unconfigured webhooks ──
  let event: Stripe.Event;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[stripe-webhook] CRITICAL: STRIPE_WEBHOOK_SECRET not set — " +
          "rejecting all webhooks. Set it in Coolify env + Stripe dashboard, then redeploy.",
      );
      return NextResponse.json(
        { error: "webhook_misconfigured", hint: "STRIPE_WEBHOOK_SECRET not set" },
        { status: 503 },
      );
    }
    console.warn("[stripe-webhook] STRIPE_WEBHOOK_SECRET not set (dev) — parsing without verification");
    try {
      event = JSON.parse(raw) as Stripe.Event;
    } catch {
      return NextResponse.json({ error: "invalid_json" }, { status: 400 });
    }
  } else {
    try {
      event = verifyWebhookEvent(raw, signature, secret);
    } catch (e) {
      const code = (e as Error & { code?: string }).code;
      console.warn("[stripe-webhook] signature verification failed", code, (e as Error).message);
      return NextResponse.json({ error: code ?? "invalid_signature" }, { status: 401 });
    }
  }

  // ── Route by event type ─────────────────────────────────────────────
  if (event.type === "payment_intent.succeeded") {
    return handlePaymentSucceeded(event);
  }
  if (event.type === "payment_intent.payment_failed") {
    return handlePaymentFailed(event);
  }
  if (event.type === "charge.refunded") {
    return handleChargeRefunded(event);
  }

  // Stripe sends ~30 event types we don't care about (charge.succeeded,
  // payment_intent.created, etc.). 200 OK with `ignored: true` so Stripe
  // doesn't retry and the dashboard shows clean delivery stats.
  return NextResponse.json({ ok: true, event: event.type, ignored: true });
}

// ─────────────────────────────────────────────────────────────────────
// Success path
// ─────────────────────────────────────────────────────────────────────

async function handlePaymentSucceeded(event: Stripe.Event) {
  const intent = event.data.object as Stripe.PaymentIntent;
  const sericiaOrderId =
    typeof intent.metadata?.sericia_order_id === "string"
      ? intent.metadata.sericia_order_id
      : null;
  const stripePaymentIntentId = intent.id;

  if (!sericiaOrderId) {
    console.warn("[stripe-webhook] payment_intent.succeeded with no sericia_order_id metadata", {
      intent_id: stripePaymentIntentId,
    });
    return NextResponse.json({ ok: true, skipped: "no_order_id" });
  }

  const { data: order } = await supabaseAdmin
    .from("sericia_orders")
    .select("id, drop_id, order_type, status, email, full_name, amount_usd, quantity")
    .eq("id", sericiaOrderId)
    .maybeSingle();
  if (!order) return NextResponse.json({ error: "order_not_found" }, { status: 404 });
  if (order.status === "paid" || order.status === "shipped") {
    // Stripe retries on any non-2xx, but they also occasionally double-deliver.
    // Idempotent: same order, already paid → 200 OK with already_processed.
    return NextResponse.json({ ok: true, already_processed: true });
  }

  const now = new Date().toISOString();
  // Reuse `crossmint_order_id` column for Stripe's PaymentIntent id.
  // Operationally unambiguous because Crossmint ids start with `cm_`,
  // Hyperswitch with `pay_`, and Stripe with `pi_`. No schema migration
  // needed and the existing admin views, exports, and Slack message
  // template continue to work.
  await supabaseAdmin
    .from("sericia_orders")
    .update({
      status: "paid",
      crossmint_order_id: stripePaymentIntentId,
      paid_at: now,
      updated_at: now,
    })
    .eq("id", order.id);

  // Drop sold_units bookkeeping (drop orders only).
  let drop: { sold_units: number; total_units: number; title: string } | null = null;
  if (order.drop_id) {
    const { data: d } = await supabaseAdmin
      .from("sericia_drops")
      .select("sold_units, total_units, title")
      .eq("id", order.drop_id)
      .maybeSingle();
    drop = d;
    if (drop) {
      const newSold = Math.min(drop.sold_units + order.quantity, drop.total_units);
      await supabaseAdmin
        .from("sericia_drops")
        .update({
          sold_units: newSold,
          status: newSold >= drop.total_units ? "sold_out" : "active",
        })
        .eq("id", order.drop_id);
    }
  }

  // Rule N half #1: DB bell
  await supabaseAdmin.from("sericia_events").insert({
    event_name: "order_paid",
    distinct_id: order.email,
    drop_id: order.drop_id,
    order_id: order.id,
    properties: { amount_usd: order.amount_usd, provider: "stripe" },
  });

  // Medusa stock decrement (cart orders only — drop orders are tracked
  // via sericia_drops.sold_units above).
  let inventoryDecremented = 0;
  let inventoryTotal = 0;
  if (order.order_type === "cart") {
    const { data: orderItems } = await supabaseAdmin
      .from("sericia_order_items")
      .select("product_id, quantity")
      .eq("order_id", order.id);
    if (orderItems?.length) {
      inventoryTotal = orderItems.length;
      const results = await Promise.allSettled(
        orderItems.map((it) => decrementVariantInventory(it.product_id, it.quantity)),
      );
      inventoryDecremented = results.filter(
        (r) => r.status === "fulfilled" && r.value.ok && r.value.decremented > 0,
      ).length;
    }
  }

  // Rule N half #2: Slack bell (fire-and-forget)
  notifySlackOrderPaid({
    order_id: order.id,
    email: order.email,
    full_name: order.full_name,
    amount_usd: order.amount_usd,
    tx_hash: null,
    crossmint_order_id: stripePaymentIntentId,
    inventory_decremented: inventoryDecremented,
    inventory_total: inventoryTotal,
  }).catch((e) => console.error("[stripe-webhook] slack notify exception", e));

  // Resend email (fire-and-forget) — Stripe also sends a receipt by default
  // because we set receipt_email on the PaymentIntent, but Sericia's
  // confirmation email has brand voice + EMS shipping promise. Both are
  // fine to send: Stripe receipt = transactional proof, Sericia email =
  // experience.
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Sericia <contact@sericia.com>",
        to: order.email,
        subject: `Your Sericia order is confirmed — ${drop?.title ?? "Sericia"}`,
        html: `<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#2b221c">
          <h1 style="font-weight:normal">Thank you, ${order.full_name.split(" ")[0]}.</h1>
          <p>We've received your payment for <strong>${drop?.title ?? "your Sericia order"}</strong>.</p>
          <p>Your package ships from Japan within 48 hours via EMS. Tracking arrives by email once scanned.</p>
          <hr style="border:none;border-top:1px solid #e8e0d3;margin:24px 0" />
          <p style="font-size:13px;color:#6b5e4f">Order ID: ${order.id}<br/>Amount: $${order.amount_usd} USD</p>
          <p style="font-size:13px;color:#6b5e4f">Questions? Reply or write <a href="mailto:contact@sericia.com">contact@sericia.com</a>.</p>
        </div>`,
      }),
      signal: AbortSignal.timeout(10_000),
    }).catch((e) => console.error("[stripe-webhook] resend failed", e));
  }

  // n8n escalation router (fire-and-forget)
  const n8n = process.env.N8N_ESCALATION_WEBHOOK;
  if (n8n) {
    fetch(n8n, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "order_paid",
        order_id: order.id,
        drop_id: order.drop_id,
        amount_usd: order.amount_usd,
        email: order.email,
        provider: "stripe",
      }),
      signal: AbortSignal.timeout(5_000),
    }).catch((e) => console.error("[stripe-webhook] n8n failed", e));
  }
  return NextResponse.json({ ok: true, order_id: order.id, status: "paid" });
}

// ─────────────────────────────────────────────────────────────────────
// Failure path
// ─────────────────────────────────────────────────────────────────────

async function handlePaymentFailed(event: Stripe.Event) {
  const intent = event.data.object as Stripe.PaymentIntent;
  const sericiaOrderId =
    typeof intent.metadata?.sericia_order_id === "string"
      ? intent.metadata.sericia_order_id
      : null;
  if (!sericiaOrderId) {
    return NextResponse.json({ ok: true, skipped: "no_order_id" });
  }
  // We do NOT mark the order `cancelled` on a single failure — the
  // customer can retry the same PaymentIntent (Stripe Elements supports
  // this). Only flip to `cancelled` if the customer explicitly abandons
  // (handled separately by an n8n abandoned-cart workflow).
  // But we DO log the attempt so support can triage.
  const lastError = intent.last_payment_error;
  await supabaseAdmin.from("sericia_events").insert({
    event_name: "payment_failed",
    order_id: sericiaOrderId,
    properties: {
      provider: "stripe",
      payment_intent_id: intent.id,
      decline_code: lastError?.decline_code ?? null,
      error_code: lastError?.code ?? null,
      error_message: lastError?.message ?? null,
    },
  });
  return NextResponse.json({ ok: true, order_id: sericiaOrderId, status: "payment_failed" });
}

// ─────────────────────────────────────────────────────────────────────
// Refund path
// ─────────────────────────────────────────────────────────────────────

async function handleChargeRefunded(event: Stripe.Event) {
  const charge = event.data.object as Stripe.Charge;
  const piId = typeof charge.payment_intent === "string" ? charge.payment_intent : null;
  // Find the order via the stored PaymentIntent id (we put it in
  // crossmint_order_id at success time).
  if (!piId) {
    return NextResponse.json({ ok: true, skipped: "no_payment_intent" });
  }
  const { data: order } = await supabaseAdmin
    .from("sericia_orders")
    .select("id, status, email, full_name, amount_usd")
    .eq("crossmint_order_id", piId)
    .maybeSingle();
  if (!order) {
    return NextResponse.json({ ok: true, skipped: "order_not_found_for_pi" });
  }
  // Stripe sends `charge.refunded` for both partial and full refunds.
  // For Drop #1 simplicity we treat any refund as full → mark `refunded`.
  // (Partial refunds are rare for $58-95 single-product orders; we'd
  // handle them case-by-case via support.)
  await supabaseAdmin
    .from("sericia_orders")
    .update({ status: "refunded", updated_at: new Date().toISOString() })
    .eq("id", order.id);
  await supabaseAdmin.from("sericia_events").insert({
    event_name: "order_refunded",
    distinct_id: order.email,
    order_id: order.id,
    properties: {
      provider: "stripe",
      amount_refunded_cents: charge.amount_refunded,
      payment_intent_id: piId,
    },
  });
  return NextResponse.json({ ok: true, order_id: order.id, status: "refunded" });
}
