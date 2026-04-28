"use client";

/**
 * CrossmintPayment — Aesop-tier card payment surface backed by Crossmint
 * Headless Checkout. Designed to be drop-in for /pay/[orderId] and renders
 * three discrete states:
 *
 *   1. Loading        — spinner + brand-toned card while we POST to
 *                       /api/pay/create which talks to Crossmint.
 *   2. Ready (success) — Crossmint returned a hosted-checkout URL or a
 *                       Stripe-style clientSecret. We surface a "Pay $X"
 *                       button that opens Crossmint's PCI-compliant page
 *                       in the same tab. Visitor enters card → success
 *                       webhook fires our /api/crossmint-webhook → order
 *                       moves to `paid` and an email goes out.
 *   3. Failed         — graceful explainer with concierge mail-link as
 *                       a last-resort backup. Distinguishes between:
 *                         • `payment_provider_unconfigured` (env missing —
 *                           our fault, treat as outage)
 *                         • `provider_scope_missing` / 403 (Crossmint
 *                           project hasn't enabled fiat checkout yet —
 *                           operator must enable in console)
 *                         • generic network / 5xx — retryable
 *
 * Why a redirect (vs embedded Elements):
 *   Embedded checkout requires either Crossmint's React SDK (which needs
 *   NEXT_PUBLIC_CROSSMINT_CLIENT_ID — currently unset) OR Stripe.js
 *   (which needs a Stripe pk we don't own; Crossmint owns the Stripe
 *   account). Redirecting to Crossmint's hosted /orders/{id}/pay page
 *   side-steps both, gives us PCI scope-out, and matches what most D2C
 *   storefronts on Crossmint do. The UX cost is one tab transition.
 *
 * Replaces the previous "concierge mailto" placeholder, which was a
 * launch-blocker — visitors had no way to actually buy.
 */

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

type Props = { orderId: string; amountUSD: number };

type ApiResponse =
  | { ok: true; clientSecret: string | null; crossmintOrderId: string | null }
  | {
      ok: false;
      error:
        | "payment_provider_unconfigured"
        | "provider_scope_missing"
        | "provider_auth_invalid"
        | "provider_error"
        | "network_error"
        | "order_not_found"
        | "order_not_pending"
        | "items_unavailable"
        | "invalid_order_amount";
      status?: number;
    };

const HOSTED_CHECKOUT_BASE =
  process.env.NEXT_PUBLIC_CROSSMINT_ENV === "staging"
    ? "https://staging.crossmint.com/orders"
    : "https://www.crossmint.com/orders";

