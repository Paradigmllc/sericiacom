// Module marker — keeps tsc from declaring this in shared script namespace.
export {};

/**
 * F55 — Seed Payload PaymentSettings global with Sericia's default matrix.
 *
 * Run-once-per-environment (idempotent — re-running with default behaviour
 * leaves existing values untouched). Use after:
 *   1. First deploy with the new global registered
 *   2. New environment (staging clone, region migration)
 *   3. Force-reset (pass --reset to overwrite all fields)
 *
 * The defaults written here mirror `lib/payment-routing.ts` HARDCODED_*
 * constants exactly. After this seed runs, the Payload admin UI is the
 * single source of truth — the editor can edit the matrix from
 * `/cms/admin/globals/paymentSettings` and changes apply on the next
 * storefront request (cache TTL ≤ 60s).
 *
 * Required env (script reads from .env or shell):
 *   DATABASE_URL_PAYLOAD   — same Postgres instance Payload uses
 *   PAYLOAD_SECRET         — same secret Payload boots with
 *
 * Usage:
 *   npx tsx storefront/scripts/seed-payment-settings.ts          # idempotent
 *   npx tsx storefront/scripts/seed-payment-settings.ts --reset  # overwrite
 */

import { getPayload } from "payload";
import config from "../payload.config";
import {
  HARDCODED_DEFAULT_METHODS,
  HARDCODED_PAYMENT_MATRIX,
} from "../lib/payment-routing";

const args = process.argv.slice(2);
const RESET = args.includes("--reset");

interface CountryDisplay {
  [code: string]: string;
}

const DISPLAY_NAMES: CountryDisplay = {
  us: "United States",
  ca: "Canada",
  uk: "United Kingdom",
  de: "Germany",
  fr: "France",
  nl: "Netherlands",
  au: "Australia",
  jp: "Japan",
  sg: "Singapore",
  hk: "Hong Kong",
  tw: "Taiwan",
  kr: "South Korea",
  ae: "United Arab Emirates",
};

async function main() {
  console.log("[seed-payment-settings] booting Payload...");
  const payload = await getPayload({ config });

  console.log("[seed-payment-settings] reading current global state...");
  const current = await payload.findGlobal({
    slug: "paymentSettings",
    depth: 0,
  }).catch((err: unknown) => {
    console.error("[seed-payment-settings] findGlobal failed:", err);
    return null;
  });

  const hasExistingMatrix =
    Array.isArray(
      (current as { countryMethods?: unknown[] })?.countryMethods,
    ) && ((current as { countryMethods?: unknown[] }).countryMethods?.length ?? 0) > 0;

  if (hasExistingMatrix && !RESET) {
    console.log(
      "[seed-payment-settings] global already has countryMethods — skipping. " +
        "Pass --reset to force overwrite.",
    );
    process.exit(0);
  }

  console.log("[seed-payment-settings] seeding matrix from hardcoded defaults...");

  const countryMethods = Object.entries(HARDCODED_PAYMENT_MATRIX).map(
    ([code, methods]) => ({
      code,
      displayName: DISPLAY_NAMES[code] ?? code.toUpperCase(),
      methods: [...methods],
      active: true,
    }),
  );

  const result = await payload.updateGlobal({
    slug: "paymentSettings",
    data: {
      countryMethods,
      defaultMethods: [...HARDCODED_DEFAULT_METHODS],
      checkoutCopy: {
        eyebrow: "Step 2 of 2 — Payment",
        heading: "Complete your payment.",
        subhead:
          "Your order is reserved for fifteen minutes. Payment is processed securely in USD.",
        reservationMinutes: 15,
      },
      receiptCopy: {
        receiptLine: "Receipt to {email} · Secured by Hyperswitch",
        confirmationLine: "Confirmation will be sent to {email}",
        payButtonLabel: "Pay ${amount} USD",
      },
      alternativeProviders: {
        crossmintEnabled: false,
        crossmintLabel: "Pay with crypto (USDC) instead",
      },
    },
  });

  console.log(`[seed-payment-settings] ✅ seeded ${countryMethods.length} country rows`);
  console.log(`[seed-payment-settings] global id:`, (result as { id?: string })?.id ?? "(no id)");
  console.log(
    "[seed-payment-settings] editor can now edit at /cms/admin/globals/paymentSettings",
  );
}

main().catch((err) => {
  console.error("[seed-payment-settings] fatal:", err);
  process.exit(1);
});
