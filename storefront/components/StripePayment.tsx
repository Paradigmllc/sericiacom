"use client";

/**
 * F58 — Stripe embedded payment element.
 *
 * Architecture (mirrors HyperswitchPayment.tsx state machine):
 *   1. On mount, POST /api/stripe/create-intent { order_id }
 *      → server creates a Stripe PaymentIntent, returns client_secret +
 *        publishable_key.
 *   2. loadStripe(publishable_key) — async ESM loader, dynamically pulls
 *      js.stripe.com/v3 (cached by browser after first visit).
 *   3. Mount <Elements> with { clientSecret, appearance }, render inner
 *      <PaymentForm> which uses useStripe() + useElements() hooks.
 *   4. On submit, stripe.confirmPayment({ elements, confirmParams: { return_url } })
 *      → Stripe handles 3DS / Apple Pay sheet / Google Pay / Link / etc.
 *      → on success it redirects to return_url (the /thank-you page)
 *      → on failure it surfaces the error inline; we log + show retry.
 *
 * Three states (same UX contract as HyperswitchPayment):
 *   - loading     paper skeleton while POST creates intent + Stripe loads
 *   - ready       embedded element mounted + Pay button enabled
 *   - submitting  during stripe.confirmPayment() round-trip
 *   - error       inline copy + concierge mailto + retry CTA
 *
 * Why embedded over Stripe Checkout (hosted-redirect):
 *   - Apple Pay button only renders on the merchant origin (sericia.com);
 *     hosted Checkout shows a generic "Apple Pay" sheet from checkout.stripe.com
 *     which feels like leaving the brand.
 *   - 3DS modal opens in-page → no popup blocker, no "where am I?" anxiety.
 *   - Customer never leaves sericia.com → premium brand consistency.
 *   - Link autofill works (~30% conversion lift on Stripe-internal data).
 *
 * Operator-side gates (these surface as error states):
 *   - STRIPE_SECRET_KEY                — backend creates intents
 *   - STRIPE_WEBHOOK_SECRET            — webhook fail-close in production
 *   - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY — Stripe.js loader auth
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { loadStripe, type Stripe, type StripeElementsOptions } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

interface Props {
  orderId: string;
  amountUSD: number;
  receiptEmail: string;
  /**
   * Pre-rendered labels from server-side Payload PaymentSettings lookup.
   * Optional — falls back to hardcoded English copy for backward compat.
   */
  payButtonLabel?: string;
  receiptLine?: string;
}

interface IntentBundle {
  clientSecret: string;
  publishableKey: string;
}

/**
 * Outer component: fetches client_secret, loads Stripe.js, wraps in
 * <Elements>. The inner <PaymentForm> consumes the Stripe context via
 * the hooks API.
 */
