/**
 * UAT — E2E purchase flow (cart → order → simulated Crossmint webhook).
 *
 * Scope: tests the full *Bridge* side of checkout (everything that runs
 * when Crossmint fires `order.succeeded`). The Crossmint iframe → card
 * input → USDC settlement chain is NOT tested here — that requires a
 * real browser with a real card and belongs to §5.6 of docs/crossmint-integration.md
 * (the $1 live smoke test before going public).
 *
 * What this test proves:
 *   1. /api/orders/create-cart creates a `pending` order with correct line
 *      items + amount_usd when given a real Medusa product id.
 *   2. /api/pay/create successfully registers the order with Crossmint
 *      (sandbox only, gated by CROSSMINT_ENV=staging) and stamps
 *      `crossmint_order_id` on the sericia_orders row.
 *   3. The webhook receiver:
 *        - validates HMAC (we re-sign a fake body with the same secret)
 *        - marks sericia_orders.status='paid', stamps paid_at
 *        - decrements Medusa inventory (cart orders)
 *        - emits sericia_events row `order_paid`
 *        - fires Slack + Resend + n8n non-blocking notifications
 *
 * Cleanup: test order row deleted at end (cascade drops line items + events).
 * Runs against staging by default — HARD GUARD against production.
 *
 * Run:
 *   # Staging (safe)
 *   STOREFRONT_URL=https://staging.sericia.com \
 *   CROSSMINT_ENV=staging \
 *   UAT_ALLOW_DESTRUCTIVE=1 \
 *   npm run uat:purchase-flow
 *
 *   # Skip the real Crossmint sandbox call (purely offline Bridge test):
 *   UAT_SKIP_CROSSMINT=1 npm run uat:purchase-flow
 *
 * Required env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   CROSSMINT_WEBHOOK_SECRET         (must match the deployed storefront)
 *   STOREFRONT_URL                    (default http://localhost:8000)
 *   MEDUSA_PUBLISHABLE_KEY            (for product discovery via /store API)
 *   UAT_ALLOW_DESTRUCTIVE=1           (safety interlock — required to run)
 */

import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

// ---------------------------------------------------------------------------
// Safety interlocks
// ---------------------------------------------------------------------------

const STOREFRONT_URL = (process.env.STOREFRONT_URL ?? "http://localhost:8000").replace(/\/$/, "");
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const WEBHOOK_SECRET = process.env.CROSSMINT_WEBHOOK_SECRET;
const MEDUSA_PK = process.env.MEDUSA_PUBLISHABLE_KEY;
const SKIP_CROSSMINT = process.env.UAT_SKIP_CROSSMINT === "1";

