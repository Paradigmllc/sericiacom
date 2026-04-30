/**
 * F55 — Payload PaymentSettings fetcher.
 *
 * Editor-controlled source of truth for:
 *   - country → enabled payment-method allowlist
 *   - default fallback methods
 *   - checkout page copy (eyebrow / heading / subhead, all localised)
 *   - receipt + button label patterns
 *   - alternative provider toggles (Crossmint accordion etc.)
 *
 * Mirrors `payload-settings.ts` (SiteSettings) contract:
 *   - silent-fallback to hardcoded defaults if Payload is unreachable
 *   - request-memoised via React `cache()`
 *   - locale-aware (uses next-intl locale to fetch the right translation)
 *
 * The hardcoded fallbacks live in `lib/payment-routing.ts` and remain
 * the SAFETY NET only — they fire when:
 *   - Payload is in build-time mode (DATABASE_URL_PAYLOAD = dummy)
 *   - Payload's DB has a transient outage
 *   - The PaymentSettings global has never been saved (e.g. fresh deploy)
 *
 * Editor flow (when Payload is healthy):
 *   1. Editor opens /cms/admin/globals/paymentSettings
 *   2. Adds a row to "Country → enabled payment methods"
 *   3. Saves
 *   4. Storefront sees the new matrix on the next request (no deploy)
 */

import { cache } from "react";
import { getPayloadClient } from "./payload";
import {
  HARDCODED_DEFAULT_METHODS,
  HARDCODED_PAYMENT_MATRIX,
  type HyperswitchMethod,
} from "./payment-routing";

/**
 * Public shape exposed to the storefront. Always non-null — the resolver
 * fills in safe defaults for any missing field so consumers don't have to
 * defensively null-check on every access.
 */
export interface ResolvedPaymentSettings {
  /** Country → enabled methods (lowercase ISO 3166-1 alpha-2 → method list). */
  countryMethods: Record<string, readonly HyperswitchMethod[]>;
  /** Default methods used for any country not in countryMethods. */
  defaultMethods: readonly HyperswitchMethod[];
  /** Localised checkout page copy (with safe defaults). */
  checkoutCopy: {
    eyebrow: string;
    heading: string;
    subhead: string;
    reservationMinutes: number;
  };
  /** Localised receipt + button copy (with safe defaults). */
  receiptCopy: {
    /** Pattern with {email} placeholder. */
    receiptLine: string;
    /** Pattern with {email} placeholder. */
    confirmationLine: string;
    /** Pattern with {amount} placeholder. */
    payButtonLabel: string;
  };
  /** Crossmint accordion toggle + label. */
  alternativeProviders: {
    crossmintEnabled: boolean;
    crossmintLabel: string;
  };
}

const HARDCODED_CHECKOUT_COPY = {
  eyebrow: "Step 2 of 2 — Payment",
  heading: "Complete your payment.",
  subhead:
    "Your order is reserved for fifteen minutes. Payment is processed securely in USD.",
  reservationMinutes: 15,
} as const;

const HARDCODED_RECEIPT_COPY = {
  receiptLine: "Receipt to {email} · Secured by Hyperswitch",
  confirmationLine: "Confirmation will be sent to {email}",
  payButtonLabel: "Pay ${amount} USD",
} as const;

const HARDCODED_ALTERNATIVE_PROVIDERS = {
  crossmintEnabled: false,
  crossmintLabel: "Pay with crypto (USDC) instead",
} as const;

/**
 * Resolve PaymentSettings for the given locale.
 *
 * Returns a fully-formed object — never null — so callers don't have to
 * defensively null-check. Missing fields fall back to the hardcoded
 * defaults defined above + the matrix in `payment-routing.ts`.
 */
