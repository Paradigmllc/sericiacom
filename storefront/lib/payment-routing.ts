/**
 * F54 + F55 — Per-country payment method allowlist (hardcoded fallback).
 *
 * Per the project's content rule (2026-04-30 directive): "全コンテンツは
 * ハードコードNG、DB化、PayloadCMSで編集可能に".
 *
 * Runtime path:
 *   storefront → lib/payment-settings.ts → Payload PaymentSettings global
 *                                       ↓ on Payload outage / cold-start
 *                                       fallback → constants below
 *
 * The values in this file are NOT the source of truth — they are a
 * defensive safety net. Editor-facing source of truth is the Payload
 * PaymentSettings global (`/cms/admin/globals/paymentSettings`). The
 * Payload schema seeds these same defaults on first save (see
 * `scripts/seed-payment-settings.ts`).
 *
 * Why we keep a hardcoded fallback at all:
 *   1. Build-time safety — Next.js build runs against a dummy DB string
 *      and Payload returns null. Without a fallback, build-time pages
 *      that consume the matrix would 500.
 *   2. Cold-start safety — first deploy to a fresh DB has no global
 *      saved yet. Without a fallback, the very first checkout fails.
 *   3. Outage safety — Postgres / Payload restart blip would 500
 *      checkout otherwise.
 */

/**
 * Country code = lowercase ISO 3166-1 alpha-2. We deliberately do NOT reuse
 * `CountryCode` from `lib/pseo-matrix` — that type is constrained to the 12
 * pSEO TARGET markets (US/UK/DE/FR/AU/SG/CA/HK/NL/AE/TW/KR), but payment
 * routing must accept ANY country a customer can ship to (notably JP, which
 * is Sericia's home market and therefore not in the pSEO target list).
 */
type Iso2 = string;

/**
 * Hyperswitch payment_method_type strings per their API spec.
 * These map 1:1 to what the Hyperswitch dashboard exposes per connector
 * (Stripe / PayPal). Any value here that the connected PSP doesn't
 * support is silently filtered by Hyperswitch — no UI breakage.
 */
export type HyperswitchMethod =
  | "card"
  | "apple_pay"
  | "google_pay"
  | "paypal"
  | "klarna"
  | "afterpay_clearpay"
  | "ideal"
  | "sepa_debit"
  | "alipay"
  | "we_chat_pay"
  | "konbini";

/** Hardcoded fallback: any country not in the matrix gets this set. */
export const HARDCODED_DEFAULT_METHODS: readonly HyperswitchMethod[] = [
  "card",
  "apple_pay",
  "google_pay",
] as const;

/**
 * Hardcoded fallback matrix — seeded into Payload PaymentSettings on first
 * deploy via `scripts/seed-payment-settings.ts`. Editing this file does not
 * change live behaviour after Payload is bootstrapped; the editor must edit
 * `/cms/admin/globals/paymentSettings`. This file is the safety net only.
 *
 * Selection rationale (Sericia D2C — luxury Japanese craft food, USD pricing):
 *   Universal:   card, apple_pay, google_pay (~95% global coverage)
 *   PayPal:      en-speaking + EU + JP markets where PayPal penetration > 40%
 *   Skipped in:  AE (PayPal exited UAE retail 2022), HK/TW/KR (local cards
 *                 + KakaoPay/NaverPay dominant)
 */
export const HARDCODED_PAYMENT_MATRIX: Record<Iso2, readonly HyperswitchMethod[]> = {
  // North America
  us: ["card", "apple_pay", "google_pay", "paypal"],
  ca: ["card", "apple_pay", "google_pay", "paypal"],

  // United Kingdom
  uk: ["card", "apple_pay", "google_pay", "paypal"],

  // Continental Europe
  de: ["card", "apple_pay", "google_pay", "paypal"],
  fr: ["card", "apple_pay", "google_pay", "paypal"],
  nl: ["card", "apple_pay", "google_pay", "paypal"],

  // Pacific
  au: ["card", "apple_pay", "google_pay", "paypal"],

  // Asia-Pacific
  jp: ["card", "apple_pay", "google_pay", "paypal"],
  sg: ["card", "apple_pay", "google_pay", "paypal"],
  hk: ["card", "apple_pay", "google_pay"],
  tw: ["card", "apple_pay", "google_pay"],
  kr: ["card", "apple_pay", "google_pay"],

  // Middle East
  ae: ["card", "apple_pay", "google_pay"],
};

/**
 * Synchronous fallback resolver. Used ONLY when Payload is unreachable
 * (build-time, cold-start, outage). Production runtime path goes through
 * `lib/payment-settings.ts → getEnabledMethodsForCountry()` which reads
 * the editor-controlled Payload global first.
 */
export function getFallbackEnabledMethods(country: string | null | undefined): readonly HyperswitchMethod[] {
  if (!country) return HARDCODED_DEFAULT_METHODS;
  const key = country.toLowerCase();
  return HARDCODED_PAYMENT_MATRIX[key] ?? HARDCODED_DEFAULT_METHODS;
}

/**
 * @deprecated Use `getEnabledMethodsForCountry()` from `lib/payment-settings.ts`.
 * Kept as an alias for backward compatibility — delegates to the synchronous
 * fallback. New callers should await the Payload-backed async version.
 */
export const getEnabledMethods = getFallbackEnabledMethods;

/** All countries in the matrix (useful for ops dashboards / debug). */
export function listSupportedCountries(): string[] {
  return Object.keys(HARDCODED_PAYMENT_MATRIX);
}
