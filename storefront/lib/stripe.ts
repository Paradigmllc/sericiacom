/**
 * F58 — Stripe server-side client.
 *
 * Stripe is Sericia's primary production payment rail (replaces Hyperswitch
 * Cloud as the launch rail while Crossmint Onramp Sales approval is
 * pending — see docs/launch-operator-checklist.md §0).
 *
 * Why Stripe direct (vs orchestrator like Hyperswitch):
 *   - Crossmint Sales review stalled at "We're reviewing your submission"
 *     (screenshot 2026-05-10). Hyperswitch Cloud needs separate signup +
 *     connector wiring + a second webhook secret. For launch we want a
 *     single vendor with battle-tested infra, then re-add USDC (Crossmint)
 *     and orchestration (Hyperswitch OSS, self-hosted) as enhancements.
 *   - Stripe's `constructEvent()` does signature + timestamp tolerance +
 *     replay protection in one call — strictly safer than rolling our own.
 *   - Apple Pay / Google Pay / Link auto-render with zero extra code via
 *     `automatic_payment_methods: { enabled: true }`.
 *
 * Required env (set in Coolify):
 *   STRIPE_SECRET_KEY                       — `sk_live_*` (server-only).
 *                                             Server fetches PaymentIntent.
 *   STRIPE_WEBHOOK_SECRET                   — `whsec_*` (server-only).
 *                                             Issued by Stripe Dashboard
 *                                             when you register the
 *                                             /api/stripe/webhook endpoint.
 *
 * Public env (browser-readable, NEXT_PUBLIC_ prefix):
 *   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY      — `pk_live_*`. Loads Stripe.js
 *                                             in the browser to mount
 *                                             Elements.
 *
 * Bundle discipline note: we use the `stripe` SDK on the server (Node)
 * and `@stripe/stripe-js` (loader, ~5KB) + `@stripe/react-stripe-js`
 * (~30KB) in the browser. This is well below the bundle ceiling that
 * caused F42 OOM (~138 static pages worth of webpack work was the trigger,
 * not deps).
 */

import Stripe from "stripe";

let _client: Stripe | null = null;

/**
 * Lazily-initialised Stripe singleton. Throws on first use if
 * STRIPE_SECRET_KEY is missing — caller wraps in try/catch and surfaces a
 * 503 with an operator-facing hint.
 */
export function getStripe(): Stripe {
  if (_client) return _client;
  const apiKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!apiKey) {
    const err = new Error("STRIPE_SECRET_KEY env required") as Error & { code?: string };
    err.code = "stripe_api_key_missing";
    throw err;
  }
  _client = new Stripe(apiKey, {
    // Pin API version — Stripe ships breaking changes silently if you
    // don't pin. Bump deliberately when migrating, with regression tests.
    apiVersion: "2025-09-30.clover",
    typescript: true,
    // Auto-retry idempotent requests on network errors (Stripe SDK
    // default = 0). Sericia's checkout is single-attempt UX, so failed
    // network = paying customer sees red error + retries manually.
    maxNetworkRetries: 2,
  });
  return _client;
}

export interface CreatePaymentIntentInput {
  /** Sericia order id — used as `metadata.sericia_order_id` for reconciliation. */
  sericiaOrderId: string;
  /** USD amount in dollars (integer or 2-decimal). Will be converted to cents. */
  amountUsd: number;
  /** Customer email — Stripe uses for receipts + risk scoring. */
  email: string;
  /** ISO 3166-1 alpha-2 (lowercase) — billing/customer country. */
  country: string;
}

export interface StripePaymentIntentResult {
  payment_intent_id: string;
  client_secret: string;
  status: Stripe.PaymentIntent.Status;
  amount: number;
  currency: string;
}

