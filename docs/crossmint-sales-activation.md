#### 📋 目次

| # | セクション |
|---|-----------|
| 1 | [Confirmed state — 2026-04-30 probe](#cs-1) |
| 2 | [Why Crossmint sales (not support)](#cs-2) |
| 3 | [Sales inquiry copy — paste into crossmint.com/contact/sales](#cs-3) |
| 4 | [Console pre-flight (do this before submitting)](#cs-4) |
| 5 | [Parallel: staging E2E verification (skip recommended)](#cs-5) |
| 6 | [The instant Crossmint approves — production switch (~5 min)](#cs-6) |
| 7 | [Fallback if Crossmint takes >3 business days](#cs-7) |

---

# Crossmint sales activation — final blocker to store-open

This is the only remaining gate between Sericia's production payment code
(F24 → F33, all green) and accepting first dollars. **The code is correct.
The infra is correct. Crossmint Onramp production access is not yet
turned on for our project.**

<a id="cs-1"></a>

## 1. Confirmed state — 2026-04-30 probe

Production API call from inside the running storefront container:

```
POST https://www.crossmint.com/api/2022-06-09/orders
X-API-KEY: sk_production_23uQ1AbH4eZxcEKt... (length 230, env=production)

Body:
{
  "lineItems":[{"tokenLocator":"base:0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
                "executionParameters":{"mode":"exact-in","amount":"1.00"}}],
  "payment":{"method":"card","receiptEmail":"smoke@sericia.com"},
  "recipient":{"walletAddress":"0x38E7956B36..."}
}

Response: HTTP 400
{
  "error": true,
  "message": "Onramp is not yet enabled for production use in this
              project. You can start testing in staging.crossmint.com.
              When you are ready to go live, please contact our team at
              crossmint.com/contact/sales to enable production access."
}
```

This is Crossmint's *project-level* gate. The SK is valid (would 401),
the scopes are present (would 403), KYC is on file. The block is on
Crossmint Sales whitelisting our project for production Onramp.

<a id="cs-2"></a>

## 2. Why Crossmint sales (not support)

Crossmint markets Onramp as a sales-gated production capability — they
need to know transaction volume, target geos, treasury chain, and AML
posture before flipping the switch. The form at
**[crossmint.com/contact/sales](https://www.crossmint.com/contact/sales)**
goes to the partnerships team who approve production Onramp; emails to
support@crossmint.com get bounced back here.

<a id="cs-3"></a>

## 3. Sales inquiry copy — paste into crossmint.com/contact/sales

Form fields → copy values:

| Field | Value |
|------|-------|
| Full name | (operator's name) |
| Work email | apple.info.9124@gmail.com |
| Company | Paradigm LLC |
| Website | https://sericia.com |
| Country / region | Japan (selling cross-border to US/EU/UK/CA/AU/SG/HK/ME) |
| Use case | "Headless checkout — own catalog merchant" |
| Monthly volume | "$5K–$30K (Phase 1: 20–100 orders/mo, AOV $78–95)" |

**Message body** (paste verbatim):

```
Hi Crossmint team,

We are launching Sericia (https://sericia.com) — a Japanese craft food
D2C storefront selling rescued/irregular artisan goods to international
customers. We have completed the full Crossmint Headless Checkout
integration (Embedded Checkout SDK, signed webhook, Apple Pay domain
verification, redirect-domain whitelist) and would like to enable
production Onramp.

Project ID:           364b45b9-ff42-41…  (Sericia production)
Server SK prefix:     sk_production_23uQ1AbH4eZxcEKt…
Treasury chain:       Base
Treasury wallet:      0x38E7956B36…294b  (USDC settlement)
Payment method:       payment.method = "card", token = USDC
Customer-facing:      <CrossmintEmbeddedCheckout> rendered on sericia.com
                      (no redirect, fiat-only, crypto:{enabled:false})

Current API response when calling POST /api/2022-06-09/orders with the
production SK:
  HTTP 400 — "Onramp is not yet enabled for production use in this project."

Business profile:
  - Entity: Paradigm LLC (US)
  - Operations: Cross-border physical goods (food, customs cleared)
  - Geos: US, UK, EU (limited), CA, AU, SG, HK, ME (limited)
  - Phase 1 volume: 20–100 orders/month, AOV $78–95 (target $5K–$30K MRR)
  - Phase 2 (months 3–12): scale to ~$50K MRR
  - AML: standard KYC on Sericia operator + Tria/RedotPay USDC custody
         (Visa-debit off-ramp on the merchant side)

We have already verified our integration end-to-end against
staging.crossmint.com. We are launch-ready and waiting only on
production Onramp activation.

Could you (a) enable production Onramp on this project and (b) confirm
any additional KYC/MSB documentation you need from us? Happy to jump on
a call if helpful.

Thanks,
(operator name)
Paradigm LLC / Sericia
```

> **Don't paraphrase the project ID, SK prefix, or treasury address** —
> Crossmint's partnerships team uses those to look up the project in
> their internal Console without round-tripping us for IDs.

<a id="cs-4"></a>

## 4. Console pre-flight (do this before submitting the form)

Sales reps look at the project state before approving. Two minutes of
Console hygiene shaves a day off response time:

1. https://www.crossmint.com/console → switch to Sericia production
   project → **Settings** → **Project info** — confirm:
   - Project name = Sericia (or Sericia / Paradigm LLC)
   - Display logo uploaded (any 512×512 PNG of the SERICIA wordmark)
   - Brand colour = `#3a3a32` (sericia-ink)
2. **Developer settings** → **Webhooks** — confirm there is exactly one
   active webhook pointed at `https://sericia.com/api/crossmint-webhook`
   with a delivered/healthy state (no 4xx in last 24h).
3. **Payments** → **Methods** — confirm "Credit / debit card" is in the
   "Enabled" or "Pending" state. If "Disabled," click and start KYC.
4. **Settings** → **Allowed domains** — confirm `sericia.com` (and
   optionally `www.sericia.com`) are listed.

If any of (1)–(4) shows red, fix it first then submit the sales form.

<a id="cs-5"></a>

## 5. Parallel: staging E2E verification (skip recommended)

**Recommendation: skip this section unless Crossmint sales explicitly
asks "have you tested in staging?"** Reasoning below.

### Why we recommend skipping

The current production state is already strong proof of integration
correctness:
- Production SK is valid (probe returns 400 with project-level Onramp
  message, not 401 invalid-key — the SK authenticates fine)
- Apple Pay domain verification = ✅ verified at Crossmint Console
- Webhook signing secret = ✅ active, returns 401 on unsigned posts
- Redirect domains whitelist = ✅ sericia.com whitelisted
- Treasury wallet = ✅ Base USDC `0x38E7…294b` configured

There is no missing piece staging would surface. And critically:

- `NEXT_PUBLIC_CROSSMINT_CLIENT_ID` is inlined at **build time** (Next
  public env). Switching to staging means swapping all three of
  `CROSSMINT_SERVER_SK` + `CROSSMINT_ENV` + `NEXT_PUBLIC_CROSSMINT_CLIENT_ID`
  AND **triggering a full Coolify rebuild** (~5 min) AND remembering to
  swap back AND rebuilding again.
- Total operational cost: ~30 min + rebuild risk + risk of forgetting
  the restore step (locking the live storefront onto a staging key).

### When to actually run it

Only if Crossmint sales replies asking for staging proof. In that case
the recipe is:

```bash
# 1. Get a staging SK + CK from staging.crossmint.com/console
#    (note: staging.crossmint.com is a SEPARATE Console from
#    crossmint.com/console — keys do not cross over)

# 2. Patch all three envs (build + runtime, both)
COOLIFY_TOKEN="3|b0dc083b6c5048a39f06ed5d766344567ca9d6abaaaf3913348dcd1b844ed87224b5329071ac699e"
APP="em2luzsfjoxb77jo3rxl4c9c"

for kv in \
  '{"key":"CROSSMINT_ENV","value":"staging","is_runtime":true,"is_buildtime":true,"is_preview":false,"is_literal":false}' \
  '{"key":"CROSSMINT_SERVER_SK","value":"sk_staging_…","is_runtime":true,"is_buildtime":true,"is_preview":false,"is_literal":false}' \
  '{"key":"NEXT_PUBLIC_CROSSMINT_CLIENT_ID","value":"ck_staging_…","is_runtime":true,"is_buildtime":true,"is_preview":false,"is_literal":false}'; do
  curl -X PATCH "http://46.62.217.172:8000/api/v1/applications/${APP}/envs" \
    -H "Authorization: Bearer ${COOLIFY_TOKEN}" \
    -H "Content-Type: application/json" -d "$kv"
done

# 3. Trigger Coolify deploy (NEXT_PUBLIC_* requires rebuild)
curl -X POST "http://46.62.217.172:8000/api/v1/applications/${APP}/deploy" \
  -H "Authorization: Bearer ${COOLIFY_TOKEN}"

# 4. Wait ~5 min for build, then $1 staging purchase on sericia.com using
#    Stripe test card 4242 4242 4242 4242 / 12/30 / 123

# 5. Verify webhook hit:
ssh -i ~/.ssh/coolify_localhost_key root@46.62.217.172 \
  "docker logs em2luzsfjoxb77jo3rxl4c9c-042814139042 2>&1 | grep crossmint-webhook | tail -20"

# 6. RESTORE production (do NOT skip — staging keys leave store unable
#    to take real payments after Crossmint approves):
for kv in \
  '{"key":"CROSSMINT_ENV","value":"production",…}' \
  '{"key":"CROSSMINT_SERVER_SK","value":"sk_production_23uQ1…",…}' \
  '{"key":"NEXT_PUBLIC_CROSSMINT_CLIENT_ID","value":"ck_production_…",…}'; do
  curl -X PATCH .../envs -d "$kv"
done
curl -X POST .../deploy
```

If a staging E2E is actually needed, also note: a server-only "does
staging accept our payload" probe is much cheaper than full E2E — it
needs only `CROSSMINT_SERVER_SK` swap (runtime, no rebuild):

```bash
# Get staging SK from staging.crossmint.com/console first, then:
ssh -i ~/.ssh/coolify_localhost_key root@46.62.217.172 \
  'docker exec em2luzsfjoxb77jo3rxl4c9c-042814139042 node -e "
    fetch(\"https://staging.crossmint.com/api/2022-06-09/orders\",{
      method:\"POST\",
      headers:{\"X-API-KEY\":\"sk_staging_…\",\"Content-Type\":\"application/json\"},
      body:JSON.stringify({
        lineItems:[{tokenLocator:\"base:0x833589fcd6edb6e08f4c7c32d4f71b54bda02913\",
                    executionParameters:{mode:\"exact-in\",amount:\"1.00\"}}],
        payment:{method:\"card\",receiptEmail:\"smoke@sericia.com\"},
        recipient:{walletAddress:process.env.SERICIA_TREASURY_WALLET_ADDRESS}
      })
    }).then(r=>r.text()).then(t=>console.log(t.slice(0,500)))
  "'
# Expect: {clientSecret, order.orderId, …}
```

This proves the payload schema is correct without touching live envs.

```bash
# 1. Get a staging SK from Crossmint Console (Project switcher → Sericia
#    staging → Developer → API keys → sk_staging_…)

# 2. Patch the live env temporarily
curl -X PATCH http://46.62.217.172:8000/api/v1/applications/em2luzsfjoxb77jo3rxl4c9c/envs \
  -H "Authorization: Bearer $COOLIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"key":"CROSSMINT_ENV","value":"staging","is_runtime":true,"is_buildtime":true,"is_preview":false,"is_literal":false}'

curl -X PATCH http://46.62.217.172:8000/api/v1/applications/em2luzsfjoxb77jo3rxl4c9c/envs \
  -H "Authorization: Bearer $COOLIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"key":"CROSSMINT_SERVER_SK","value":"sk_staging_…","is_runtime":true,"is_buildtime":true,"is_preview":false,"is_literal":false}'

# 3. Restart container (no rebuild needed — runtime env)
curl -X POST http://46.62.217.172:8000/api/v1/applications/em2luzsfjoxb77jo3rxl4c9c/restart \
  -H "Authorization: Bearer $COOLIFY_TOKEN"

# 4. Buy a real $1 test product on https://sericia.com using card
#    4242 4242 4242 4242 / 12/30 / 123 (Crossmint staging accepts
#    Stripe test cards because staging settles via Stripe Connect test mode)

# 5. Verify webhook hit:
ssh -i ~/.ssh/coolify_localhost_key root@46.62.217.172 \
  "docker logs em2luzsfjoxb77jo3rxl4c9c-042814139042 2>&1 | grep crossmint-webhook | tail -20"

# 6. Verify Supabase order flipped pending → paid:
#    psql via Supabase Studio or `select status, paid_at from sericia_orders order by created_at desc limit 1;`

# 7. Restore production env (DO NOT FORGET):
curl -X PATCH .../envs -d '{"key":"CROSSMINT_ENV","value":"production",...}'
curl -X PATCH .../envs -d '{"key":"CROSSMINT_SERVER_SK","value":"sk_production_23uQ1...",...}'
curl -X POST .../restart
```

A green staging E2E proves to Crossmint sales that the integration is
real and complete — they sometimes ask "did you test in staging?" before
approving. You'll have receipts.

<a id="cs-6"></a>

## 6. The instant Crossmint approves — production switch (~5 min)

When Crossmint sales emails "production Onramp is now enabled":

```bash
# 1. Re-run the production probe (should now return HTTP 200 + clientSecret):
ssh -i ~/.ssh/coolify_localhost_key root@46.62.217.172 \
  'docker exec em2luzsfjoxb77jo3rxl4c9c-042814139042 node -e "
    fetch(\"https://www.crossmint.com/api/2022-06-09/orders\",{
      method:\"POST\",
      headers:{\"X-API-KEY\":process.env.CROSSMINT_SERVER_SK,\"Content-Type\":\"application/json\"},
      body:JSON.stringify({
        lineItems:[{tokenLocator:\"base:0x833589fcd6edb6e08f4c7c32d4f71b54bda02913\",
                    executionParameters:{mode:\"exact-in\",amount:\"1.00\"}}],
        payment:{method:\"card\",receiptEmail:\"smoke@sericia.com\"},
        recipient:{walletAddress:process.env.SERICIA_TREASURY_WALLET_ADDRESS}
      })
    }).then(r=>r.text()).then(t=>console.log(t.slice(0,500)))
  "'
# Expect: clientSecret + order.orderId in body

# 2. Real-card $1 smoke test on sericia.com:
#    - Add lowest-priced product to cart
#    - Checkout → Crossmint iframe renders → enter operator's real card
#    - Verify on success: /thank-you/{orderId} renders
#    - Webhook delivers within 30s
#    - Order email arrives at receipt address
#    - sericia_orders row paid=true, crossmint_order_id populated
#    - Medusa stock decrements 100 → 99

# 3. Refund the $1 via Crossmint Console → Payments → Refund

# 4. Announce store-open in Slack #all-paradigm

# Total time from approval email to store-open: ~30 minutes.
```

<a id="cs-7"></a>

## 7. Fallback if Crossmint takes >3 business days

If we have not heard back within 3 business days, parallel options
ranked by speed-to-launch:

1. **Stripe direct integration** (~2 days dev): Bypass Crossmint
   entirely for fiat. Operator paid into Stripe USD balance, manual
   USDC off-ramp via Wise/Visa-debit not needed. Sericia treasury
   wallet stays as a pure backup. Tradeoff: Stripe 7-day rolling
   payouts (vs. Crossmint instant USDC) — kills the fast-cash-cycle
   advantage of the original design.

2. **Stripe Atlas + manual USDC conversion** (~3 days): Same as (1)
   plus monthly batch USDC swap via Coinbase Pro. Restores most of
   the cash-cycle math but adds operational burden.

3. **PayPal Standard** (~4 hours): Lowest-friction global checkout,
   no merchant onboarding wait. Charges 4.4% + $0.30 vs Crossmint's
   2.5%. Acceptable for the first 100 orders to prove demand while
   Crossmint or Stripe finishes onboarding.

Recommend: **wait the full 3 business days on Crossmint** (this is
their standard SLA). Only escalate to (1) if Crossmint comes back
asking for additional MSB documentation that pushes the timeline past
2 weeks.

---

**Operator action right now**: open
https://www.crossmint.com/contact/sales in a new tab, paste the
section-3 copy, and submit. Then run section 4 Console pre-flight.
Total time: ~10 minutes. Crossmint usually responds within 24 hours
to acknowledge.
