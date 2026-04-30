"use client";

/**
 * F54 — Hyperswitch embedded payment element.
 *
 * Architecture (mirrors CrossmintPayment.tsx state machine):
 *   1. On mount, POST /api/hyperswitch/create-intent { order_id }
 *      → server creates a Hyperswitch PaymentIntent filtered to the
 *        country's enabled methods, returns client_secret + publishable.
 *   2. Inject HyperLoader.js script tag (idempotent — only loads once
 *      per page lifetime, cached by browser).
 *   3. Initialise window.Hyper(publishableKey, { client_secret }) →
 *      .elements() → .create("payment") → .mount("#hyper-payment-element")
 *   4. On submit, hyper.confirmPayment({ elements, confirmParams: { return_url } })
 *      → Hyperswitch handles 3DS / Apple Pay sheet / PayPal popup / etc.
 *      → on success it redirects to return_url (the /thank-you page)
 *      → on failure it surfaces the error inline; we log + show retry.
 *
 * Three states (same UX contract as CrossmintPayment):
 *   - loading    paper skeleton while POST creates intent + script loads
 *   - ready      embedded element mounted + Pay button enabled
 *   - error      inline copy + concierge mailto + retry CTA
 *
 * Why embedded over hosted-redirect:
 *   - Apple Pay button only renders on the same origin as the merchant
 *     (Apple verifies sericia.com — verified once, works forever).
 *   - Customer never leaves sericia.com → premium brand consistency.
 *   - 3DS modal opens in-page (Stripe's authentication UI), no popup blocker.
 *   - No "where am I being redirected to?" anxiety on the conversion edge.
 *
 * Operator-side gates (these surface as error states with operator-facing copy):
 *   - HYPERSWITCH_API_KEY              — backend creates intents
 *   - HYPERSWITCH_PROFILE_ID           — connector profile (Stripe + PayPal)
 *   - HYPERSWITCH_WEBHOOK_SECRET       — webhook fail-close in production
 *   - NEXT_PUBLIC_HYPERSWITCH_PUBLISHABLE_KEY  — HyperLoader auth
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const HYPERLOADER_SRC = "https://beta.hyperswitch.io/v1/HyperLoader.js";

type HyperInstance = {
  elements: (opts: { clientSecret: string; appearance?: object }) => {
    create: (
      type: "payment",
      opts?: { layout?: string; paymentMethodOrder?: readonly string[] },
    ) => {
      mount: (selector: string) => void;
      on: (evt: string, cb: (e: unknown) => void) => void;
    };
    submit: () => Promise<{ error?: { message: string } }>;
  };
  confirmPayment: (args: {
    elements: ReturnType<HyperInstance["elements"]>;
    confirmParams: { return_url: string };
    redirect?: "always" | "if_required";
  }) => Promise<{ error?: { message: string; type?: string } }>;
};

declare global {
  interface Window {
    Hyper?: (publishableKey: string, options?: { customBackendUrl?: string }) => HyperInstance;
  }
}

interface Props {
  orderId: string;
  amountUSD: number;
  receiptEmail: string;
  /**
   * Pre-rendered labels from server-side Payload PaymentSettings lookup.
   * Optional — if not passed, the component falls back to hardcoded
   * English copy (kept for backward compat with any caller that hasn't
   * migrated to F55 yet).
   */
  payButtonLabel?: string;
  receiptLine?: string;
}

