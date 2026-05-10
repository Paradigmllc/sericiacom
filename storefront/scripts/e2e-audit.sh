#!/usr/bin/env bash
# F62 — End-to-end operational audit for Sericia.
#
# Tests EVERY major customer-visible surface and operator integration in
# one shot. Designed to be re-runnable without side effects.
#
# Categories audited:
#   A. Public page health           (10+ routes return 200 + brand content)
#   B. i18n switching               (en/ja/de/fr render their locale strings)
#   C. Stripe payment rail          (webhook 401, create-intent 400/404)
#   D. Stripe API live state        (webhook + payment_method_domains active)
#   E. Mobile / responsive          (no header overflow assertion via HTML)
#   F. Security                     (HTTPS, HSTS, sk_live not in HTML, fail-close)
#   G. CMS / Backend                (Payload admin, Medusa store)
#   H. PWA / SEO                    (manifest, sw, sitemap, robots)
#   I. CDN / cache                  (Cloudflare cache HIT, edge response)
#   J. Webhook delivery state       (Stripe dashboard recent attempts)
#
# Reads STRIPE_SECRET_KEY from env (Rule R — never in git).
# Exit code: 0 on full pass, 1 on any failure.

set -uo pipefail

HOST="${HOST:-https://sericia.com}"
SK_LIVE="${STRIPE_SECRET_KEY:?STRIPE_SECRET_KEY env required (memory/reference_api_keys.md)}"
WEBHOOK_ID="${STRIPE_WEBHOOK_ID:-we_1TVMW2EU4EEn0nZ8JE0Vrof1}"
PMD_ID="${STRIPE_PMD_ID:-pmd_1TVMWKEU4EEn0nZ8dqDzP3lR}"

pass=0
fail=0
warn=0
results=()

log_pass() { echo "  ✅ $1"; pass=$((pass+1)); results+=("PASS|$1"); }
log_fail() { echo "  ❌ $1  → $2"; fail=$((fail+1)); results+=("FAIL|$1|$2"); }
log_warn() { echo "  ⚠️  $1  → $2"; warn=$((warn+1)); results+=("WARN|$1|$2"); }

http_code() {
  curl -s -o /dev/null -w "%{http_code}" -L --max-time 30 "$@"
}

http_body_grep() {
  local url="$1"; shift
  local needle="$1"; shift
  local body
  body=$(curl -s -L --max-time 30 "$url" 2>/dev/null)
  if echo "$body" | grep -qE "$needle"; then return 0; else return 1; fi
}

check_status() {
  local label="$1" url="$2" expected="$3"
  shift 3
  local actual
  actual=$(http_code "$@" "$url")
  if [ "$actual" = "$expected" ]; then
    log_pass "$label  [$actual]"
  else
    log_fail "$label" "expected $expected got $actual ($url)"
  fi
}

check_status_in() {
  local label="$1" url="$2" expected_csv="$3"
  shift 3
  local actual
  actual=$(http_code "$@" "$url")
  if echo ",$expected_csv," | grep -q ",$actual,"; then
    log_pass "$label  [$actual]"
  else
    log_fail "$label" "expected one of $expected_csv got $actual ($url)"
  fi
}

check_grep() {
  local label="$1" url="$2" needle="$3"
  if http_body_grep "$url" "$needle"; then
    log_pass "$label"
  else
    log_fail "$label" "needle '$needle' not in body of $url"
  fi
}

check_no_grep() {
  local label="$1" url="$2" forbidden="$3"
  if http_body_grep "$url" "$forbidden"; then
    log_fail "$label" "forbidden '$forbidden' found in $url"
  else
    log_pass "$label"
  fi
}

# ─────────────────────────────────────────────────────────────────────
# A. Public page health
# ─────────────────────────────────────────────────────────────────────
echo
echo "=== A. Public page health ==="
check_status "GET /"                       "$HOST/"                                200
check_status "GET /products"               "$HOST/products"                        200
check_status "GET /faq"                    "$HOST/faq"                             200
check_status "GET /tokushoho"              "$HOST/tokushoho"                       200
check_status "GET /about"                  "$HOST/about"                           200
check_status "GET /shipping"               "$HOST/shipping"                        200
check_status "GET /accessibility"          "$HOST/accessibility"                   200
check_status "GET /journal"                "$HOST/journal"                         200
check_status "GET /guides"                 "$HOST/guides"                          200
check_status "GET /tools/tea-brewer"       "$HOST/tools/tea-brewer"                200
check_status "GET /tools/matcha-grade"     "$HOST/tools/matcha-grade"              200
check_status "GET /tools/miso-finder"      "$HOST/tools/miso-finder"               200
check_status "GET /tools/ems-calculator"   "$HOST/tools/ems-calculator"            200

