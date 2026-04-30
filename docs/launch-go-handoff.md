#### 📋 目次

| # | セクション |
|---|-----------|
| 1 | [What is shipped + live](#go-1) |
| 2 | [3 manual steps remaining (≈15 min total)](#go-2) |
| 3 | [Recommended launch sequence](#go-3) |
| 4 | [Day-2 ops checklist](#go-4) |
| 5 | [Rollback paths](#go-5) |

---

# Launch GO — operator handoff

This document covers the bridge from "F24 deployed" to "store open."
Everything below is pre-built, scripted, and tested where possible.
The remaining 3 steps require operator credentials I cannot impersonate
(Crossmint Console, Cloudflare scoped token, your real card for the
$1 smoke test).

<a id="go-1"></a>

## 1. What is shipped + live

| Surface | State | Verify |
|--------|-------|--------|
| Brand UI / Aesop-tier chrome (header, footer, PDP, cart, hero, mega-menu) | ✅ Live | https://sericia.com/products |
| 10-locale i18n on all visible chrome (login / signup / checkout / 12 page heros) | ✅ Live | https://sericia.com/ja/login → "おかえりなさい" |
| Mobile primary nav drawer (vaul) | ✅ Live | iPhone viewport on https://sericia.com → hamburger left of wordmark |
| Checkout gate ("Sign in or check out as guest") | ✅ Live | https://sericia.com/checkout |
| Toast/notification design (LuxuryToaster) | ✅ Live | Triggers via any cart action |
| Cart → order creation → /pay routing | ✅ Live | Add to cart → checkout → /pay/{order_id} |
| Order confirmation + shipping notification email templates | ✅ Live | Resend wired via `lib/email.ts`, fires from cart-create + admin ship routes |
| Refund request form (`/refund/request`) | ✅ Live (F24) | https://sericia.com/refund/request |
| Refund request → DB → operator email | ✅ Live (F24) | Submitting form persists to `sericia_refund_requests` + emails contact@sericia.com |
| Crossmint webhook signature enforcement | ✅ Live | `whsec_Svrn+wfiFypdLt5SEU+/YQZe7zNSBqMF` set, route returns 401 unsigned |
| Rate limiter (60/min default, 20/min for `/api/dify-chat`) | ✅ Live | F16 |
| Tailwind RGB-channel tokens (WCAG eyebrow contrast fixed) | ✅ Live | F20 |
| Coolify cron: `docker builder prune` every 6h | ✅ Live (F24) | `crontab -l \| grep sericia-prune` on 46.62.217.172 |
| Crossmint payment **code** (multi-line cart, env name, graceful states) | ✅ Live (F24/F28/F29/F33) | `/api/pay/create` returns scope-aware errors |
| **Crossmint payment runs** | ⚠️ Blocked on Crossmint **Sales Onramp activation** (Step 1 below — superseded crossmint-operator-runbook scope theory) | 2026-04-30 production probe returned: "Onramp is not yet enabled for production use" → see [crossmint-sales-activation.md](./crossmint-sales-activation.md) |
| **Cloudflare cache rules** | ⚠️ Blocked on scoped CF token (Step 2 below) | `curl -sI / \| grep cf-cache` returns DYNAMIC currently |

<a id="go-2"></a>

## 2. Final manual steps (≈10 min total — F28-F29 reduced this list)

After F28 (tokenLocator + USDC pivot) and F29 (embedded SDK), the
operator-facing surface narrowed to one Console activation + one wallet
paste + one CF token + one $1 smoke test.



### Step 1 — Crossmint **Sales** Onramp activation (~10 min hands-on, then 1–3 business days SLA)

**Updated 2026-04-30**: a production API probe today returned the
project-level message *"Onramp is not yet enabled for production use…
please contact our team at crossmint.com/contact/sales to enable
production access."* This is a Crossmint-side **sales-gated** capability,
not a self-serve Console toggle. The earlier
[crossmint-operator-runbook.md](./crossmint-operator-runbook.md) scope
theory is superseded by this finding — the SK is valid, scopes are fine,
the gate is partnerships team approval.

Full runbook: [crossmint-sales-activation.md](./crossmint-sales-activation.md).
Tldr:

1. Open https://www.crossmint.com/contact/sales in a new tab
2. Paste the "Section 3 — sales inquiry copy" from the runbook (already
   includes project ID, SK prefix, treasury wallet, business profile,
   target geos, expected volume — Crossmint's partnerships team uses
   these to look up the project without round-tripping)
3. Run "Section 4 — Console pre-flight" (~2 min) so the project state
   looks complete when sales reviews
4. Hit submit. Expected acknowledgement: <24 hours. Expected approval:
   1–3 business days.

Re-probe to detect approval (run any time):
```bash
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
```
- Still gated → response body contains "Onramp is not yet enabled"
- Approved → response body contains `"orderId":"ord_…"` + `"clientSecret"` → proceed to Step 3 ($1 smoke test)

### Step 2 — Cloudflare Cache Rules (~3 min)

The token I have is read-only. You need a scoped token with
`Zone.Cache Rules:Edit` for sericia.com:

1. https://dash.cloudflare.com/profile/api-tokens → Create Token
2. Template: "Edit zone DNS" → Customize permissions:
   - Zone > Zone > Read
   - Zone > Cache Rules > Edit
3. Zone Resources: Include > Specific zone > sericia.com
4. Create → copy the `cfut_*` token
5. Run the apply script:
   ```bash
   CLOUDFLARE_API_TOKEN=cfut_NEW_TOKEN \
     node scripts/apply-cloudflare-cache-rules.mjs
   ```
   It will:
   - Auto-resolve the sericia.com zone ID
   - PUT 3 rules to the `http_request_cache_settings` ruleset
     (static / HTML SWR / dynamic-bypass)
   - Print the rule IDs + verification curl

6. Verify:
   ```bash
   curl -sI https://sericia.com/products | grep -i cf-cache-status
   # 1st hit: MISS, 2nd within 2 min: HIT, later: REVALIDATED
   ```

### Step 3 — Real-card $1 smoke test (~5 min)

Per [crossmint-operator-runbook.md §5](./crossmint-operator-runbook.md#cm-5):

1. Create a $1 product in Medusa Admin (price 100 cents = $1.00, status published)
2. Add to cart on https://sericia.com → checkout (as guest is fine)
3. Click "Pay with card" → enter your real card on Crossmint's hosted page
4. Verify webhook fires (Coolify storefront logs):
   ```bash
   ssh -i ~/.ssh/coolify_localhost_key root@46.62.217.172 \
     "docker logs --tail 50 \$(docker ps -q -f name=storefront | head -1) 2>&1 | grep crossmint-webhook"
   ```
5. Verify confirmation email arrives + DB shows `paid` status
6. Refund the $1 in Crossmint Console (Payments → Refund)
7. Hide the $1 product (status → draft)

<a id="go-3"></a>

## 3. Recommended launch sequence

Updated 2026-04-30 to reflect Crossmint sales SLA. The end-to-end
critical path is **submit-form → wait → smoke-test**, not
"all-three-steps in 15 minutes":

```
DAY 0
T+0    : Step 1 — Submit Crossmint sales form (10 min, see crossmint-sales-activation.md §3)
T+10   : Step 2 — Apply CF Cache Rules (3 min, can run in parallel with Crossmint waiting period)
T+13   : Step 2 verify cf-cache-status: HIT ✓
T+13   : Optional pre-launch polish (CMS sample content, Dify KB activation)

DAY 1–3 (Crossmint sales review)
       : Watch inbox for Crossmint partnerships reply
       : Re-probe daily via the curl in §1 above to detect approval

WHEN APPROVED (typically email arrives 1–3 business days after submit)
T+0    : Re-probe production → expect HTTP 200 + clientSecret ✓
T+0    : Real-card $1 smoke test on sericia.com (5 min)
T+5    : Verify webhook + email + DB row paid=true ✓
T+5    : Refund the $1 in Crossmint Console, hide test product
T+10   : Internal final-look pass on https://sericia.com
T+30   : Send to 3-5 friends to do real purchases ("soft launch")
T+24h  : If no incidents, post to Reddit / X / Instagram
```

**Net wall-clock from "store-open intent" to "first dollar accepted":
1–3 business days bounded by Crossmint sales SLA, with everything else
parallelised into the wait period.**

<a id="go-4"></a>

## 4. Day-2 ops checklist

- [ ] Slack `SLACK_WEBHOOK_URL` set in Coolify env (currently graceful-null)
  → Cart abandonment, low-stock, refund alerts will fire to #all-paradigm
- [ ] Dify KB activated: https://sericia.com/api/dify-chat returns answers
  grounded in actual journal + product data
  (see [dify-kb-activation.md](./dify-kb-activation.md))
- [ ] n8n post-deploy warmup webhook wired to Coolify "On deploy succeeded"
  → Sitemap-driven warm-up after every deploy keeps cache hot
- [ ] Optional: extend DeepSeek translation pipeline to journal articles
  (see [article-tool-localization-pipeline.md](./article-tool-localization-pipeline.md),
  ~$15 + 11h editorial review for full corpus)

<a id="go-5"></a>

## 5. Rollback paths

**If Crossmint payments break after launch**:
Coolify env → set `CROSSMINT_SERVER_SK=""` → redeploy. UI reverts to
graceful "preparing card payment integration" state with concierge mailto.

**If Cloudflare cache breaks something** (bad rule expression):
CF dashboard → Cache → Cache Rules → toggle the rule "Off" (instant). CF stops
caching new requests; existing cached HTML continues serving until 2-min
edge TTL expires (so worst-case 2 min of slightly-stale content).

**If Coolify deploy goes ENOSPC (Rule WW)**:
```bash
ssh -i ~/.ssh/coolify_localhost_key root@46.62.217.172 \
  "docker builder prune -af && docker image prune -af && docker volume prune -f"
```

**Hetzner instance unresponsive**:
```bash
curl -sS -X POST -H "Authorization: Bearer 68QIgkdz..." \
  "https://api.hetzner.cloud/v1/servers/120806259/actions/reset"
```
2-3 min recovery.
