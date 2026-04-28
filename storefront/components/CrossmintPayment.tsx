"use client";

/**
 * CrossmintPayment — F29 embedded SDK upgrade.
 *
 * Architecture:
 *   1. Server creates a Crossmint order via /api/pay/create (F28 schema:
 *      tokenLocator USDC + recipient.walletAddress = Sericia treasury).
 *   2. Returns { crossmintOrderId, clientSecret } — the order is in
 *      "quote" phase, awaiting payment.
 *   3. We render <CrossmintEmbeddedCheckout> on the same page (no
 *      redirect) — customer enters card on a Crossmint-hosted iframe
 *      that visually integrates with sericia.com.
 *   4. <CheckoutListener> subscribes to checkout state via the
 *      useCrossmintCheckout() hook. When phase transitions to
 *      "completed" / "delivery", we router.push("/thank-you/{orderId}").
 *   5. Server-side webhook (/api/crossmint-webhook) decrements stock,
 *      sends order-confirmation email, marks the sericia_orders row paid.
 *
 * Why embedded vs the F28 redirect approach:
 *   - Customer never leaves sericia.com → brand consistency
 *   - Apple Pay verification works on same-origin
 *   - Funnel completion rate higher (no return-from-redirect drop-off)
 *   - Crossmint's iframe handles all PCI scope (we never see card data)
 *
 * Three states (same UX contract as F28):
 *   1. loading — paper skeleton while POST /api/pay/create
 *   2. ready   — embedded iframe rendered + listener for completion
 *   3. error   — graceful copy + concierge mailto + retry CTA when transient
 *
 * Operator-side gates (these surface as "we're activating payments"):
 *   - CROSSMINT_SERVER_SK env (set ✅)
 *   - NEXT_PUBLIC_CROSSMINT_CLIENT_ID env (set ✅)
 *   - SERICIA_TREASURY_WALLET_ADDRESS env (set ✅, Base USDC)
 *   - Crossmint Console Onramp production access (still pending, user
 *     activates via Console — until then API returns provider_onramp_disabled)
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  CrossmintProvider,
  CrossmintCheckoutProvider,
  CrossmintEmbeddedCheckout,
  useCrossmintCheckout,
} from "@crossmint/client-sdk-react-ui";

type Props = {
  orderId: string;
  amountUSD: number;
  receiptEmail: string;
};

type ApiErrorCode =
  | "payment_provider_unconfigured"
  | "treasury_wallet_unconfigured"
  | "treasury_chain_unsupported"
  | "provider_scope_missing"
  | "provider_auth_invalid"
  | "provider_onramp_disabled"
  | "provider_token_unsupported"
  | "provider_error"
  | "network_error"
  | "order_not_found"
  | "order_not_pending"
  | "items_unavailable"
  | "invalid_order_amount";

type State =
  | { kind: "loading" }
  | { kind: "ready"; crossmintOrderId: string; clientSecret: string }
  | { kind: "error"; error: ApiErrorCode | string; recoverable: boolean };

// Operator-side outage error codes — UI shows "we're activating payments"
// + concierge mailto. Visitor-side / network errors get a Retry CTA.
const OPERATOR_OUTAGE_ERRORS = new Set<string>([
  "payment_provider_unconfigured",
  "treasury_wallet_unconfigured",
  "treasury_chain_unsupported",
  "provider_scope_missing",
  "provider_auth_invalid",
  "provider_onramp_disabled",
  "provider_token_unsupported",
]);

// Bound to the publishable client key issued in Crossmint Console.
// `NEXT_PUBLIC_*` is inlined at build time; if it's empty (not yet
// configured), the embedded SDK won't render — we surface a graceful
// "preparing" state instead of crashing the page.
const CROSSMINT_CLIENT_API_KEY =
  process.env.NEXT_PUBLIC_CROSSMINT_CLIENT_ID || "";

export default function CrossmintPayment({
  orderId,
  amountUSD,
  receiptEmail,
}: Props) {
  const t = useTranslations("checkout_payment");
  const [state, setState] = useState<State>({ kind: "loading" });

  // Step 1 — POST /api/pay/create to get crossmintOrderId + clientSecret.
  // This kicks off the Crossmint order in "quote" phase.
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
          const err = (data?.error as ApiErrorCode) || "provider_error";
          const recoverable =
            err === "network_error" || err === "items_unavailable";
          setState({ kind: "error", error: err, recoverable });
          console.error("[CrossmintPayment] init failed", err, data);
          return;
        }

        const crossmintOrderId = data?.crossmintOrderId as string | undefined;
        const clientSecret = data?.clientSecret as string | undefined;

        if (!crossmintOrderId || !clientSecret) {
          // Schema accepted but Crossmint didn't return the IDs — rare,
          // but treat as transient (retry) since it usually means the
          // quote is still being computed in their backend.
          setState({
            kind: "error",
            error: "provider_error",
            recoverable: true,
          });
          console.error(
            "[CrossmintPayment] missing crossmintOrderId/clientSecret",
            data,
          );
          return;
        }

        setState({ kind: "ready", crossmintOrderId, clientSecret });
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

  // ─── Loading ──────────────────────────────────────────────────────────
  if (state.kind === "loading") {
    return (
      <div className="border border-sericia-line bg-sericia-paper-card p-8 md:p-10 space-y-5">
        <p className="label">{t("preparing")}</p>
        <div className="h-6 w-2/3 bg-sericia-line/40 animate-pulse" />
        <div className="h-12 w-full bg-sericia-line/30 animate-pulse" />
      </div>
    );
  }

  // ─── Error ────────────────────────────────────────────────────────────
  if (state.kind === "error") {
    const isOperatorOutage = OPERATOR_OUTAGE_ERRORS.has(state.error);
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

  // ─── Ready ────────────────────────────────────────────────────────────
  // Guard: if NEXT_PUBLIC_CROSSMINT_CLIENT_ID isn't set, the embedded SDK
  // would crash (it requires `apiKey` on CrossmintProvider). Show the
  // operator-outage state so the customer sees graceful copy instead.
  if (!CROSSMINT_CLIENT_API_KEY) {
    return (
      <div className="border border-sericia-line bg-sericia-paper-card p-8 md:p-10">
        <p className="label mb-4">{t("error_eyebrow")}</p>
        <h2 className="text-[22px] font-normal mb-4 leading-snug">
          {t("error_outage_title")}
        </h2>
        <p className="text-[14px] text-sericia-ink-soft leading-relaxed mb-8">
          {t("error_outage_lede")}
        </p>
        <a
          href={`mailto:contact@sericia.com?subject=Order%20${orderId}%20-%20Payment%20Request`}
          className="inline-flex items-center gap-2 text-[12px] tracking-wider uppercase text-sericia-ink underline-link"
        >
          {t("email_concierge")}
        </a>
      </div>
    );
  }

  return (
    <CrossmintProvider apiKey={CROSSMINT_CLIENT_API_KEY}>
      <CrossmintCheckoutProvider>
        <CheckoutListener orderId={orderId} />
        <div className="border border-sericia-line bg-sericia-paper-card p-6 md:p-8">
          <p className="label mb-4">{t("ready_eyebrow")}</p>
          <h2 className="text-[22px] font-normal mb-6 leading-snug">
            {t("ready_title", { amount: amountUSD })}
          </h2>
          <CrossmintEmbeddedCheckout
            orderId={state.crossmintOrderId}
            clientSecret={state.clientSecret}
            payment={{
              receiptEmail,
              // Lock to fiat-only so customer never sees crypto wallet
              // payment options. They see card form only — exactly the
              // brand experience Sericia wants.
              crypto: { enabled: false },
              fiat: { enabled: true },
              defaultMethod: "fiat",
            }}
          />
          <p className="text-[11px] text-sericia-ink-mute mt-5 leading-relaxed tracking-wide">
            {t("pci_disclaimer")}
          </p>
          <div className="mt-6 pt-4 border-t border-sericia-line text-[11px] text-sericia-ink-mute tracking-wide">
            <p>
              {t("order_id_label")}:{" "}
              <code className="font-mono text-sericia-ink-soft">{orderId}</code>
            </p>
          </div>
        </div>
      </CrossmintCheckoutProvider>
    </CrossmintProvider>
  );
}

/**
 * CheckoutListener — subscribes to Crossmint checkout state and drives
 * the post-payment navigation.
 *
 * Phases:
 *   - "quote"     → still awaiting card entry
 *   - "payment"   → card submitted, processing
 *   - "delivery"  → USDC settling to recipient.walletAddress (Sericia treasury)
 *   - "completed" → terminal success — webhook fired our backend → push to /thank-you
 *
 * We push to /thank-you on `delivery` OR `completed` to be defensive: if
 * Crossmint reports "delivery" but webhook is delayed, the thank-you page
 * still renders correctly (it pulls order status fresh from Supabase).
 */
function CheckoutListener({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { order } = useCrossmintCheckout();

  useEffect(() => {
    const phase = order?.phase;
    if (phase === "delivery" || phase === "completed") {
      router.push(`/thank-you/${orderId}`);
    }
  }, [order, orderId, router]);

  return null;
}
