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
| Crossmint payment **code** (multi-line cart, env name, graceful states) | ✅ Live (F24) | `/api/pay/create` returns scope-aware errors |
| **Crossmint payment runs** | ⚠️ Blocked on Crossmint Console scope (Step 1 below) | Step 4 below |
| **Cloudflare cache rules** | ⚠️ Blocked on scoped CF token (Step 2 below) | `curl -sI / \| grep cf-cache` returns DYNAMIC currently |

<a id="go-2"></a>

## 2. Final manual steps (≈10 min total — F28-F29 reduced this list)

After F28 (tokenLocator + USDC pivot) and F29 (embedded SDK), the
operator-facing surface narrowed to one Console activation + one wallet
paste + one CF token + one $1 smoke test.



### Step 1 — Crossmint Console (~5 min)

Detailed in [crossmint-operator-runbook.md](./crossmint-operator-runbook.md).
Tldr:

1. https://www.crossmint.com/console → Sericia production project
2. Developer settings → API keys → find `sk_production_23uQ1...`
3. Confirm scopes: `orders.create`, `orders.read`, `orders.update`, `payments.read`
4. Payments tab → ensure Credit/debit card is "Enabled" (not "Pending verification")
5. Re-test:
   ```bash
   SK="<bare key from Coolify env CROSSMINT_SERVER_SK>"
   curl -sS -X POST https://www.crossmint.com/api/2022-06-09/orders \
     -H "X-API-KEY: $SK" -H "Content-Type: application/json" \
     -d '{"payment":{"method":"stripe-payment-element","currency":"usd","receiptEmail":"t@s.com"},"lineItems":{"callData":{"totalPrice":"1.00","quantity":1}}}' \
     -w "\nHTTP %{http_code}\n"
   ```
   Expect `HTTP 200` with `clientSecret` + `order.orderId` in the body.

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

```
T+0    : Step 1 — Crossmint Console scopes (5 min)
T+5    : Step 1 verify curl returns 200 ✓
T+5    : Step 2 — CF Cache Rules apply (3 min)
T+8    : Step 2 verify cf-cache-status: HIT ✓
T+8    : Step 3 — $1 smoke test (5 min)
T+13   : Step 3 verify webhook + email + DB ✓
T+13   : Refund the $1, hide test product
T+15   : Internal final-look pass on https://sericia.com
T+30   : Activate Dify KB if desired (~10 min, see docs/dify-kb-activation.md)
T+60   : Send to 3-5 friends to do real purchases ("soft launch")
T+24h  : If no incidents, post to Reddit / X / Instagram
```

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
