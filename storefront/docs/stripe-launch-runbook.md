# Stripe Launch Runbook (F58)

> **Status**: code complete, operator setup pending. Once the steps below are
> executed, Sericia accepts real-card payments at `https://sericia.com/pay/{orderId}`.

This runbook activates Stripe direct as Sericia's **primary launch payment rail**,
replacing the pending Crossmint Onramp activation (F35/F36 — Sales review still
"We're reviewing your submission" as of 2026-05-10).

Hyperswitch (F54) remains in the codebase as a **legacy / future self-host
fallback** — the operator can flip back to it any time by setting
`NEXT_PUBLIC_STRIPE_ENABLED=false` and `NEXT_PUBLIC_HYPERSWITCH_ENABLED=true`.
Crossmint stays accordion-optional via `NEXT_PUBLIC_CROSSMINT_ENABLED=true`.

---

## 0. Architecture overview

```
Customer (browser)
  └─ /pay/{orderId}
       ├─ POST /api/stripe/create-intent → server creates PaymentIntent
       │       returns { client_secret, publishable_key }
       └─ <Elements clientSecret>
            <PaymentElement /> (cards / Apple Pay / Google Pay / Link)
            <button>Pay</button> → stripe.confirmPayment()
                                    ↓ (succeeds in-page or redirect)
                                  /thank-you/{orderId}

Stripe (background)
  └─ POST /api/stripe/webhook  ← HMAC SHA-256 signed
       ├─ payment_intent.succeeded   → flip order to `paid`,
       │                               decrement Medusa stock,
       │                               Slack bell, Resend email,
       │                               n8n escalation
       ├─ payment_intent.payment_failed → log to sericia_events
       └─ charge.refunded             → flip order to `refunded`
```

**Idempotency**: `idempotencyKey: sericia_intent_{orderId}` on PaymentIntent
creation prevents duplicate intents from rapid-clicked Pay buttons. Webhook
handler short-circuits on `status === "paid"` to absorb Stripe's occasional
double-deliveries.

**Fail-close**: in production, missing `STRIPE_WEBHOOK_SECRET` → 503 on every
webhook. Stripe retries 5xx with exponential backoff for 3 days (16 attempts),
so a config gap doesn't lose orders — it parks them until the gap closes.

---

## 1. Stripe Dashboard one-time setup

> Estimated time: **15 minutes** (most of it is waiting for Apple Pay verification).

### 1.1 Verify production access is enabled

1. Open https://dashboard.stripe.com — Paradigm LLC account.
2. Top-left toggle should read **"Production"** (not "Test mode").
3. Settings → Account → Activate payments — the form must read
   "Your account is fully activated to accept payments". If anything is
   pending (KYC, business verification), finish that first.

### 1.2 Enable payment methods for our 12 launch countries

Settings → Payment methods → for each row, click "Turn on" if not already on:

- **Cards** (Visa / Mastercard / Amex / JCB) — must be on
- **Apple Pay** — must be on (verifies domain in step 1.4)
- **Google Pay** — must be on
- **Link** — recommended on (Stripe-internal: ~30% conversion lift)
- **Klarna / Affirm** — optional, US/UK/AU/EU only. Off by default for Sericia
  (luxury D2C — pay-later associations dilute the brand). Operator can flip on
  later without code change.

### 1.3 Configure customer notifications

Settings → Emails — Sericia sends its own brand-voiced confirmation email
from the webhook (Resend), so:

- **Successful payments** → leave **ON** (Stripe sends a transactional receipt
  with the official "$X charged by PARADIGM LLC" wording — this is legal
  evidence the customer wants).
- Both emails coexist fine: Stripe = transactional proof, Sericia = experience.

### 1.4 Verify Apple Pay domain

Settings → Payment methods → Apple Pay → "Add a new domain":

1. Enter `sericia.com`.
2. Stripe shows a verification file path:
   `https://sericia.com/.well-known/apple-developer-merchantid-domain-association`
3. Stripe **auto-hosts** this file when the domain is added in dashboard
   (no code action required as long as the storefront proxies `/.well-known/*`
   passes through). If Stripe reports "verification failed", manually download
   the file from dashboard and place it at
   `storefront/public/.well-known/apple-developer-merchantid-domain-association`,
   commit, redeploy.

Verification typically completes in **30 seconds** to **5 minutes**. Test
result: an Apple Pay button appears on `/pay/{orderId}` when viewed in
Safari on a Mac/iPhone with Apple Pay set up.

### 1.5 Register the webhook endpoint

Developers → Webhooks → "Add endpoint":

| Field | Value |
|-------|-------|
| Endpoint URL | `https://sericia.com/api/stripe/webhook` |
| Description | `Sericia Drop #1 — production` |
| Listen to | "Events on your account" |
| Events to send | `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded` |
| API version | (leave default, matches `apiVersion: "2025-09-30.clover"` in `lib/stripe.ts`) |

