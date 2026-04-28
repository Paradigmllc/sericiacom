import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * POST /api/pay/create — initialise a Crossmint Headless Checkout order.
 *
 * Reads `sericia_orders` + `sericia_order_items` (multi-line cart era), calls
 * Crossmint's Order API with line items + customer email, persists the
 * `crossmint_order_id`, and returns either a `clientSecret` (for the Stripe
 * Payment Element shipped by Crossmint) or a `hostedUrl` (fallback).
 *
 * Env: CROSSMINT_SERVER_SK (production-tier server SK), CROSSMINT_ENV
 * (default "production"). The previous code referred to a non-existent
 * `CROSSMINT_SERVER_API_KEY` and a single-item order schema, both of which
 * silently broke after the multi-line cart migration.
 *
 * Failure modes:
 *   - SK missing → 503 payment_provider_unconfigured
 *   - Crossmint 403 → 502 provider_scope_missing (operator must enable
 *     orders.create scope in Crossmint Console)
 *   - Network → 502 network_error
 */
export async function POST(req: NextRequest) {
  const { order_id } = (await req.json().catch(() => ({}))) as {
    order_id?: unknown;
  };
  if (typeof order_id !== "string" || order_id.length === 0) {
    return NextResponse.json({ error: "order_id_required" }, { status: 400 });
  }

  const { data: order, error: orderErr } = await supabaseAdmin
    .from("sericia_orders")
    .select("*")
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

  // Multi-line cart support — sericia_order_items lives 1:N under orders.
  const { data: items, error: itemsErr } = await supabaseAdmin
    .from("sericia_order_items")
    .select("product_id, name, quantity, unit_price_usd")
    .eq("order_id", order_id);
  if (itemsErr) {
    console.error("[pay/create] items query failed", itemsErr);
    return NextResponse.json({ error: "items_unavailable" }, { status: 500 });
  }

  // Read the canonical env. Old code used the wrong name (CROSSMINT_SERVER_API_KEY)
  // which silently fell through to undefined and hung the flow. Coolify env
  // is `CROSSMINT_SERVER_SK` per memory/reference_api_keys.md.
  const apiKey = process.env.CROSSMINT_SERVER_SK?.trim();
  const env = process.env.CROSSMINT_ENV ?? "production";
  const base =
    env === "staging"
      ? "https://staging.crossmint.com/api/2022-06-09"
      : "https://www.crossmint.com/api/2022-06-09";

  if (!apiKey) {
    console.error(
      "[pay/create] CROSSMINT_SERVER_SK not set — payment provider unconfigured",
    );
    return NextResponse.json(
      {
        error: "payment_provider_unconfigured",
        hint: "CROSSMINT_SERVER_SK env var missing in runtime",
      },
      { status: 503 },
    );
  }

  const totalUsd = Number(order.amount_usd ?? 0);
  if (!Number.isFinite(totalUsd) || totalUsd <= 0) {
    return NextResponse.json({ error: "invalid_order_amount" }, { status: 422 });
  }

  // Crossmint Headless Order — `payment.method: "stripe-payment-element"`
  // returns a Stripe `clientSecret` for the embedded Payment Element. The
  // `lineItems.callData` schema is what Crossmint expects when integrating a
  // non-NFT, fiat-only order.
  const payload = {
    payment: {
      method: "stripe-payment-element",
      currency: "usd",
      receiptEmail: order.email,
    },
    lineItems: {
      callData: {
        totalPrice: totalUsd.toFixed(2),
        // Crossmint requires a quantity field even on multi-line carts;
        // sum across line items so the total reflects what we'll charge.
        quantity: (items ?? []).reduce(
          (sum, i) => sum + Number(i.quantity ?? 0),
          0,
        ) || 1,
      },
    },
    metadata: {
      sericia_order_id: order.id,
      sericia_email: order.email,
      sericia_item_count: (items ?? []).length,
    },
  };

  try {
    const res = await fetch(`${base}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      // 403 → SK lacks `orders.create` scope (operator must fix in console).
      // Surface a structured error so the UI can show a precise CTA, not
      // a vague "Try again later".
      const errKey =
        res.status === 403
          ? "provider_scope_missing"
          : res.status === 401
            ? "provider_auth_invalid"
            : "provider_error";
      console.error("[pay/create] crossmint", res.status, JSON.stringify(data));
      return NextResponse.json(
        { error: errKey, status: res.status, details: data },
        { status: res.status === 401 || res.status === 403 ? 502 : 502 },
      );
    }

    // Persist the Crossmint orderId for webhook reconciliation later.
    const orderObj = (data as { order?: { orderId?: string } })?.order;
    const crossmintOrderId = orderObj?.orderId ?? null;
    const clientSecret =
      (data as { clientSecret?: string })?.clientSecret ??
      (data as {
        order?: { payment?: { preparation?: { stripeClientSecret?: string } } };
      })?.order?.payment?.preparation?.stripeClientSecret ??
      null;

    if (crossmintOrderId) {
      await supabaseAdmin
        .from("sericia_orders")
        .update({
          crossmint_order_id: crossmintOrderId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order_id);
    }

    return NextResponse.json({
      clientSecret,
      crossmintOrderId,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[pay/create] network error", msg, e);
    return NextResponse.json({ error: "network_error", details: msg }, { status: 502 });
  }
}