export default function HyperswitchPayment({
  orderId,
  amountUSD,
  receiptEmail,
  payButtonLabel,
  receiptLine,
}: Props) {
  const router = useRouter();
  const [state, setState] = useState<"loading" | "ready" | "submitting" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [methods, setMethods] = useState<readonly string[]>([]);
  const elementsRef = useRef<ReturnType<HyperInstance["elements"]> | null>(null);
  const hyperRef = useRef<HyperInstance | null>(null);

  // ── Load HyperLoader script + create intent + mount element ──────────
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        // 1. POST /api/hyperswitch/create-intent
        const res = await fetch("/api/hyperswitch/create-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_id: orderId }),
          signal: AbortSignal.timeout(20_000),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? `create_intent_failed_${res.status}`);
        }
        const data = (await res.json()) as {
          payment_id: string;
          client_secret: string;
          publishable_key: string;
          methods: readonly string[];
        };

        // 2. Load HyperLoader (idempotent)
        if (!window.Hyper) {
          await new Promise<void>((resolve, reject) => {
            const existing = document.querySelector<HTMLScriptElement>(`script[src="${HYPERLOADER_SRC}"]`);
            if (existing) {
              existing.addEventListener("load", () => resolve(), { once: true });
              existing.addEventListener("error", () => reject(new Error("hyperloader_load_failed")), { once: true });
              return;
            }
            const s = document.createElement("script");
            s.src = HYPERLOADER_SRC;
            s.async = true;
            s.onload = () => resolve();
            s.onerror = () => reject(new Error("hyperloader_load_failed"));
            document.head.appendChild(s);
          });
        }
        if (cancelled) return;
        if (!window.Hyper) throw new Error("hyperloader_unavailable");

        // 3. Init Hyper + mount element
        const hyper = window.Hyper(data.publishable_key);
        const elements = hyper.elements({
          clientSecret: data.client_secret,
          // Sericia ink/paper palette mapped to HyperLoader appearance API.
          appearance: {
            theme: "minimal",
            variables: {
              colorPrimary: "#21231d",
              colorBackground: "#f5f1e8",
              colorText: "#21231d",
              colorDanger: "#9b2c2c",
              fontFamily: "Georgia, serif",
              borderRadius: "0px",
            },
          },
        });
        const paymentEl = elements.create("payment", {
          layout: "tabs",
          paymentMethodOrder: data.methods,
        });
        paymentEl.mount("#hyper-payment-element");

        hyperRef.current = hyper;
        elementsRef.current = elements;
        setMethods(data.methods);
        setState("ready");
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : String(e);
        console.error("[HyperswitchPayment] init failed", msg);
        setErrorMessage(msg);
        setState("error");
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  // ── Submit handler ───────────────────────────────────────────────────
  async function handlePay() {
    if (!hyperRef.current || !elementsRef.current) return;
    setState("submitting");
    setErrorMessage(null);

    try {
      const submitResult = await elementsRef.current.submit();
      if (submitResult.error) throw new Error(submitResult.error.message);

      const result = await hyperRef.current.confirmPayment({
        elements: elementsRef.current,
        confirmParams: {
          return_url: `${window.location.origin}/thank-you/${orderId}`,
        },
        redirect: "if_required",
      });

      if (result.error) {
        // type=validation_error → user-fixable (CVV wrong etc.) — show inline.
        // type=card_error → bank declined; show a friendly mailto.
        // type=api_error → infra issue; show retry.
        setErrorMessage(result.error.message);
        setState("ready"); // let them retry
        return;
      }

      // No redirect needed — payment succeeded synchronously (e.g. Apple Pay)
      router.push(`/thank-you/${orderId}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[HyperswitchPayment] confirm failed", msg);
      setErrorMessage(msg);
      setState("ready");
    }
  }

  // ── UI ───────────────────────────────────────────────────────────────
  if (state === "error") {
    return (
      <div className="space-y-6">
        <p className="text-[15px] text-sericia-ink-soft">
          We couldn't start the payment process just now. This is on our side, not yours.
        </p>
        <p className="text-[13px] text-sericia-ink-mute">
          Reach our concierge directly at{" "}
          <a className="underline-link" href={`mailto:contact@sericia.com?subject=Order ${orderId}`}>
            contact@sericia.com
          </a>{" "}
          and we'll process the order by hand.
        </p>
        {process.env.NODE_ENV !== "production" && errorMessage && (
          <pre className="text-[11px] text-sericia-ink-mute font-mono whitespace-pre-wrap">
            {errorMessage}
          </pre>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {state === "loading" && (
        <div className="space-y-3" aria-live="polite" aria-busy="true">
          <div className="h-12 bg-sericia-line/40 animate-pulse" />
          <div className="h-12 bg-sericia-line/40 animate-pulse" />
          <div className="h-12 bg-sericia-line/40 animate-pulse" />
        </div>
      )}

      <div id="hyper-payment-element" />

      {state !== "loading" && (
        <>
          <button
            type="button"
            onClick={handlePay}
            disabled={state === "submitting"}
            className="w-full bg-sericia-ink text-sericia-paper py-4 px-6 text-[14px] tracking-[0.1em] uppercase font-normal transition-opacity hover:opacity-86 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {state === "submitting"
              ? "Processing…"
              : (payButtonLabel ?? `Pay $${amountUSD}.00 USD`)}
          </button>
          {errorMessage && (
            <p className="text-[13px] text-[#9b2c2c]" role="alert">
              {errorMessage}
            </p>
          )}
          <p className="text-[11px] text-sericia-ink-mute tracking-wider uppercase text-center">
            {receiptLine ?? `Receipt to ${receiptEmail} · Secured by Hyperswitch`}
          </p>
          {process.env.NODE_ENV !== "production" && methods.length > 0 && (
            <p className="text-[10px] text-sericia-ink-mute font-mono">
              [debug] methods: {methods.join(", ")}
            </p>
          )}
        </>
      )}
    </div>
  );
}