/**
 * Create a Stripe PaymentIntent for a Sericia order.
 *
 * Uses `automatic_payment_methods: { enabled: true }` so Stripe shows
 * every method enabled in the dashboard for the customer's country —
 * card / Apple Pay / Google Pay / Link by default; the operator can
 * toggle Klarna / Affirm / iDEAL / SEPA in Stripe Dashboard → Settings →
 * Payment methods without any code change.
 *
 * Idempotency: we set the idempotency key to `sericia_intent_{orderId}`
 * so retried POSTs (network blip → user clicks again) return the same
 * PaymentIntent instead of creating duplicates.
 *
 * Throws on auth / network / Stripe errors — caller wraps in try/catch
 * and maps `err.code` to an HTTP status.
 */
export async function createPaymentIntent(
  input: CreatePaymentIntentInput,
): Promise<StripePaymentIntentResult> {
  const stripe = getStripe();

  const amountCents = Math.round(input.amountUsd * 100);
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    const err = new Error(`invalid amount: ${input.amountUsd}`) as Error & { code?: string };
    err.code = "stripe_invalid_amount";
    throw err;
  }

  try {
    const intent = await stripe.paymentIntents.create(
      {
        amount: amountCents,
        currency: "usd",
        automatic_payment_methods: { enabled: true },
        receipt_email: input.email,
        description: `Sericia order ${input.sericiaOrderId}`,
        metadata: {
          sericia_order_id: input.sericiaOrderId,
          sericia_email: input.email,
          sericia_country: input.country.toLowerCase(),
        },
      },
      {
        idempotencyKey: `sericia_intent_${input.sericiaOrderId}`,
      },
    );

    if (!intent.client_secret) {
      const err = new Error("Stripe returned no client_secret") as Error & { code?: string };
      err.code = "stripe_malformed_response";
      throw err;
    }

    return {
      payment_intent_id: intent.id,
      client_secret: intent.client_secret,
      status: intent.status,
      amount: intent.amount,
      currency: intent.currency,
    };
  } catch (e) {
    if ((e as Error & { code?: string }).code === "stripe_malformed_response") throw e;
    if ((e as Error & { code?: string }).code === "stripe_invalid_amount") throw e;
    if ((e as Error & { code?: string }).code === "stripe_api_key_missing") throw e;
    // Map Stripe SDK errors to our error code shape so /api/stripe/*
    // routes can return consistent JSON to the client.
    const stripeErr = e as Stripe.errors.StripeError;
    const err = new Error(`Stripe ${stripeErr.statusCode ?? ""}: ${stripeErr.message}`) as Error & {
      code?: string;
      status?: number;
      details?: unknown;
    };
    err.code =
      stripeErr.type === "StripeAuthenticationError"
        ? "stripe_auth_invalid"
        : stripeErr.type === "StripePermissionError"
          ? "stripe_scope_missing"
          : stripeErr.type === "StripeRateLimitError"
            ? "stripe_rate_limited"
            : "stripe_provider_error";
    err.status = stripeErr.statusCode;
    err.details = { type: stripeErr.type, code: stripeErr.code };
    throw err;
  }
}

/**
 * Verify and parse a Stripe webhook payload using the official utility.
 *
 * Stripe's `constructEvent()` does:
 *   - HMAC SHA-256 signature check
 *   - Timestamp tolerance (default 300s — protects against replay)
 *   - Multiple signature support (for secret rotation)
 *
 * Returns the parsed Event on success. Throws (with `.code = "stripe_signature_invalid"`)
 * on any verification failure — caller returns 401.
 *
 * IMPORTANT: pass the **raw request body string** here. Next.js App Router's
 * `await req.json()` parses + re-stringifies, which breaks the signature.
 * The webhook route uses `await req.text()` and forwards that exact bytes.
 */
export function verifyWebhookEvent(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
): Stripe.Event {
  const stripe = getStripe();
  if (!signatureHeader) {
    const err = new Error("missing stripe-signature header") as Error & { code?: string };
    err.code = "stripe_signature_invalid";
    throw err;
  }
  try {
    return stripe.webhooks.constructEvent(rawBody, signatureHeader, secret);
  } catch (e) {
    const err = new Error(
      `Stripe signature verification failed: ${(e as Error).message}`,
    ) as Error & { code?: string };
    err.code = "stripe_signature_invalid";
    throw err;
  }
}