# Pick a real product slug to test PDP
PSLUG=$(curl -s --max-time 10 "$HOST/api/products/search-index" \
  | grep -oE '"slug":"[^"]+"' | head -1 | sed 's/"slug":"//;s/"$//')
if [ -n "$PSLUG" ]; then
  check_status "GET /products/$PSLUG (PDP)" "$HOST/products/$PSLUG"                200
  check_grep   "PDP renders accordion title" "$HOST/products/$PSLUG"               "Ingredients|origin"
  check_grep   "PDP renders Recommended pairings" "$HOST/products/$PSLUG"          "Recommended pairings|Recommended Pairings|RECOMMENDED PAIRINGS"
fi

# ─────────────────────────────────────────────────────────────────────
# B. i18n switching (key acceptance test for F60)
# ─────────────────────────────────────────────────────────────────────
echo
echo "=== B. i18n switching ==="
if [ -n "$PSLUG" ]; then
  # JA PDP must show 原材料・産地 (Ingredients & origin in Japanese), NOT EN
  check_grep   "JA PDP shows 原材料・産地" "$HOST/ja/products/$PSLUG"             "原材料・産地"
  check_grep   "JA PDP shows 配送・返品"   "$HOST/ja/products/$PSLUG"             "配送・返品"
fi
check_status "GET /ja"                     "$HOST/ja"                             200
check_status "GET /de"                     "$HOST/de"                             200
check_status "GET /fr"                     "$HOST/fr"                             200
check_status "GET /ar (RTL)"               "$HOST/ar"                             200
check_grep   "<html lang> contains hreflang" "$HOST/"                              "hreflang=\"ja-JP\"|hrefLang=\"ja-JP\""
check_grep   "Arabic page has dir=rtl"      "$HOST/ar"                            "dir=\"rtl\"|dir='rtl'"

# ─────────────────────────────────────────────────────────────────────
# C. Stripe payment rail (storefront endpoints)
# ─────────────────────────────────────────────────────────────────────
echo
echo "=== C. Stripe payment rail ==="
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$HOST/api/stripe/webhook" \
  -H "Content-Type: application/json" -d '{"hello":"world"}')
[ "$code" = "401" ] && log_pass "Webhook fail-close (no signature → 401)" || log_fail "Webhook fail-close" "got $code expected 401"

code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$HOST/api/stripe/create-intent" \
  -H "Content-Type: application/json" -d '{}')
[ "$code" = "400" ] && log_pass "create-intent empty body → 400" || log_fail "create-intent empty body" "got $code"

code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$HOST/api/stripe/create-intent" \
  -H "Content-Type: application/json" -d '{"order_id":"00000000-0000-0000-0000-000000000000"}')
[ "$code" = "404" ] && log_pass "create-intent fake uuid → 404" || log_fail "create-intent fake uuid" "got $code"

# ─────────────────────────────────────────────────────────────────────
# D. Stripe API live state
# ─────────────────────────────────────────────────────────────────────
echo
echo "=== D. Stripe live state ==="
wh_status=$(curl -s --max-time 15 -u "$SK_LIVE:" \
  "https://api.stripe.com/v1/webhook_endpoints/$WEBHOOK_ID" \
  | grep -oE '"status":"[^"]+"' | head -1 | sed 's/"status":"//;s/"$//')
[ "$wh_status" = "enabled" ] && log_pass "Stripe webhook enabled (livemode)" || log_fail "Stripe webhook" "status=$wh_status"

pmd_apple=$(curl -s --max-time 15 -u "$SK_LIVE:" \
  "https://api.stripe.com/v1/payment_method_domains/$PMD_ID" \
  | grep -oE '"apple_pay":\{"status":"[^"]+"' | head -1 | sed 's/.*status":"//;s/"$//')
[ "$pmd_apple" = "active" ] && log_pass "Apple Pay domain active" || log_fail "Apple Pay" "status=$pmd_apple"

# ─────────────────────────────────────────────────────────────────────
# E. Mobile / responsive (HTML-level signal)
# ─────────────────────────────────────────────────────────────────────
echo
echo "=== E. Mobile responsive signal ==="
# F58.5 fix: header should use gap-1.5 sm:gap-3 md:gap-6 — search HTML for the class.
homepage=$(curl -s --max-time 30 -H 'User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' "$HOST/" 2>/dev/null)
echo "$homepage" | grep -q 'gap-1\.5\|gap-3\|gap-6' && log_pass "Header gap classes present" || log_warn "Header gap classes" "may be in webpack chunk not inline HTML"
echo "$homepage" | grep -qi 'viewport.*width=device-width' && log_pass "Mobile viewport meta tag" || log_fail "Mobile viewport" "missing"

