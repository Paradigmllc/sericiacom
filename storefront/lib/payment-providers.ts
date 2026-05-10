/**
 * F58 — Active payment providers feature flag.
 *
 * Sericia's payment rails, in priority order:
 *
 *   PRIMARY (active default):
 *     A. Stripe direct          → cards, Apple Pay, Google Pay, Link
 *        Rail used at Drop #1 launch. Stripe is the safest, most
 *        battle-tested rail and has no Sales-team activation gate.
 *        See lib/stripe.ts.
 *
 *   ALTERNATIVE (operator-toggleable, defaults OFF):
 *     B. Crossmint              → USDC on Polygon (card → crypto onramp)
 *        Pending Crossmint Sales Onramp activation (submitted 2026-04-30,
 *        screenshot 2026-05-10 still "We're reviewing your submission").
 *        Until activation, the Crossmint UI MUST NOT render — the iframe
 *        would 400 with "Onramp is not yet enabled for production use"
 *        and the visitor would think the whole checkout is broken.
 *        Set NEXT_PUBLIC_CROSSMINT_ENABLED=true once approved.
 *
 *   LEGACY (kept for self-host migration path, defaults OFF):
 *     C. Hyperswitch            → orchestrator wrapping Stripe + PayPal
 *        F54 implementation (lib/hyperswitch.ts) preserved. We kept the
 *        code so a future self-hosted Hyperswitch OSS deployment can be
 *        flipped on with NEXT_PUBLIC_HYPERSWITCH_ENABLED=true without
 *        re-implementing the orchestration layer.
 *
 * UX modes:
 *   "stripe_only"           → only Stripe Elements shown (current launch default)
 *   "stripe_with_crossmint" → Stripe primary + small "Pay with crypto"
 *                             accordion link reveals Crossmint embed
 *   "hyperswitch_legacy"    → Hyperswitch primary (legacy path for OSS migration)
 *
 * Crossmint never displays alone — Stripe stays the default rail for all
 * customers. Crossmint is positioned as an alternative payment method
 * (the right luxury-D2C pattern: stable rail primary, novel rail as
 * opt-in for crypto-native customers).
 */

export type PaymentProviderMode =
  | "stripe_only"
  | "stripe_with_crossmint"
  | "hyperswitch_legacy";

/**
 * Resolve which providers should render at checkout.
 *
 * Server-only call: reads non-public env vars (NEXT_PUBLIC_* still works
 * server-side; we use them for symmetry with the build-time inlined
 * client values). Client components receive the resolved mode via props
 * from server components — never call this from a "use client" file.
 */
export function getActiveProviders(): {
  mode: PaymentProviderMode;
  stripeEnabled: boolean;
  hyperswitchEnabled: boolean;
  crossmintEnabled: boolean;
} {
  const crossmintEnabled =
    (process.env.NEXT_PUBLIC_CROSSMINT_ENABLED ?? "").toLowerCase() === "true";
  const hyperswitchEnabled =
    (process.env.NEXT_PUBLIC_HYPERSWITCH_ENABLED ?? "").toLowerCase() === "true";
  // Stripe is the default ON rail. Operator can force-disable in an
  // emergency by setting NEXT_PUBLIC_STRIPE_ENABLED=false.
  const stripeEnabled =
    (process.env.NEXT_PUBLIC_STRIPE_ENABLED ?? "true").toLowerCase() !== "false";

  // Hyperswitch legacy path takes precedence only if Stripe is disabled
  // AND Hyperswitch is explicitly enabled (operator self-hosted scenario).
  if (!stripeEnabled && hyperswitchEnabled) {
    return {
      mode: "hyperswitch_legacy",
      stripeEnabled: false,
      hyperswitchEnabled: true,
      crossmintEnabled,
    };
  }

  return {
    mode: crossmintEnabled ? "stripe_with_crossmint" : "stripe_only",
    stripeEnabled: true,
    hyperswitchEnabled,
    crossmintEnabled,
  };
}