async function fetchPaymentSettings(locale: string): Promise<ResolvedPaymentSettings> {
  let payloadValue: unknown = null;

  try {
    const payload = await getPayloadClient();
    payloadValue = await payload.findGlobal({
      slug: "paymentSettings",
      depth: 0,
      locale: locale as never,
      fallbackLocale: "en" as never,
    });
  } catch (err) {
    console.error("[payment-settings] fetch failed, hardcoded defaults will render", err);
  }

  // ── Resolve countryMethods ────────────────────────────────────────
  const rows = (payloadValue as { countryMethods?: Array<{
    code?: string;
    methods?: string[];
    active?: boolean;
  }> })?.countryMethods ?? [];

  const countryMethods: Record<string, readonly HyperswitchMethod[]> = { ...HARDCODED_PAYMENT_MATRIX };
  for (const row of rows) {
    if (!row?.code || !row.methods?.length) continue;
    if (row.active === false) continue;
    countryMethods[row.code.toLowerCase()] = row.methods as HyperswitchMethod[];
  }

  // ── Resolve defaultMethods ────────────────────────────────────────
  const cmsDefaults = (payloadValue as { defaultMethods?: string[] })?.defaultMethods;
  const defaultMethods = (cmsDefaults && cmsDefaults.length > 0)
    ? (cmsDefaults as HyperswitchMethod[])
    : HARDCODED_DEFAULT_METHODS;

  // ── Resolve checkoutCopy ──────────────────────────────────────────
  const cmsCheckoutCopy = (payloadValue as { checkoutCopy?: {
    eyebrow?: string;
    heading?: string;
    subhead?: string;
    reservationMinutes?: number;
  } })?.checkoutCopy;
  const checkoutCopy = {
    eyebrow: cmsCheckoutCopy?.eyebrow?.trim() || HARDCODED_CHECKOUT_COPY.eyebrow,
    heading: cmsCheckoutCopy?.heading?.trim() || HARDCODED_CHECKOUT_COPY.heading,
    subhead: cmsCheckoutCopy?.subhead?.trim() || HARDCODED_CHECKOUT_COPY.subhead,
    reservationMinutes: cmsCheckoutCopy?.reservationMinutes ?? HARDCODED_CHECKOUT_COPY.reservationMinutes,
  };

  // ── Resolve receiptCopy ───────────────────────────────────────────
  const cmsReceiptCopy = (payloadValue as { receiptCopy?: {
    receiptLine?: string;
    confirmationLine?: string;
    payButtonLabel?: string;
  } })?.receiptCopy;
  const receiptCopy = {
    receiptLine: cmsReceiptCopy?.receiptLine?.trim() || HARDCODED_RECEIPT_COPY.receiptLine,
    confirmationLine: cmsReceiptCopy?.confirmationLine?.trim() || HARDCODED_RECEIPT_COPY.confirmationLine,
    payButtonLabel: cmsReceiptCopy?.payButtonLabel?.trim() || HARDCODED_RECEIPT_COPY.payButtonLabel,
  };

  // ── Resolve alternativeProviders ──────────────────────────────────
  const cmsAlt = (payloadValue as { alternativeProviders?: {
    crossmintEnabled?: boolean;
    crossmintLabel?: string;
  } })?.alternativeProviders;
  const alternativeProviders = {
    // CMS toggle takes precedence over env var. Editor wins.
    crossmintEnabled: cmsAlt?.crossmintEnabled
      ?? ((process.env.NEXT_PUBLIC_CROSSMINT_ENABLED ?? "").toLowerCase() === "true"),
    crossmintLabel: cmsAlt?.crossmintLabel?.trim() || HARDCODED_ALTERNATIVE_PROVIDERS.crossmintLabel,
  };

  return {
    countryMethods,
    defaultMethods,
    checkoutCopy,
    receiptCopy,
    alternativeProviders,
  };
}

/**
 * Per-request memoised fetcher. Pass the active next-intl locale so
 * Payload returns the correct localised group.
 */
export const getPaymentSettings = cache(fetchPaymentSettings);

/**
 * Resolve enabled methods for a single country, server-side.
 * Goes through Payload first; falls back to hardcoded matrix.
 */
export async function getEnabledMethodsForCountry(
  country: string | null | undefined,
  locale: string = "en",
): Promise<readonly HyperswitchMethod[]> {
  const settings = await getPaymentSettings(locale);
  if (!country) return settings.defaultMethods;
  const key = country.toLowerCase();
  return settings.countryMethods[key] ?? settings.defaultMethods;
}
