import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase-admin";

/**
 * Creates a Crossmint Headless Checkout order for a pending sericia_orders row.
 * Returns { clientSecret, orderId } for the client <CrossmintPaymentElement>.
 * Docs: https://docs.crossmint.com/payments/headless/overview
 */
export async function POST(req: NextRequest) {
  const { order_id } = await req.json().catch(() => ({}));
  if (!order_id || typeof order_id !== "string") {
    return NextResponse.json({ error: "order_id_required" }, { status: 400 });
  }

  const { data: order, error } = await supabaseAdmin
    .from("sericia_orders")
    .select("*")
    .eq("id", order_id)
    .maybeSingle();
  if (error || !order) return NextResponse.json({ error: "order_not_found" }, { status: 404 });
  if (order.status !== "pending") {
    return NextResponse.json({ error: "order_not_pending", status: order.status }, { status: 409 });
  }

  const apiKey = process.env.CROSSMINT_SERVER_API_KEY;
  const env = process.env.CROSSMINT_ENV ?? "production";
  const base = env === "staging"
    ? "https://staging.crossmint.com/api/2022-06-09"
    : "https://www.crossmint.com/api/2022-06-09";

  if (!apiKey) {
    console.error("[pay/create] CROSSMINT_SERVER_API_KEY not set");
    return NextResponse.json({ error: "payment_provider_unavailable" }, { status: 500 });
  }

  const payload = {
    payment: {
      method: "stripe-payment-element",
      currency: "usd",
      receiptEmail: order.email,
    },
    lineItems: {
      callData: {
        totalPrice: order.amount_usd.toFixed(2),
        quantity: order.quantity,
      },
    },
    metadata: {
      sericia_order_id: order.id,
      drop_id: order.drop_id,
      email: order.email,
    },
  };

  try {
    const res = await fetch(`${base}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-KEY": apiKey },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("[pay/create] crossmint error", res.status, data);
      return NextResponse.json({ error: "provider_error", details: data }, { status: 502 });
    }
    await supabaseAdmin
      .from("sericia_orders")
      .update({ crossmint_order_id: data?.order?.orderId ?? null, updated_at: new Date().toISOString() })
      .eq("id", order_id);
    return NextResponse.json({
      clientSecret: data?.clientSecret ?? data?.order?.payment?.preparation?.stripeClientSecret ?? null,
      crossmintOrderId: data?.order?.orderId ?? null,
    });
  } catch (e) {
    console.error("[pay/create] network error", e);
    return NextResponse.json({ error: "network_error" }, { status: 502 });
  }
}