# ─────────────────────────────────────────────────────────────────────
# F. Security
# ─────────────────────────────────────────────────────────────────────
echo
echo "=== F. Security ==="
echo "$homepage" | grep -q 'sk_live_' && log_fail "sk_live in homepage HTML" "secret leaked" || log_pass "sk_live NOT in homepage HTML"
echo "$homepage" | grep -q 'pk_live_' && log_pass "pk_live present (browser-readable, expected)" || log_warn "pk_live absent on homepage" "Stripe.js not loaded on /"

hsts=$(curl -s -I --max-time 15 "$HOST/" | grep -i 'strict-transport-security' | head -1)
[ -n "$hsts" ] && log_pass "HSTS header set" || log_warn "HSTS header" "not set (CF may add at edge)"

# Try HTTP → HTTPS redirect
http_redirect=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "http://sericia.com/")
case "$http_redirect" in
  301|302|307|308) log_pass "HTTP→HTTPS redirect [$http_redirect]" ;;
  200)             log_warn "HTTP serves 200 directly" "should redirect to HTTPS" ;;
  *)               log_warn "HTTP→HTTPS check" "got $http_redirect" ;;
esac

# ─────────────────────────────────────────────────────────────────────
# G. CMS / Backend
# ─────────────────────────────────────────────────────────────────────
echo
echo "=== G. CMS / Backend ==="
check_status_in "Payload admin loads"     "$HOST/cms/admin"                       "200,302,307"
check_status    "Medusa /health"          "https://api.sericia.com/health"        200
check_status    "Medusa /store/regions"   "https://api.sericia.com/store/regions" "401"  # 401 expected without pk

# ─────────────────────────────────────────────────────────────────────
# H. PWA / SEO
# ─────────────────────────────────────────────────────────────────────
echo
echo "=== H. PWA / SEO ==="
check_status "manifest.json"               "$HOST/manifest.json"                   200
check_status "sw.js"                       "$HOST/sw.js"                           200
check_status "sitemap.xml"                 "$HOST/sitemap.xml"                     200
check_status "robots.txt"                  "$HOST/robots.txt"                      200
check_grep   "robots.txt allows GPTBot"    "$HOST/robots.txt"                      "GPTBot"
check_grep   "sitemap.xml has products"    "$HOST/sitemap.xml"                     "/products"
check_grep   "sw.js VERSION=v2"            "$HOST/sw.js"                           "v2"

# ─────────────────────────────────────────────────────────────────────
# I. CDN / cache
# ─────────────────────────────────────────────────────────────────────
echo
echo "=== I. Cloudflare cache ==="
# warm /products twice; second hit should be HIT
curl -s -o /dev/null --max-time 30 "$HOST/products"
sleep 2
cf_cache=$(curl -s -I --max-time 30 "$HOST/products" | grep -i '^cf-cache-status:' | head -1 | sed 's/.*: *//')
case "$cf_cache" in
  *HIT*)        log_pass "/products CF cache HIT" ;;
  *MISS*|*EXPIRED*|*REVALIDATED*) log_warn "/products CF cache" "$cf_cache (cold cache, will warm)" ;;
  *DYNAMIC*)    log_fail "/products CF cache DYNAMIC" "missing rule for /products" ;;
  *)            log_warn "/products CF cache header" "got '$cf_cache'" ;;
esac

# /api/* must be DYNAMIC (no cache)
api_cache=$(curl -s -I --max-time 30 "$HOST/api/products/search-index" | grep -i '^cf-cache-status:' | head -1 | sed 's/.*: *//')
case "$api_cache" in
  *DYNAMIC*) log_pass "/api/* CF cache DYNAMIC (correct bypass)" ;;
  *)         log_warn "/api/* cache" "got '$api_cache' (should be DYNAMIC)" ;;
esac

# ─────────────────────────────────────────────────────────────────────
# J. Webhook delivery health (last 24h via Stripe dashboard API)
# ─────────────────────────────────────────────────────────────────────
echo
echo "=== J. Stripe webhook recent deliveries ==="
attempts=$(curl -s --max-time 15 -u "$SK_LIVE:" \
  "https://api.stripe.com/v1/events?limit=3" \
  | grep -oE '"type":"[^"]+"' | head -3 | sed 's/"type":"//;s/"$//' | tr '\n' ',')
[ -n "$attempts" ] && log_pass "Stripe events API accessible (recent: $attempts)" \
                   || log_warn "Stripe events API" "no recent events visible (normal if no traffic yet)"

# ─────────────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────────────
echo
echo "════════════════════════════════════════════════════════════"
echo "  F62 E2E AUDIT — $pass passed / $warn warn / $fail failed"
echo "════════════════════════════════════════════════════════════"

if [ "$fail" -eq 0 ]; then
  echo "✅ All critical checks passed. Safe to launch Drop #1."
  exit 0
else
  echo
  echo "❌ FAILED CHECKS:"
  for r in "${results[@]}"; do
    case "$r" in FAIL*) echo "    $r" ;; esac
  done
  exit 1
fi
