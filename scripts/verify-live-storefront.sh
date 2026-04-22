#!/usr/bin/env bash
# Post-deploy verification for sericia.com storefront.
# Run once any Coolify deploy reaches status=finished.
#
# Checks:
#   1. Homepage HTTP 200
#   2. Dify HOTFIX — no 'WnX69' token or 'App with code' error toast string in HTML
#   3. Medusa product facade — /products page shows at least one product handle
#      (sencha/miso/shiitake/matcha/tea — Drop #1 SKUs exposed by handle, not prod_01 IDs)
#   4. Medusa backend health (api.sericia.com reachable)
#   5. Publishable key still works on store API
#   6. Crossmint webhook endpoint: MUST reject unsigned POSTs (401 ok, 503 = secret unset launch-blocker, 200 = regression)
#   7. i18n hotfix live — flag-icons CSS active + 'English' label (not '>EN<' + '🇬🇧')
#   8. Google OAuth button present on /login and /signup (post-M4a-7 rollout)
#
# Usage:  bash scripts/verify-live-storefront.sh
# Exits 0 if all pass, 1 if any critical check fails.

set -uo pipefail
PASS=0
FAIL=0

check() {
  local name="$1"; shift
  local ok="$1"; shift
  local detail="${1:-}"
  if [ "$ok" = "1" ]; then
    printf "  ✅ %-55s %s\n" "$name" "$detail"
    PASS=$((PASS+1))
  else
    printf "  ❌ %-55s %s\n" "$name" "$detail"
    FAIL=$((FAIL+1))
  fi
}

echo "=== sericia.com post-deploy verification ==="
echo

# 1. Homepage reachable
http_home=$(curl -s --max-time 20 -o /tmp/sericia_home.html -w "%{http_code}" https://sericia.com/ || echo "000")
[ "$http_home" = "200" ] && check "Homepage HTTP 200" 1 "(got $http_home)" || check "Homepage HTTP 200" 0 "(got $http_home — NOT READY)"

# 2. No Dify hardcoded fallback
if grep -qiE "WnX69|App with code" /tmp/sericia_home.html 2>/dev/null; then
  check "M4a-HOTFIX: Dify fallback token removed" 0 "(found WnX69 or 'App with code' in HTML)"
else
  check "M4a-HOTFIX: Dify fallback token removed" 1 "(clean)"
fi

# 3. /products page has at least one Drop #1 product handle
#    (storefront renders products by handle, not by prod_01 ID — handles are the Medusa slugs)
curl -s --max-time 20 -o /tmp/sericia_products.html https://sericia.com/products
product_hits=$(grep -ocE "(sencha|miso|shiitake|matcha|organic-tea)" /tmp/sericia_products.html 2>/dev/null | head -1)
[ "${product_hits:-0}" -ge "1" ] && check "Products page: Drop #1 handles visible" 1 "(found $product_hits match(es))" || check "Products page: Drop #1 handles visible" 0 "(0 handles found — check Medusa product facade)"

# 4. Medusa backend alive
http_api=$(curl -s --max-time 20 -o /dev/null -w "%{http_code}" https://api.sericia.com/health || echo "000")
[ "$http_api" = "200" ] || [ "$http_api" = "404" ] && check "Medusa backend reachable" 1 "(api.sericia.com $http_api)" || check "Medusa backend reachable" 0 "(api.sericia.com $http_api)"

# 5. Publishable key works on store API
pk="pk_3cbe523eed266eb8eead0a6d75841c341ddc63faa31275c37b7e025b1c64798e"
store_http=$(curl -s --max-time 20 -o /tmp/sericia_store_api.json -w "%{http_code}" \
  "https://api.sericia.com/store/products?limit=1&fields=id" \
  -H "x-publishable-api-key: $pk" || echo "000")
[ "$store_http" = "200" ] && check "Medusa Store API + publishable key" 1 "(HTTP 200)" || check "Medusa Store API + publishable key" 0 "(HTTP $store_http)"

# 6. Crossmint webhook endpoint — production must reject unsigned POSTs
#    401 = secret SET + signature missing/invalid (happy path for launch)
#    503 = secret UNSET (fail-close in prod; launch-blocking misconfig)
#    200 = unsafe: either dev env leaked to prod OR fail-close regressed
wh_http=$(curl -s --max-time 15 -o /dev/null -w "%{http_code}" -X POST https://sericia.com/api/crossmint-webhook \
  -H "Content-Type: application/json" -d '{"event":"test"}' || echo "000")
if [ "$wh_http" = "401" ]; then
  check "Crossmint webhook: rejects unsigned req" 1 "(401 — secret configured + signature required)"
elif [ "$wh_http" = "503" ]; then
  check "Crossmint webhook: LAUNCH-BLOCKER — secret unset" 0 "(503 — set CROSSMINT_WEBHOOK_SECRET in Coolify env before launch)"
elif [ "$wh_http" = "200" ]; then
  check "Crossmint webhook: SECURITY REGRESSION" 0 "(200 — unsigned POST accepted; fail-close broken or NODE_ENV!=production)"
else
  check "Crossmint webhook: reachable" 0 "(HTTP $wh_http)"
fi

# 7. i18n hotfix live — flag-icons CSS + 'English' label (regression if '>EN<' or '🇬🇧' appear)
if grep -qE 'fi fi-' /tmp/sericia_home.html 2>/dev/null && ! grep -qE '>EN<|🇬🇧' /tmp/sericia_home.html 2>/dev/null; then
  check "i18n hotfix: flag-icons CSS + English label" 1 "(flag-icons CSS + no regression markers)"
else
  check "i18n hotfix: flag-icons CSS + English label" 0 "(stale i18n — flags may have reverted to text)"
fi

# 8. Magic Link form present on /login and /signup (post-M4a-7 revert)
#    Google OAuth was intentionally removed — the consent screen exposed the
#    raw {project-ref}.supabase.co domain which looked phishy for a premium
#    D2C brand. Until a custom auth domain (auth.sericia.com) is provisioned
#    on Supabase Pro+, Magic Link is the only auth path. Assert that the
#    Magic Link form is live and the OAuth button is NOT accidentally restored.
curl -s --max-time 15 -o /tmp/sericia_login.html https://sericia.com/login
curl -s --max-time 15 -o /tmp/sericia_signup.html https://sericia.com/signup
login_magic=$(grep -cE "Send sign-in link|Email address" /tmp/sericia_login.html 2>/dev/null | head -1)
signup_magic=$(grep -cE "Send sign-in link|Email address" /tmp/sericia_signup.html 2>/dev/null | head -1)
login_oauth_regression=$(grep -cE "Continue with Google|Sign in with Google" /tmp/sericia_login.html 2>/dev/null | head -1)
if [ "${login_magic:-0}" -ge "1" ] && [ "${signup_magic:-0}" -ge "1" ] && [ "${login_oauth_regression:-0}" = "0" ]; then
  check "Magic Link form live (no OAuth regression)" 1 "(login=$login_magic signup=$signup_magic oauth=$login_oauth_regression)"
else
  check "Magic Link form live (no OAuth regression)" 0 "(login=$login_magic signup=$signup_magic oauth=$login_oauth_regression)"
fi

echo
echo "=== Result: $PASS passed / $FAIL failed ==="
[ "$FAIL" = "0" ]
