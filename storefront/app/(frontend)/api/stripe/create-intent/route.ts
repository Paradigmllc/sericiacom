import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createPaymentIntent } from "@/lib/stripe";

/**
 * F58 — POST /api/stripe/create-intent
 *
 * Mirrors /api/hyperswitch/create-intent semantics for the Stripe rail.
 * Creates a PaymentIntent for a sericia_orders row that's still in
 * `pending` state. Stripe's `automatic_payment_methods: { enabled: true }`
 * means we don't filter methods server-side — Stripe shows what's enabled
 * in the dashboard for the customer's country, so the operator controls
 * the method matrix from Stripe Dashboard → Settings → Payment methods.
 *
 * Request body:
 *   { order_id: string }   — UUID of the sericia_orders row
 *
 * Response (200):
 *   {
 *     payment_intent_id: string,
 *     client_secret: string,    — feed to <Elements options={{ clientSecret }}>
 *     publishable_key: string,  — NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
 *   }
 *
 * Response (4xx/5xx) shapes mirror /api/hyperswitch/create-intent so the
 * same <PaymentError> component handles all rails:
 *   - 400 order_id_required
 *   - 404 order_not_found
 *   - 409 order_not_pending (already paid / cancelled)
 *   - 422 invalid_order_amount / stripe_invalid_amount
 *   - 503 stripe_api_key_missing / publishable_key_missing
 *   - 502 stripe_provider_error / stripe_auth_invalid / stripe_rate_limited
 */
export async function POST(req: NextRequest) {
  const { order_id } = (await req.json().catch(() => ({}))) as { order_id?: unknown };
  if (typeof order_id !== "string" || order_id.length === 0) {
    return NextResponse.json({ error: "order_id_required" }, { status: 400 });
  }

  // ── Fetch order + validate state ────────────────────────────────────
  const { data: order, error: orderErr } = await supabaseAdmin
    .from("sericia_orders")
    .select("id, status, email, amount_usd, country_code")
    .eq("id", order_id)
    .maybeSingle();
  if (orderErr || !order) {
    return NextResponse.json({ error: "order_not_found" }, { status: 404 });
  }
  if (order.status !== "pending") {
    return NextResponse.json(
      { error: "order_not_pending", status: order.status },
      { status: 409 },
    );
  }

  const totalUsd = Number(order.amount_usd ?? 0);
  if (!Number.isFinite(totalUsd) || totalUsd <= 0) {
    return NextResponse.json({ error: "invalid_order_amount" }, { status: 422 });
  }

  // Country detection — same priority order as Hyperswitch:
  //   1. order.country_code   (customer-supplied billing country)
  //   2. CF-IPCountry header  (Cloudflare geoip)
  //   3. fallback: "us"
  // Stripe doesn't filter on this server-side (automatic_payment_methods
  // resolves it from the customer's billing address at confirm-time), but
  // we still attach it to metadata for analytics/refund routing.
  const country = (
    order.country_code ??
    req.headers.get("cf-ipcountry") ??
    "us"
  ).toLowerCase();

  // ── Create the Stripe PaymentIntent ──────────────────────────────────
  try {
    const intent = await createPaymentIntent({
      sericiaOrderId: order.id,
      amountUsd: totalUsd,
      email: order.email,
      country,
    });

    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
    if (!publishableKey) {
      console.error("[stripe/create-intent] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY missing");
      return NextResponse.json(
        {
          error: "publishable_key_missing",
          hint: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY env required",
        },
        { status: 503 },
      );
    }

    return NextResponse.json({
      payment_intent_id: intent.payment_intent_id,
      client_secret: intent.client_secret,
      publishable_key: publishableKey,
      country,
    });
  } catch (e) {
    const err = e as Error & { code?: string; status?: number; details?: unknown };
    const code = err.code ?? "network_error";
    const status =
      code === "stripe_api_key_missing"
        ? 503
        : code === "stripe_invalid_amount"
          ? 422
          : code === "stripe_auth_invalid"
            ? 502
            : code === "stripe_rate_limited"
              ? 429
              : 502;
    console.error("[stripe/create-intent]", code, err.message, err.details);
    return NextResponse.json(
      { error: code, message: err.message, details: err.details },
      { status },
    );
  }
}
