#!/usr/bin/env bash
# F58 smoke test — runs after Stripe envs deploy completes.
#
# Assertions:
#   1. /api/stripe/webhook with no signature → 401 (fail-close + signature-required)
#   2. /api/stripe/create-intent with empty body → 400 order_id_required (route alive)
#   3. /api/stripe/create-intent with non-existent order_id → 404 order_not_found (DB layer alive)
#   4. /pay/<random-uuid> (no order) → 404 (route alive, notFound triggered)
#   5. Live key probe: GET https://api.stripe.com/v1/webhook_endpoints/we_1TVMW2EU4EEn0nZ8JE0Vrof1
#      with sk_live → 200 (confirms our webhook is registered + livemode + enabled)
#
# Does NOT charge a real card. The actual $1 live card test is intentionally
# manual (would require a human card holder + browser session).

set -euo pipefail
HOST="${HOST:-https://sericia.com}"
# Read sk_live_* from env (set by operator). Memory file:
#   ~/.claude/projects/D--dev-sericiacom/memory/reference_api_keys.md
SK_LIVE="${STRIPE_SECRET_KEY:?STRIPE_SECRET_KEY env required (see memory/reference_api_keys.md)}"

pass=0
fail=0
check() {
  local label="$1" actual="$2" expected="$3"
  if [ "$actual" = "$expected" ]; then
    echo "  ✅ $label  [actual=$actual]"
    pass=$((pass+1))
  else
    echo "  ❌ $label  [actual=$actual, expected=$expected]"
    fail=$((fail+1))
  fi
}

echo "=== F58 Stripe smoke test against $HOST ==="
echo

echo "1. /api/stripe/webhook fail-close + signature-required"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$HOST/api/stripe/webhook" \
  -H "Content-Type: application/json" -d '{"hello":"world"}')
check "no-signature → 401" "$code" "401"

echo
echo "2. /api/stripe/create-intent route alive"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$HOST/api/stripe/create-intent" \
  -H "Content-Type: application/json" -d '{}')
check "empty body → 400" "$code" "400"

echo
echo "3. /api/stripe/create-intent DB layer alive"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$HOST/api/stripe/create-intent" \
  -H "Content-Type: application/json" -d '{"order_id":"00000000-0000-0000-0000-000000000000"}')
check "non-existent order → 404" "$code" "404"

echo
echo "4. /pay/<random-uuid> notFound() triggers"
code=$(curl -s -o /dev/null -w "%{http_code}" "$HOST/pay/zzzz-no-such-order-zzzz")
check "missing order → 404" "$code" "404"

echo
echo "5. Stripe webhook endpoint live verification"
ws_status=$(curl -s -u "$SK_LIVE:" \
  "https://api.stripe.com/v1/webhook_endpoints/we_1TVMW2EU4EEn0nZ8JE0Vrof1" \
  | grep -oE '"status":"[^"]+"' | head -1 | sed 's/"status":"//;s/"$//')
check "Stripe webhook status" "$ws_status" "enabled"

echo
echo "=== Result: $pass passed / $fail failed ==="
[ "$fail" -eq 0 ]
