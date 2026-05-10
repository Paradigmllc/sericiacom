# Stripe `Invalid API Key provided: pk_live_***` operator playbook

**Reported**: 2026-05-10 — checkout page (/pay/[orderId]) shows red inline
error `Invalid API Key provided: pk_live_***...IUBe` directly under the
"Loading payment form…" skeleton, blocking checkout.

## Diagnosis (this is NOT a code bug)

Stripe.js (the front-end SDK loaded via `loadStripe(publishableKey)` in
`storefront/components/StripePayment.tsx`) is rejecting the publishable
key with that exact error. The key value is whatever the Coolify
storefront env var `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` resolves to at
build time (NEXT_PUBLIC_* is **inlined into the client bundle** by Next.js
at build time, not read at runtime — so changing it requires a redeploy).

`pk_live_` prefix is the format Stripe uses for live publishable keys, so
the issue is **not** "test key in live mode" or "missing prefix". One of
the following is true:

1. **Account mismatch** (most common). The `STRIPE_SECRET_KEY` (sk_live_*)
   was issued by Stripe account A, but `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   (pk_live_*) was copy-pasted from Stripe account B. The PaymentIntent
   gets created in account A's namespace, but Stripe.js loaded with
   account B's publishable key cannot retrieve it → "Invalid API Key".
2. **Truncation / corruption**. Trailing whitespace, smart quotes from a
   doc copy-paste, or a partial key (e.g. only the first half got pasted
   into Coolify).
3. **Revoked key**. The publishable key was rotated in Stripe Dashboard
   (Developers → API keys) and the old value is still in Coolify env.

## Fix (operator action, ≤ 5 minutes)

### Step 1 — Read the current value from Coolify

```bash
# Replace COOLIFY_API_TOKEN with the bearer token from
# ~/.claude/projects/D--dev-sericiacom/memory/reference_api_keys.md
curl -sS -H "Authorization: Bearer ${COOLIFY_API_TOKEN}" \
  "http://46.62.217.172:8000/api/v1/applications/em2luzsfjoxb77jo3rxl4c9c/envs" \
  | jq -r '.[] | select(.key | startswith("STRIPE") or startswith("NEXT_PUBLIC_STRIPE")) | "\(.key) = \(.value[0:14])...\(.value[-4:])"'
```

This prints both keys with first 14 + last 4 characters so you can
visually confirm the prefix and the tail (`...IUBe` in the screenshot
report) without exposing the full secret.

### Step 2 — Cross-check against Stripe Dashboard

1. Open <https://dashboard.stripe.com/apikeys> (make sure you're in **Live**
   mode — top-left toggle).
2. Verify the **Standard keys** section. Both:
   - "Secret key" must equal `STRIPE_SECRET_KEY` from Coolify
   - "Publishable key" must equal `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. **Both keys must come from the same Stripe account.** If you have
   multiple Stripe accounts (sandbox / connected / sub-account), confirm
   the account email at the top of the Dashboard matches the one whose
   webhook signing secret + webhook URL are wired up in
   `STRIPE_WEBHOOK_SECRET`.

### Step 3 — Update Coolify env (if mismatched)

```bash
# Set the corrected publishable key
curl -sS -X PATCH \
  -H "Authorization: Bearer ${COOLIFY_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"key":"NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY","value":"pk_live_<paste-correct-value>","is_preview":false,"is_build_time":true,"is_literal":false}' \
  "http://46.62.217.172:8000/api/v1/applications/em2luzsfjoxb77jo3rxl4c9c/envs"
```

Note `is_build_time: true` — `NEXT_PUBLIC_*` envs MUST be available at
build time (Next.js inlines them into the client bundle). If you flip
this flag wrong, the storefront builds with `undefined` → Stripe.js
crashes with a different error.

### Step 4 — Trigger a deploy

```bash
curl -sS -X POST \
  -H "Authorization: Bearer ${COOLIFY_API_TOKEN}" \
  "http://46.62.217.172:8000/api/v1/deploy?uuid=em2luzsfjoxb77jo3rxl4c9c"
```

### Step 5 — Smoke test ($1 live charge)

After the deploy returns `status: finished`:

1. Open <https://sericia.com> in incognito → add an item → checkout with
   amount $1 (use a low-priced product or a test discount code).
2. On `/pay/[orderId]`, the inline red error must be **gone**.
3. The PaymentElement renders card / Apple Pay / Google Pay / Link tabs.
4. Pay $1 with a real card. Stripe Dashboard → Payments shows the
   succeeded charge. Refund it from the Dashboard immediately.

## Why this isn't fixable from code

The publishable key is **operator-supplied configuration**, not code. The
storefront has no way to validate "is this publishable key for the same
account as the secret key" before showing the customer the payment form
— Stripe deliberately doesn't expose an "introspect publishable key"
endpoint (security: it would let attackers map `pk_*` to account
metadata). The only signal we get is Stripe.js's runtime rejection,
which is exactly what surfaced in the screenshot.

We could add a server-side liveness check that creates + immediately
cancels a $0.50 PaymentIntent on storefront boot, but that adds a
production code path with cancelable side effects for a problem that's
trivially fixable with the playbook above.

## Related

- F54 — Hyperswitch (legacy fallback, not used on launch rail)
- F58 — Stripe primary rail migration (this is the active rail)
- F67 — `/pay` i18n hybrid CMS + next-intl resolver (the *other* bug
  reported in the same screenshot, fixed in code)