After clicking "Add endpoint", Stripe shows the **Signing secret**
(`whsec_...`). **Copy it now** — you'll only see it once. This is what
goes into Coolify env (step 2.3).

> **Why these three events only**: Stripe ships ~150 event types. Most are
> noise (`charge.succeeded` fires alongside `payment_intent.succeeded` —
> processing it would double-trigger our fanout). Sericia listens to the
> minimal set that drives state transitions. To add events later (e.g.
> `dispute.created`), edit the endpoint in Stripe Dashboard.

---

## 2. Coolify env injection

> Estimated time: **5 minutes**.

Storefront app UUID: `kvox6zxs02jinepf2gjdm4z2`
(per `~/.claude/projects/D--dev-sericiacom/memory/reference_api_keys.md`)

PATCH the storefront environment variables to add:

```bash
# Required (server-only) — actual values in ~/.claude/projects/D--dev-sericiacom/memory/reference_api_keys.md
STRIPE_SECRET_KEY=sk_live_<from-memory>
STRIPE_WEBHOOK_SECRET=whsec_<from-step-1.5-Stripe-Dashboard>

# Required (browser-readable, NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_<from-memory>

# Optional (defaults are fine for launch)
NEXT_PUBLIC_STRIPE_ENABLED=true        # default true; set false to revert to Hyperswitch legacy path
NEXT_PUBLIC_CROSSMINT_ENABLED=false    # flip to true once Crossmint Sales approves
NEXT_PUBLIC_HYPERSWITCH_ENABLED=false  # flip to true if migrating to self-hosted Hyperswitch OSS
```

> **Rule R**: actual `sk_live_*` / `pk_live_*` values are stored in
> `~/.claude/projects/D--dev-sericiacom/memory/reference_api_keys.md`
> (VCS-untracked). Never paste them into any file in `storefront/` or
> commit them — GitHub secret scanning will block the push and Stripe
> will auto-revoke the key once exposed publicly.

### 2.1 Use Coolify API (preferred — auditable, no dashboard fat fingers)

```bash
COOLIFY_TOKEN="4|38RwBrykrGTUC32nj2uE2eJPRpUvfLFXttuGMtBb02cad30b"
APP_UUID="kvox6zxs02jinepf2gjdm4z2"
COOLIFY_BASE="http://46.62.217.172:8000"

curl -X PATCH "$COOLIFY_BASE/api/v1/applications/$APP_UUID/envs" \
  -H "Authorization: Bearer $COOLIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '[
    { "key": "STRIPE_SECRET_KEY", "value": "sk_live_...", "is_preview": false },
    { "key": "STRIPE_WEBHOOK_SECRET", "value": "whsec_...", "is_preview": false },
    { "key": "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "value": "pk_live_...", "is_preview": false }
  ]'
```

### 2.2 Trigger redeploy

```bash
curl -X GET "$COOLIFY_BASE/api/v1/deploy?uuid=$APP_UUID&force=true" \
  -H "Authorization: Bearer $COOLIFY_TOKEN"
```

Watch the deploy until status `finished` (per `~/.claude/knowledge/safe-deploy.md` — Coolify deploy is **not** done at trigger; only at `finished` status).

---

## 3. $1 live smoke test

> Estimated time: **5 minutes**.

1. Navigate to `https://sericia.com/products/product-sencha`, add to cart, check out
   with a $1 manual override (Medusa admin: temporarily set price to 100 cents).
2. At `/pay/{orderId}` you should see Stripe Elements (cards + Apple Pay if
   Safari + Google Pay if Chrome on Android).
3. Pay with **your real card** (`sk_live_*` is in production — test cards
   `4242 4242 4242 4242` will be **rejected**). $1 = lowest round-trip cost.
4. Expected outcomes:
   - Browser redirects to `/thank-you/{orderId}` (or shows in-page success for
     Apple Pay).
   - Stripe Dashboard → Payments shows the `pi_*` succeeded.
   - **Stripe Dashboard → Developers → Webhooks → endpoint** shows
     `payment_intent.succeeded` delivered with response `200`.
   - Slack `#all-paradigm` shows order_paid bell (Rule N).
   - `sericia_orders.status = 'paid'` for that order.
   - `sericia_orders.crossmint_order_id` = `pi_*` (Stripe PaymentIntent id —
     intentionally reused column to avoid schema migration; F58 lib/stripe.ts §webhook).
   - Customer email arrives from `contact@sericia.com` via Resend.
5. **Refund the $1** in Stripe Dashboard to clear the test charge:
   Payments → click `pi_*` → "Refund". Within ~10s,
   `sericia_orders.status` should flip to `refunded` and a `order_refunded`
   row should appear in `sericia_events`.

If any of these fail, see §5 Troubleshooting.

---

## 4. Sign-off gate

Don't mark Stripe go-live complete until **all** are green:

