import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createPaymentIntent } from "@/lib/hyperswitch";
import { getEnabledMethodsForCountry } from "@/lib/payment-settings";

/**
 * F54 — POST /api/hyperswitch/create-intent
 *
 * Mirrors /api/pay/create (Crossmint) for the Hyperswitch rail. Creates a
 * payment intent for a sericia_orders row that's still in `pending` state,
 * filtering allowed payment methods by the customer's billing country.
 *
 * Request body:
 *   { order_id: string }   — UUID of the sericia_orders row
 *
 * Response (200):
 *   {
 *     payment_id: string,
 *     client_secret: string,    — feed to HyperLoader.confirm()
 *     publishable_key: string,  — NEXT_PUBLIC_HYPERSWITCH_PUBLISHABLE_KEY
 *     methods: string[],        — country-filtered method list (debug)
 *   }
 *
 * Response (4xx/5xx) shapes mirror /api/pay/create so the same
 * <PaymentError> component handles both rails:
 *   - 400 order_id_required / invalid_order_amount
 *   - 404 order_not_found
 *   - 409 order_not_pending (already paid / cancelled)
 *   - 503 hyperswitch_api_key_missing / hyperswitch_profile_missing
 *   - 502 hyperswitch_provider_error / network_error
 */
export async function POST(req: NextRequest) {
  const { order_id } = (await req.json().catch(() => ({}))) as { order_id?: unknown };
  if (typeof order_id !== "string" || order_id.length === 0) {
    return NextResponse.json({ error: "order_id_required" }, { status: 400 });
  }

  // ── Fetch order + validate state ─────────────────────────────────────
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

  // ── Country detection priority ──────────────────────────────────────
  // 1. order.country_code     (customer-supplied billing country, gold standard)
  // 2. CF-IPCountry header    (Cloudflare geoip — request-time IP)
  // 3. fallback: "us"         (largest market, safest default)
  //
  // The country drives the payment method list shown — wrong country =
  // suboptimal method order but never a broken checkout (DEFAULT_METHODS
  // covers card+Apple+Google everywhere). So this is best-effort, not
  // safety-critical.
  const country = (
    order.country_code ??
    req.headers.get("cf-ipcountry") ??
    "us"
  ).toLowerCase();

  // F55: Payload-backed lookup with hardcoded fallback. Editor-controlled
  // matrix (paymentSettings global) takes precedence; the static matrix in
  // payment-routing.ts is the safety net for build-time / cold-start /
  // Payload outage paths.
  const methods = await getEnabledMethodsForCountry(country, "en");

  // ── Build the return URL — Hyperswitch redirects here on completion ─
  // Hyperswitch appends ?payment_id=...&status=succeeded|failed to the URL.
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("host") ?? "sericia.com";
  const returnUrl = `${proto}://${host}/thank-you/${order.id}`;

  // ── Create the Hyperswitch PaymentIntent ────────────────────────────
  try {
    const intent = await createPaymentIntent({
      sericiaOrderId: order.id,
      amountUsd: totalUsd,
      email: order.email,
      country,
      allowedPaymentMethods: methods,
      returnUrl,
    });

    const publishableKey = process.env.NEXT_PUBLIC_HYPERSWITCH_PUBLISHABLE_KEY?.trim();
    if (!publishableKey) {
      console.error("[hyperswitch/create-intent] NEXT_PUBLIC_HYPERSWITCH_PUBLISHABLE_KEY missing");
      return NextResponse.json(
        { error: "publishable_key_missing", hint: "NEXT_PUBLIC_HYPERSWITCH_PUBLISHABLE_KEY env required" },
        { status: 503 },
      );
    }

    return NextResponse.json({
      payment_id: intent.payment_id,
      client_secret: intent.client_secret,
      publishable_key: publishableKey,
      methods,
      country,
    });
  } catch (e) {
    const err = e as Error & { code?: string; status?: number; details?: unknown };
    const code = err.code ?? "network_error";
    const status =
      code === "hyperswitch_api_key_missing" || code === "hyperswitch_profile_missing"
        ? 503
        : code === "hyperswitch_invalid_amount"
          ? 422
          : 502;
    console.error("[hyperswitch/create-intent]", code, err.message, err.details);
    return NextResponse.json(
      { error: code, message: err.message, details: err.details },
      { status },
    );
  }
}