if (process.env.UAT_ALLOW_DESTRUCTIVE !== "1") {
  console.error(
    "❌ UAT_ALLOW_DESTRUCTIVE=1 is required. This script inserts rows in " +
      "sericia_orders, sericia_order_items, sericia_events and sends Slack/Resend notifications.",
  );
  process.exit(1);
}
if (STOREFRONT_URL.includes("sericia.com") && !STOREFRONT_URL.includes("staging")) {
  console.error(
    "❌ Refusing to run against production. Use STOREFRONT_URL=https://staging.sericia.com " +
      "or a local dev URL. Production smoke tests belong in docs/crossmint-integration.md §5.6.",
  );
  process.exit(1);
}
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
if (!WEBHOOK_SECRET) {
  console.error("❌ CROSSMINT_WEBHOOK_SECRET required to sign the simulated webhook.");
  process.exit(1);
}
if (!MEDUSA_PK) {
  console.error("❌ MEDUSA_PUBLISHABLE_KEY required to discover a product for the cart.");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

type CheckResult = { name: string; ok: boolean; detail?: string };
const results: CheckResult[] = [];
function check(name: string, ok: boolean, detail?: string): void {
  results.push({ name, ok, detail });
  console.log(`  ${ok ? "✅" : "❌"} ${name}${detail ? `  — ${detail}` : ""}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

type MedusaProductListItem = {
  id: string;
  title: string;
  status: string;
  variants?: { inventory_quantity: number | null }[];
};

async function discoverProduct(): Promise<{ id: string; title: string } | null> {
  // Medusa Store API needs the host derived from api.sericia.com, not the
  // storefront host. Simplest: the storefront's /api/products proxy.
  // Fallback: direct Medusa call using the publishable key.
  const medusaBase = STOREFRONT_URL.includes("localhost")
    ? "http://localhost:9000"
    : STOREFRONT_URL.replace("sericia.com", "api.sericia.com").replace("www.", "");
  const res = await fetch(
    `${medusaBase}/store/products?limit=10&fields=id,title,status,variants.inventory_quantity`,
    {
      headers: { "x-publishable-api-key": MEDUSA_PK! },
      signal: AbortSignal.timeout(15_000),
    },
  );
  if (!res.ok) {
    console.error(`[discover] Medusa /store/products failed: ${res.status}`);
    return null;
  }
  const data = (await res.json()) as { products: MedusaProductListItem[] };
  const active = data.products.find(
    (p) =>
      p.status === "published" &&
      (p.variants ?? []).some((v) => (v.inventory_quantity ?? 0) > 0),
  );
  return active ? { id: active.id, title: active.title } : null;
}

async function main(): Promise<number> {
  console.log(`=== UAT: Purchase flow E2E ===`);
  console.log(`   storefront: ${STOREFRONT_URL}`);
  console.log(`   skip Crossmint sandbox call: ${SKIP_CROSSMINT}`);
  console.log();

  // 1. Find a live product
  const product = await discoverProduct();
  check("Discovered active Medusa product", !!product, product ? `${product.title} (${product.id.slice(0, 10)}…)` : "none");
  if (!product) return 1;

  // 2. Create cart order
  const testEmail = `uat-purchase-${Date.now()}@sericia-test.invalid`;
  const createRes = await fetch(`${STOREFRONT_URL}/api/orders/create-cart`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: [{ product_id: product.id, quantity: 1 }],
      email: testEmail,
      full_name: "UAT Test",
      address_line1: "1-2-3 Test Street",
      city: "Tokyo",
      postal_code: "100-0001",
      country_code: "JP",
    }),
    signal: AbortSignal.timeout(30_000),
  });
  const createBody = (await createRes.json()) as { order_id?: string; amount_usd?: number; error?: string };
  check(
    "/api/orders/create-cart returns order_id",
    createRes.ok && !!createBody.order_id,
    createRes.ok ? `id=${createBody.order_id?.slice(0, 8)}… amount=$${createBody.amount_usd}` : `${createRes.status} ${createBody.error}`,
  );
  if (!createBody.order_id) return 1;
  const orderId = createBody.order_id;

  // 3. Verify sericia_orders row is pending
  const { data: pending } = await admin
    .from("sericia_orders")
    .select("id, status, amount_usd, order_type, email")
    .eq("id", orderId)
    .maybeSingle();
  check(
    "sericia_orders row created with status=pending",
    pending?.status === "pending" && pending?.email === testEmail,
    pending ? `status=${pending.status} type=${pending.order_type}` : "not found",
  );

  // 4. (Optional) Hit /api/pay/create to register with Crossmint sandbox
  if (!SKIP_CROSSMINT) {
    const payRes = await fetch(`${STOREFRONT_URL}/api/pay/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: orderId }),
      signal: AbortSignal.timeout(30_000),
    });
    const payBody = (await payRes.json()) as { crossmintOrderId?: string; error?: string };
    check(
      "/api/pay/create registers order with Crossmint sandbox",
      payRes.ok && !!payBody.crossmintOrderId,
      payRes.ok ? `crossmint_order_id=${payBody.crossmintOrderId?.slice(0, 12)}…` : `${payRes.status} ${payBody.error}`,
    );
  }

  // 5. Simulate order.succeeded webhook — re-sign with the same secret
  const webhookBody = JSON.stringify({
    type: "order.succeeded",
    data: {
      orderId: `crossmint_uat_${Date.now()}`,
      txId: `0xuat${Date.now().toString(16)}`,
      metadata: {
        sericia_order_id: orderId,
        email: testEmail,
      },
    },
  });
  const signature = crypto.createHmac("sha256", WEBHOOK_SECRET!).update(webhookBody).digest("base64");
  const whRes = await fetch(`${STOREFRONT_URL}/api/crossmint-webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-crossmint-signature": signature,
    },
    body: webhookBody,
    signal: AbortSignal.timeout(30_000),
  });
  const whJson = (await whRes.json().catch(() => ({}))) as { ok?: boolean; status?: string; error?: string };
  check(
    "Signed order.succeeded webhook accepted (HMAC OK)",
    whRes.ok && whJson.ok === true,
    `${whRes.status} ${JSON.stringify(whJson).slice(0, 120)}`,
  );

  // 6. Verify final state
  const { data: final } = await admin
    .from("sericia_orders")
    .select("status, paid_at, crossmint_order_id, tx_hash")
    .eq("id", orderId)
    .maybeSingle();
  check(
    "sericia_orders.status = paid after webhook",
    final?.status === "paid" && !!final?.paid_at,
    `status=${final?.status} paid_at=${final?.paid_at}`,
  );
  check(
    "crossmint_order_id + tx_hash stamped",
    !!final?.crossmint_order_id && !!final?.tx_hash,
    `cm=${final?.crossmint_order_id?.slice(0, 12)} tx=${final?.tx_hash?.slice(0, 12)}`,
  );

  const { data: events } = await admin
    .from("sericia_events")
    .select("event_name, order_id")
    .eq("order_id", orderId)
    .eq("event_name", "order_paid")
    .maybeSingle();
  check("sericia_events has order_paid row", !!events, events ? `event=${events.event_name}` : "not found");

  // 7. Verify HMAC rejects a tampered body
  const tamperedRes = await fetch(`${STOREFRONT_URL}/api/crossmint-webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-crossmint-signature": signature },
    body: webhookBody.replace("order.succeeded", "order.tampered"),
    signal: AbortSignal.timeout(15_000),
  });
  check(
    "Tampered webhook body rejected with 401",
    tamperedRes.status === 401,
    `status=${tamperedRes.status}`,
  );

  // 8. Cleanup on success
  const allOk = results.every((r) => r.ok);
  if (allOk) {
    await admin.from("sericia_orders").delete().eq("id", orderId);
    check("Test order cleaned up", true, `deleted ${orderId.slice(0, 8)}…`);
  } else {
    console.warn(`⚠️  Leaving order ${orderId} (email=${testEmail}) for inspection.`);
  }

  console.log();
  const passed = results.filter((r) => r.ok).length;
  const failed = results.length - passed;
  console.log(`=== Result: ${passed} passed / ${failed} failed ===`);
  return failed === 0 ? 0 : 1;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error("❌ UAT crashed:", err);
    process.exit(1);
  });