export default function StripePayment(props: Props) {
  const [bundle, setBundle] = useState<IntentBundle | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const stripeRef = useRef<Promise<Stripe | null> | null>(null);

  // ── Fetch client_secret + lazily load Stripe.js ──────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/stripe/create-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_id: props.orderId }),
          signal: AbortSignal.timeout(20_000),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? `create_intent_failed_${res.status}`);
        }
        const data = (await res.json()) as {
          client_secret: string;
          publishable_key: string;
        };
        if (cancelled) return;
        // Kick off Stripe.js load — loadStripe() is idempotent + cached
        // globally by Stripe's loader, so multiple calls are safe.
        stripeRef.current = loadStripe(data.publishable_key);
        setBundle({
          clientSecret: data.client_secret,
          publishableKey: data.publishable_key,
        });
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : String(e);
        console.error("[StripePayment] init failed", msg);
        setErrorMessage(msg);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [props.orderId]);

  const options: StripeElementsOptions | undefined = useMemo(() => {
    if (!bundle) return undefined;
    return {
      clientSecret: bundle.clientSecret,
      // Sericia ink/paper palette mapped to Stripe Elements appearance API.
      // Stripe's "stripe" base + variables overrides → matches Tailwind
      // tokens used elsewhere (sericia-ink #21231d, sericia-paper-card
      // #f5f1e8, sericia-accent for danger).
      appearance: {
        theme: "stripe",
        variables: {
          colorPrimary: "#21231d",
          colorBackground: "#f5f1e8",
          colorText: "#21231d",
          colorDanger: "#9b2c2c",
          fontFamily: "Georgia, serif",
          borderRadius: "0px",
          spacingUnit: "4px",
        },
        rules: {
          ".Input": {
            border: "1px solid #d8cfbe",
            boxShadow: "none",
          },
          ".Input:focus": {
            border: "1px solid #21231d",
            boxShadow: "none",
          },
          ".Tab": {
            border: "1px solid #d8cfbe",
            boxShadow: "none",
          },
        },
      },
    };
  }, [bundle]);

  if (errorMessage) return <PaymentError orderId={props.orderId} errorMessage={errorMessage} />;

  if (!bundle || !stripeRef.current || !options) {
    return (
      <div className="space-y-3" aria-live="polite" aria-busy="true">
        <div className="h-12 bg-sericia-line/40 animate-pulse" />
        <div className="h-12 bg-sericia-line/40 animate-pulse" />
        <div className="h-12 bg-sericia-line/40 animate-pulse" />
      </div>
    );
  }

  return (
    <Elements stripe={stripeRef.current} options={options}>
      <PaymentForm {...props} />
    </Elements>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Inner form (consumes Elements context via hooks)
// ─────────────────────────────────────────────────────────────────────

function PaymentForm({ orderId, amountUSD, receiptEmail, payButtonLabel, receiptLine }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const t = useTranslations("pay");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // F59 — track PaymentElement DOM-mount completion separately from
  // useStripe()/useElements() readiness. The hooks return non-null as soon
  // as the <Elements> provider mounts, but the inner <PaymentElement> takes
  // an extra round-trip to fetch country-specific methods + render the
  // tabs. If the user clicks Pay during that window, Stripe throws
  //   "Invalid value for stripe.confirmPayment(): elements should have a
  //    mounted Payment Element or Express Checkout Element"
  // Reported by Daisy on iPhone 2026-05-10 (3rd screenshot in F58 review).
  // Fix: gate the Pay button on `paymentElementReady` set by the
  // PaymentElement.onReady callback.
  const [paymentElementReady, setPaymentElementReady] = useState(false);

  const ready = stripe !== null && elements !== null && paymentElementReady;

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements || !paymentElementReady) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/thank-you/${orderId}`,
          receipt_email: receiptEmail,
        },
        // "if_required" means: most card payments stay in-page (3DS modal
        // pops over our UI), but redirect-required methods (Klarna,
        // bank-transfer) go to the bank's site. The webhook is the single
        // source of truth either way.
        redirect: "if_required",
      });

      if (result.error) {
        // type "validation_error" → user-fixable (CVV wrong) — show inline.
        // type "card_error" → bank declined → friendly mailto retry.
        // type "api_error" → infra issue → retry.
        setErrorMessage(result.error.message ?? "Payment failed. Please try again.");
        setSubmitting(false);
        return;
      }
      // No redirect needed — payment succeeded synchronously (Apple Pay /
      // Google Pay / Link). Push to thank-you page; the webhook has
      // (or will momentarily) flip the order to `paid`.
      router.push(`/thank-you/${orderId}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[StripePayment] confirm failed", msg);
      setErrorMessage(msg);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handlePay} className="space-y-6">
      {/* While the PaymentElement loads its iframe + fetches available
          payment methods, show a brand-matched paper skeleton so the
          customer doesn't see a sudden empty space below "AMOUNT DUE".
          Skeleton is hidden as soon as onReady fires. */}
      {!paymentElementReady && (
        <div className="space-y-3" aria-live="polite" aria-busy="true">
          <div className="h-10 bg-sericia-line/40 animate-pulse" />
          <div className="h-10 bg-sericia-line/40 animate-pulse" />
          <div className="h-10 bg-sericia-line/40 animate-pulse" />
        </div>
      )}
      <PaymentElement
        options={{
          layout: "tabs",
          // Stripe defaults receipt_email to the customer-typed input;
          // we pre-fill via confirmParams so the customer doesn't re-type.
          defaultValues: { billingDetails: { email: receiptEmail } },
        }}
        onReady={() => setPaymentElementReady(true)}
        onLoadError={(e) => {
          // Surface mount errors inline (rare: corrupt clientSecret,
          // expired PaymentIntent, country has no enabled methods).
          const msg = (e?.error?.message as string | undefined) ?? "Payment form failed to load";
          console.error("[StripePayment] PaymentElement onLoadError", e);
          setErrorMessage(msg);
        }}
      />
      <button
        type="submit"
        disabled={!ready || submitting}
        className="w-full bg-sericia-ink text-sericia-paper py-4 px-6 text-[14px] tracking-[0.1em] uppercase font-normal transition-opacity hover:opacity-86 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitting
          ? t("processing")
          : !paymentElementReady
            ? t("loading_form")
            : (payButtonLabel ?? t("pay_button_fmt", { amount: `${amountUSD}.00` }))}
      </button>
      {errorMessage && (
        <p className="text-[13px] text-[#9b2c2c]" role="alert">
          {errorMessage}
        </p>
      )}
      <p className="text-[11px] text-sericia-ink-mute tracking-wider uppercase text-center">
        {receiptLine ?? t("receipt_to_fmt", { email: receiptEmail })}
      </p>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Error UI (init failed — couldn't fetch client_secret or load Stripe.js)
// ─────────────────────────────────────────────────────────────────────

function PaymentError({ orderId, errorMessage }: { orderId: string; errorMessage: string }) {
  const t = useTranslations("pay");
  return (
    <div className="space-y-6">
      <p className="text-[15px] text-sericia-ink-soft">
        {t("init_error_title")}
      </p>
      <p className="text-[13px] text-sericia-ink-mute">
        {t("init_error_concierge_prefix")}{" "}
        <a className="underline-link" href={`mailto:contact@sericia.com?subject=Order ${orderId}`}>
          contact@sericia.com
        </a>{" "}
        {t("init_error_concierge_suffix")}
      </p>
      {process.env.NODE_ENV !== "production" && (
        <pre className="text-[11px] text-sericia-ink-mute font-mono whitespace-pre-wrap">
          {errorMessage}
        </pre>
      )}
    </div>
  );
}
