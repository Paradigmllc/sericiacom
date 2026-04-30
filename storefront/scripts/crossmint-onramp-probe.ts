// Module marker — keeps tsc from declaring this in shared script namespace.
export {};

/**
 * F53: Crossmint Onramp readiness probe.
 *
 * Background: Sericia's Drop #1 launch is gated entirely on Crossmint's Sales
 * partnerships team enabling the Onramp feature for our production project
 * (sales form submitted 2026-04-30 12:50 JST). The Crossmint Console does
 * not show approval status anywhere — the only deterministic signal is that
 * production order creation flips from
 *
 *     400 + "Onramp is not yet enabled for production use in this project."
 *
 * to
 *
 *     200 + { id, paymentPreparation: { stripeClientSecret, ... } }
 *
 * This script polls that endpoint with the canonical Sericia payload (USDC
 * tokenLocator on Polygon, treasury wallet recipient) and reports clearly
 * whether Onramp is BLOCKED or READY. Run from cron every 30 minutes during
 * the SLA window (2026-05-03 → 2026-05-05 JST) to know the moment activation
 * lands without manually clicking through the storefront.
 *
 * Safety: no charge happens. Crossmint order creation only RESERVES — payment
 * is captured later by Stripe payment element confirmation. The probe order
 * never hits a real card; if Crossmint accidentally returns 200, we abort
 * immediately without proceeding to capture.
 *
 * Required env:
 *   CROSSMINT_PRODUCTION_API_KEY  — server-side `sk_production_...` from
 *                                   Crossmint Console → Integrate → API keys
 *   CROSSMINT_TREASURY_WALLET     — Polygon address that should receive USDC
 *                                   on real orders. Default: Sericia treasury.
 *
 * Usage:
 *   CROSSMINT_PRODUCTION_API_KEY=sk_... \
 *   CROSSMINT_TREASURY_WALLET=0x... \
 *     npx tsx storefront/scripts/crossmint-onramp-probe.ts
 *
 * Exit codes:
 *   0 = READY (Onramp activated, can launch immediately)
 *   1 = BLOCKED (Onramp still gated by sales — wait + retry)
 *   2 = ERROR (network / auth / unexpected response — needs human triage)
 */

const ENDPOINT = "https://www.crossmint.com/api/2022-06-09/orders";

// Helper: validate env and narrow `string | undefined` → `string` in a way
// the Next.js production tsconfig respects. Plain `if (!X) process.exit()`
// narrowing depends on `@types/node` declaring `process.exit` with return
// type `never`, which is configuration-dependent. An explicit `throw` after
// the exit call guarantees narrowing in every TS strict mode.
function requireEnv(name: string, hint?: string): string {
  const val = process.env[name]?.trim();
  if (!val) {
    console.error(`[onramp-probe] ${name} env required.`);
    if (hint) console.error(`  ${hint}`);
    process.exit(2);
    throw new Error("unreachable");
  }
  return val;
}

const API_KEY = requireEnv(
  "CROSSMINT_PRODUCTION_API_KEY",
  "Get it from https://www.crossmint.com/console (Integrate → API keys).",
);
const TREASURY = requireEnv(
  "CROSSMINT_TREASURY_WALLET",
  "This is the Polygon address that real orders pay USDC to.",
);

// Canonical "small probe" payload. $1 USDC on Polygon, mirrors the F35 probe
// exactly. tokenLocator format = "polygon:USDC" per Crossmint docs 2024-06.
const probePayload = {
  recipient: { walletAddress: TREASURY },
  payment: {
    method: "stripe-payment-element",
    currency: "usd",
  },
  lineItems: [
    {
      tokenLocator: "polygon:USDC",
      executionParameters: {
        mode: "exact-in",
        amount: "1.00",
      },
    },
  ],
};

async function probe() {
  console.log("[onramp-probe] sending probe to", ENDPOINT);
  console.log("[onramp-probe] amount: $1.00 USDC on Polygon →", TREASURY);

  const startedAt = Date.now();
  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Crossmint expects the secret key as raw bearer (no "Bearer " prefix
        // on this v1 endpoint — the v2 admin API differs)
        "x-api-key": API_KEY,
      },
      body: JSON.stringify(probePayload),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    console.error("[onramp-probe] network error:", err instanceof Error ? err.message : err);
    process.exit(2);
  }

  const elapsedMs = Date.now() - startedAt;
  const text = await res.text();
  let body: { message?: string; id?: string; error?: string; [k: string]: unknown };
  try {
    body = JSON.parse(text);
  } catch {
    body = { message: text };
  }

  console.log(`[onramp-probe] HTTP ${res.status} in ${elapsedMs}ms`);

  // ── READY: 200 with order id returned ─────────────────────────────────────
  if (res.ok && typeof body.id === "string" && body.id.length > 0) {
    console.log("");
    console.log("✅ READY — Crossmint Onramp is ACTIVATED for production.");
    console.log(`   Order id (probe, not captured): ${body.id}`);
    console.log("");
    console.log("Next steps:");
    console.log("  1. Cancel/expire the probe order via Crossmint Console (no");
    console.log("     charge fires until Stripe confirm, but tidy is tidy).");
    console.log("  2. Run docs/crossmint-integration.md §5.6 \\$1 live smoke test.");
    console.log("  3. Flip storefront NEXT_PUBLIC_CROSSMINT_CLIENT_ID env to");
    console.log("     production client id and redeploy.");
    process.exit(0);
  }

  // ── BLOCKED: 400 with the canonical "Onramp not enabled" string ──────────
  const message = (body.message ?? body.error ?? text).toString();
  if (res.status === 400 && /Onramp is not yet enabled for production use/i.test(message)) {
    console.log("");
    console.log("⏸  BLOCKED — Crossmint Onramp is still gated by sales review.");
    console.log("   This is expected during the 1-3 business day SLA window");
    console.log("   that started 2026-04-30 12:50 JST.");
    console.log("");
    console.log("Body excerpt:", message.slice(0, 200));
    console.log("");
    console.log("Action: keep waiting. Re-run this probe every 30 minutes.");
    console.log("If 5+ business days pass with no flip, fall back to one of the");
    console.log("3 alternates in docs/crossmint-sales-activation.md §7.");
    process.exit(1);
  }

  // ── ERROR: anything else needs human triage ─────────────────────────────
  console.error("");
  console.error("⚠️  UNEXPECTED — HTTP", res.status, "with body:");
  console.error(JSON.stringify(body, null, 2).slice(0, 1000));
  console.error("");
  console.error("Possible causes:");
  console.error("  401 / 403 → API key wrong or revoked");
  console.error("  400 + other text → payload schema changed (Crossmint API drift)");
  console.error("  5xx → Crossmint backend incident — check status.crossmint.com");
  process.exit(2);
}

probe().catch((err) => {
  console.error("[onramp-probe] fatal:", err);
  process.exit(2);
});