export default function CrossmintPayment({ orderId, amountUSD }: Props) {
  const t = useTranslations("checkout_payment");
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "ready"; crossmintOrderId: string | null }
    | { kind: "error"; error: string; recoverable: boolean }
  >({ kind: "loading" });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/pay/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_id: orderId }),
        });
        const data = (await res.json().catch(() => ({}))) as Record<
          string,
          unknown
        >;
        if (!mounted) return;

        if (!res.ok) {
          const err = (data?.error as string) || "provider_error";
          // `payment_provider_unconfigured` and `provider_scope_missing`
          // are operator-side issues — show graceful state, not retry.
          const recoverable =
            err === "network_error" || err === "items_unavailable";
          setState({ kind: "error", error: err, recoverable });
          console.error("[CrossmintPayment] init failed", err, data);
          return;
        }

        setState({
          kind: "ready",
          crossmintOrderId: (data?.crossmintOrderId as string | null) ?? null,
        });
      } catch (e) {
        if (!mounted) return;
        console.error("[CrossmintPayment] network error", e);
        setState({ kind: "error", error: "network_error", recoverable: true });
      }
    })();
    return () => {
      mounted = false;
    };
  }, [orderId]);

  function pay() {
    if (state.kind !== "ready" || !state.crossmintOrderId) return;
    // Redirect to Crossmint's hosted pay page. Successful payment fires our
    // /api/crossmint-webhook; the visitor lands back at /thank-you/{orderId}.
    const successUrl = `${window.location.origin}/thank-you/${orderId}`;
    const cancelUrl = `${window.location.origin}/pay/${orderId}`;
    const params = new URLSearchParams({
      successCallbackUrl: successUrl,
      failureCallbackUrl: cancelUrl,
    });
    window.location.href = `${HOSTED_CHECKOUT_BASE}/${state.crossmintOrderId}/pay?${params.toString()}`;
  }

  // Loading skeleton
  if (state.kind === "loading") {
    return (
      <div className="border border-sericia-line bg-sericia-paper-card p-8 md:p-10 space-y-5">
        <p className="label">{t("preparing")}</p>
        <div className="h-6 w-2/3 bg-sericia-line/40 animate-pulse" />
        <div className="h-12 w-full bg-sericia-line/30 animate-pulse" />
      </div>
    );
  }

  // Error state — distinguish operator-side vs visitor-side faults
  if (state.kind === "error") {
    const isOperatorOutage =
      state.error === "payment_provider_unconfigured" ||
      state.error === "provider_scope_missing" ||
      state.error === "provider_auth_invalid";
    const mailto = `mailto:contact@sericia.com?subject=Order%20${orderId}%20-%20Payment%20Request&body=Hi%20Sericia%20team%2C%0A%0AI%27d%20like%20to%20complete%20my%20order.%0A%0AOrder%20ID%3A%20${orderId}%0AAmount%3A%20%24${amountUSD}%20USD%0A%0APlease%20send%20me%20a%20payment%20link.%0A%0AThanks!`;
    return (
      <div className="border border-sericia-line bg-sericia-paper-card p-8 md:p-10">
        <p className="label mb-4">{t("error_eyebrow")}</p>
        <h2 className="text-[22px] font-normal mb-4 leading-snug">
          {isOperatorOutage ? t("error_outage_title") : t("error_network_title")}
        </h2>
        <p className="text-[14px] text-sericia-ink-soft leading-relaxed mb-8">
          {isOperatorOutage ? t("error_outage_lede") : t("error_network_lede")}
        </p>
        {state.recoverable && (
          <button
            type="button"
            onClick={() => {
              toast(t("try_again"));
              setState({ kind: "loading" });
              // Re-trigger via state thrash (effect deps include orderId only;
              // we use a one-shot ref by remounting the loader visually).
              setTimeout(() => location.reload(), 400);
            }}
            className="inline-flex items-center gap-2 text-[12px] tracking-wider uppercase text-sericia-ink underline-link mr-6"
          >
            {t("try_again")}
          </button>
        )}
        <a
          href={mailto}
          className="inline-flex items-center gap-2 text-[12px] tracking-wider uppercase text-sericia-ink underline-link"
        >
          {t("email_concierge")}
        </a>
        <div className="mt-8 pt-5 border-t border-sericia-line text-[11px] text-sericia-ink-mute tracking-wide">
          <p>
            {t("order_id_label")}:{" "}
            <code className="font-mono text-sericia-ink-soft">{orderId}</code>
          </p>
        </div>
      </div>
    );
  }

  // Ready — show pay button
  return (
    <div className="border border-sericia-line bg-sericia-paper-card p-8 md:p-10">
      <p className="label mb-4">{t("ready_eyebrow")}</p>
      <h2 className="text-[26px] font-normal mb-8 leading-snug">
        {t("ready_title", { amount: amountUSD })}
      </h2>
      <button
        type="button"
        onClick={pay}
        className="w-full bg-sericia-ink text-sericia-paper py-5 text-[14px] tracking-wider hover:bg-sericia-accent transition-colors"
      >
        {t("pay_button")} &rarr;
      </button>
      <p className="text-[11px] text-sericia-ink-mute mt-5 text-center leading-relaxed tracking-wide">
        {t("pci_disclaimer")}
      </p>
      <div className="mt-8 pt-5 border-t border-sericia-line text-[11px] text-sericia-ink-mute tracking-wide">
        <p>
          {t("order_id_label")}:{" "}
          <code className="font-mono text-sericia-ink-soft">{orderId}</code>
        </p>
      </div>
    </div>
  );
}