- [ ] §1.1 production access activated (no pending KYC/business verification)
- [ ] §1.2 cards + Apple Pay + Google Pay + Link enabled
- [ ] §1.4 Apple Pay domain `sericia.com` verified ✓
- [ ] §1.5 webhook endpoint `https://sericia.com/api/stripe/webhook` registered with all 3 events
- [ ] §2 all 3 required envs set in Coolify (secret + webhook + publishable)
- [ ] §2.2 deploy reached `finished` status
- [ ] §3 $1 live smoke test: payment succeeds + webhook fires + Slack bell rings + DB flips to `paid`
- [ ] §3 refund test: `charge.refunded` webhook fires + DB flips to `refunded`

---

## 5. Troubleshooting

### "publishable_key_missing" 503 from /api/stripe/create-intent

`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is not set or empty in the storefront
container. Verify in Coolify dashboard → app → Environment Variables, then
**redeploy** (not just restart — `NEXT_PUBLIC_*` are inlined at build-time).

### "stripe_api_key_missing" 503 from /api/stripe/create-intent

`STRIPE_SECRET_KEY` is not set in the storefront container. Same fix as above
but redeploy is optional (server env reads at runtime).

### Webhook always returns 401 "stripe_signature_invalid"

The `STRIPE_WEBHOOK_SECRET` value in Coolify env doesn't match the one Stripe
shows in Dashboard → Webhooks → endpoint → Signing secret. Common causes:

1. Copied a previous endpoint's secret. Click "Reveal" on the active endpoint.
2. Trailing whitespace / newline in the env value (Coolify dashboard sometimes
   adds them on paste). Re-enter via API (§2.1) which strips whitespace.
3. Wrong webhook URL — verify the Dashboard endpoint URL is exactly
   `https://sericia.com/api/stripe/webhook` (no trailing slash, https not
   http, sericia.com not sericia.com.).

### Webhook returns 503 in production

`STRIPE_WEBHOOK_SECRET` is missing in production env. By design — fail-close
prevents an attacker from forging webhooks while config is incomplete. Set
the secret + redeploy.

### Apple Pay button doesn't appear on Safari/iPhone

1. Apple Pay must be enabled in step 1.2.
2. Domain must be verified in step 1.4 (typically takes <5 min — check
   Dashboard for green ✓ on `sericia.com`).
3. Customer must have Apple Pay set up on their device. Test on a different
   device if unsure.

### Order stays `pending` after payment succeeded in Stripe Dashboard

Webhook isn't reaching the storefront. Check:

1. Stripe Dashboard → Developers → Webhooks → endpoint → "Recent deliveries"
   — what's the response code?
2. If 401 → §"Webhook always returns 401" above.
3. If 503 → §"Webhook returns 503 in production" above.
4. If 200 but no order flip — the order's `metadata.sericia_order_id` is
   missing or doesn't match a row. Check the PaymentIntent's metadata in
   Dashboard.

### Customer charged twice (duplicate PaymentIntent)

Should not happen because of `idempotencyKey: sericia_intent_{orderId}` in
`lib/stripe.ts`. If it does, it means two different orders were created for
the same cart — investigate `sericia_orders` for duplicate rows with same
`email + amount_usd + created_at` window.

---

## 6. Rollback to Hyperswitch (legacy path)

If Stripe direct surfaces a critical bug post-launch and we need to swap rails
without a code redeploy:

```bash
COOLIFY_TOKEN="4|..."
APP_UUID="kvox6zxs02jinepf2gjdm4z2"
curl -X PATCH "$COOLIFY_BASE/api/v1/applications/$APP_UUID/envs" \
  -H "Authorization: Bearer $COOLIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '[
    { "key": "NEXT_PUBLIC_STRIPE_ENABLED", "value": "false", "is_preview": false },
    { "key": "NEXT_PUBLIC_HYPERSWITCH_ENABLED", "value": "true", "is_preview": false }
  ]'
# then trigger deploy as in §2.2
```

This routes new orders to `/api/hyperswitch/*` and `<HyperswitchPayment>` —
the F54 codepath which was previously battle-tested in deploys 2026-04-30 →
2026-05-09.

In-flight Stripe-issued PaymentIntents continue to work (the Stripe webhook
handler stays mounted regardless of the flag), so existing `pending` orders
don't break.

---

## 7. References

- F35: `docs/launch-operator-checklist.md` (master launch checklist with
  Crossmint as critical path — pre-Stripe-pivot version)
- F36: `docs/crossmint-sales-activation.md` (Crossmint Sales runbook —
  parked while Stripe is primary)
- F54: `docs/hyperswitch-setup.md` + `lib/hyperswitch.ts` (legacy path code)
- F55: `lib/payment-settings.ts` + `globals/PaymentSettings.ts` (CMS-backed
  copy + matrix — feeds visible labels into `<StripePayment>`)
- Stripe API version: `2025-09-30.clover` (pinned in `lib/stripe.ts`)
- Stripe webhook signature verification:
  https://docs.stripe.com/webhooks/signatures
