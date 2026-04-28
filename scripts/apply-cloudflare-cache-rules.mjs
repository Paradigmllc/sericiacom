#!/usr/bin/env node
// Applies the 3 cache rules from docs/cloudflare-cache-rules.md to sericia.com
// via the Cloudflare API. Idempotent — re-running replaces the existing
// http_request_cache_settings ruleset entrypoint with the same 3 rules.
//
// Required env:
//   CLOUDFLARE_API_TOKEN  — must have `Zone.Cache Rules:Edit` permission
//                           on sericia.com. The default sericia token in
//                           memory is read-only; create a new one at
//                           https://dash.cloudflare.com/profile/api-tokens
//                           with this permission and run the script.
//   CLOUDFLARE_ZONE_ID    — defaults to the sericia.com zone (auto-resolved
//                           if you only have CLOUDFLARE_API_TOKEN with
//                           zones:read)
//
// Usage:
//   CLOUDFLARE_API_TOKEN=cfut_... node scripts/apply-cloudflare-cache-rules.mjs
//
// Why a script (vs. dashboard click-ops):
//   The 3 rules are documented + version-controlled. After this lands you
//   can re-run it on any zone migration (staging clone, multi-region
//   migration, etc.) without re-typing 6 expressions. Aligns with Rule S
//   (infrastructure work via API, not manual operator clicks).

const CF_BASE = "https://api.cloudflare.com/client/v4";

const TOKEN = process.env.CLOUDFLARE_API_TOKEN?.trim();
let ZONE_ID = process.env.CLOUDFLARE_ZONE_ID?.trim();

if (!TOKEN) {
  console.error("[cf-rules] CLOUDFLARE_API_TOKEN env required.");
  console.error(
    "  Create a scoped token at https://dash.cloudflare.com/profile/api-tokens",
  );
  console.error("  Required permission: Zone > Cache Rules > Edit (sericia.com).");
  process.exit(1);
}

const cf = (path, init = {}) =>
  fetch(`${CF_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  }).then(async (r) => {
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j.success === false) {
      throw new Error(
        `[cf-rules] HTTP ${r.status} on ${path} — ${JSON.stringify(j.errors ?? j)}`,
      );
    }
    return j;
  });

// 1. Auto-resolve zone if not provided
if (!ZONE_ID) {
  const r = await cf("/zones?name=sericia.com");
  ZONE_ID = r.result?.[0]?.id;
  if (!ZONE_ID) throw new Error("[cf-rules] sericia.com zone not found");
  console.log(`[cf-rules] zone resolved: ${ZONE_ID}`);
}

// 2. Build the 3 rule definitions (mirrors docs/cloudflare-cache-rules.md)
const rules = [
  // Rule 3 (BYPASS) goes first — order matters, dynamic paths must win
  // when overlapping with HTML-page rule.
  {
    description: "Dynamic paths — bypass",
    expression:
      '(starts_with(http.request.uri.path, "/api/")) or ' +
      '(starts_with(http.request.uri.path, "/cms/")) or ' +
      '(starts_with(http.request.uri.path, "/account/")) or ' +
      '(http.request.uri.path eq "/checkout") or ' +
      '(http.request.uri.path eq "/cart")',
    action: "set_cache_settings",
    action_parameters: { cache: false },
    enabled: true,
  },
  // Rule 1 — long-lived static assets
  {
    description: "Static assets — long cache (1 month edge + browser)",
    expression:
      '(starts_with(http.request.uri.path, "/_next/static/")) or ' +
      '(starts_with(http.request.uri.path, "/placeholders/")) or ' +
      '(http.request.uri.path eq "/favicon.ico") or ' +
      '(http.request.uri.path eq "/og-default.svg") or ' +
      '(ends_with(http.request.uri.path, ".svg")) or ' +
      '(ends_with(http.request.uri.path, ".woff2"))',
    action: "set_cache_settings",
    action_parameters: {
      cache: true,
      edge_ttl: { mode: "override_origin", default: 2592000 }, // 30d
      browser_ttl: { mode: "override_origin", default: 2592000 },
    },
    enabled: true,
  },
  // Rule 2 — HTML pages (2 min edge + 1h SWR)
  {
    description: "Storefront HTML — 2min cache + 1h stale-while-revalidate",
    expression:
      '(http.request.uri.path eq "/") or ' +
      '(http.request.uri.path eq "/products") or ' +
      '(starts_with(http.request.uri.path, "/products/")) or ' +
      '(http.request.uri.path eq "/journal") or ' +
      '(starts_with(http.request.uri.path, "/journal/")) or ' +
      '(starts_with(http.request.uri.path, "/articles/")) or ' +
      '(http.request.uri.path eq "/guides") or ' +
      '(starts_with(http.request.uri.path, "/guides/")) or ' +
      '(http.request.uri.path eq "/tools") or ' +
      '(starts_with(http.request.uri.path, "/tools/")) or ' +
      '(http.request.uri.path in {"/about" "/shipping" "/refund" "/terms" "/privacy" "/accessibility" "/faq" "/sitemap" "/tokushoho"})',
    action: "set_cache_settings",
    action_parameters: {
      cache: true,
      edge_ttl: { mode: "override_origin", default: 120 }, // 2min
      browser_ttl: { mode: "override_origin", default: 0 },
      serve_stale: { disable_stale_while_updating: false },
      // SWR is implicit via Cache Rules SDK — Cloudflare uses this
      // automatically when serve_stale.disable_stale_while_updating is false.
    },
    enabled: true,
  },
];

// 3. Replace the http_request_cache_settings entrypoint ruleset
console.log(`[cf-rules] applying ${rules.length} cache rules to sericia.com…`);
const result = await cf(
  `/zones/${ZONE_ID}/rulesets/phases/http_request_cache_settings/entrypoint`,
  {
    method: "PUT",
    body: JSON.stringify({ rules }),
  },
);

console.log(`[cf-rules] ✅ applied. ruleset id: ${result.result.id}`);
console.log(`[cf-rules] rules now active:`);
result.result.rules.forEach((r, i) => {
  console.log(`   ${i + 1}. ${r.description}`);
});
console.log("");
console.log("[cf-rules] verification:");
console.log("   curl -sI https://sericia.com/products | grep -i cf-cache-status");
console.log("   1st: MISS  /  2nd within 2min: HIT  /  later: REVALIDATED");
