#!/usr/bin/env node
// Applies the 3 cache rules from docs/cloudflare-cache-rules.md to sericia.com
// via the Cloudflare API. Idempotent — re-running replaces the existing
// http_request_cache_settings ruleset entrypoint with the same 3 rules.
//
// Required env:
//   CLOUDFLARE_API_TOKEN  — must have the following permissions on sericia.com:
//                             Zone > Cache Rules > Edit     (for F72)
//                             Zone > Settings > Edit        (for F70 Auto Minify)
//                           The default appexx.me-scoped token cannot be used.
//                           Create a new token at:
//                           https://dash.cloudflare.com/profile/api-tokens
//   CLOUDFLARE_ZONE_ID    — defaults to the sericia.com zone (auto-resolved
//                           if you only have CLOUDFLARE_API_TOKEN with
//                           zones:read)
//   SKIP_MINIFY_FIX=1     — skip the F70 Auto Minify HTML disable step
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
  // Rule 2 — HTML pages (1 hour edge + SWR + 60s browser)
  // F51: added /uses/* and /compare/*
  // F72: added all locale-prefixed paths (/ja /de /fr /es /it /ko /zh-TW /ru /ar
  //      and their subpaths). Without these, locale pages hit CF's default
  //      DYNAMIC treatment because Next.js ISR emits Cache-Control: private.
  //      override_origin TTL bypasses the origin's private directive so CF
  //      can cache them at the edge. Prerequisite: F71 (conditional
  //      Set-Cookie) must be deployed first, otherwise CF marks every
  //      locale request DYNAMIC due to the Set-Cookie response header.
  {
    description: "Storefront HTML — 1h edge cache + SWR + 60s browser",
    expression:
      '(http.request.uri.path eq "/") or ' +
      '(http.request.uri.path eq "/products") or ' +
      '(starts_with(http.request.uri.path, "/products/")) or ' +
      '(http.request.uri.path eq "/journal") or ' +
      '(starts_with(http.request.uri.path, "/journal/")) or ' +
      '(starts_with(http.request.uri.path, "/articles/")) or ' +
      '(http.request.uri.path eq "/guides") or ' +
      '(starts_with(http.request.uri.path, "/guides/")) or ' +
      '(starts_with(http.request.uri.path, "/uses/")) or ' +
      '(starts_with(http.request.uri.path, "/compare/")) or ' +
      '(http.request.uri.path eq "/tools") or ' +
      '(starts_with(http.request.uri.path, "/tools/")) or ' +
      '(http.request.uri.path in {"/about" "/shipping" "/refund" "/terms" "/privacy" "/accessibility" "/faq" "/sitemap" "/tokushoho"}) or ' +
      // F72 — locale-prefixed paths (9 non-default locales)
      '(http.request.uri.path eq "/ja") or (starts_with(http.request.uri.path, "/ja/")) or ' +
      '(http.request.uri.path eq "/de") or (starts_with(http.request.uri.path, "/de/")) or ' +
      '(http.request.uri.path eq "/fr") or (starts_with(http.request.uri.path, "/fr/")) or ' +
      '(http.request.uri.path eq "/es") or (starts_with(http.request.uri.path, "/es/")) or ' +
      '(http.request.uri.path eq "/it") or (starts_with(http.request.uri.path, "/it/")) or ' +
      '(http.request.uri.path eq "/ko") or (starts_with(http.request.uri.path, "/ko/")) or ' +
      '(http.request.uri.path eq "/zh-TW") or (starts_with(http.request.uri.path, "/zh-TW/")) or ' +
      '(http.request.uri.path eq "/ru") or (starts_with(http.request.uri.path, "/ru/")) or ' +
      '(http.request.uri.path eq "/ar") or (starts_with(http.request.uri.path, "/ar/"))',
    action: "set_cache_settings",
    action_parameters: {
      cache: true,
      edge_ttl: { mode: "override_origin", default: 3600 }, // 1h
      browser_ttl: { mode: "override_origin", default: 60 }, // 60s
      serve_stale: { disable_stale_while_updating: false },
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

// 4. F70 — Disable CF Auto Minify HTML (requires Zone:Settings:Edit permission)
// CF Auto Minify HTML strips <!DOCTYPE html> + <html> tags from cached
// responses, which breaks React hydration. Must be OFF for any SSR/ISR app.
// Bypass: curl -k -H "Host: sericia.com" https://46.62.217.172/ | head -c 100
//   → origin returns <!DOCTYPE html> correctly; CF minified version does not.
if (!process.env.SKIP_MINIFY_FIX) {
  console.log("");
  console.log("[cf-rules] F70 — disabling CF Auto Minify HTML…");
  try {
    const minifyResult = await cf(
      `/zones/${ZONE_ID}/settings/minify`,
      {
        method: "PATCH",
        body: JSON.stringify({ value: { html: false, css: false, js: false } }),
      },
    );
    const v = minifyResult.result?.value ?? minifyResult.result;
    console.log(`[cf-rules] ✅ Auto Minify disabled. html=${v?.html} css=${v?.css} js=${v?.js}`);
  } catch (err) {
    if (String(err).includes("403") || String(err).includes("10000")) {
      console.warn("[cf-rules] ⚠️  Auto Minify step needs Zone:Settings:Edit permission.");
      console.warn("           Re-create the API token with that scope and re-run.");
      console.warn("           Set SKIP_MINIFY_FIX=1 to skip this step.");
    } else {
      throw err;
    }
  }
}

console.log("");
console.log("[cf-rules] verification:");
console.log("   # Check locale caching (F72):");
console.log("   curl -sI https://sericia.com/ja | grep -i cf-cache-status");
console.log("   curl -sI https://sericia.com/de | grep -i cf-cache-status");
console.log("   # 1st: MISS  /  2nd within 1h: HIT");
console.log("");
console.log("   # Check DOCTYPE present (F70):");
console.log("   curl -s https://sericia.com/ | head -c 100");
console.log("   # Expected: <!DOCTYPE html><html ...");
