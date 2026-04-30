#### 📋 目次

| # | セクション |
|---|----------|
| 1 | [Critical path — Crossmint Onramp activation](#op-crossmint) |
| 2 | [Cloudflare AI bot toggle (GEO blocker)](#op-cf-bots) |
| 3 | [Search Console & Bing & Yandex verification](#op-search-console) |
| 4 | [Google Indexing API service account](#op-google-indexing) |
| 5 | [Push notification VAPID keys (already deployed)](#op-push-vapid) |
| 6 | [Email — Cloudflare Email Routing health check](#op-email) |
| 7 | [Post-launch monitoring (24h watch)](#op-watch) |

---

# Sericia — Launch Operator Checklist

> Single source of truth for all operator paste / dashboard toggle steps that
> Claude cannot execute. Status as of 2026-04-30. Read top to bottom on
> launch day; do not skip §1 — everything else is parallelisable.

<a id="op-crossmint"></a>
## 1. Critical path — Crossmint Onramp activation

**Status**: ⏸ BLOCKED awaiting Sales Onramp approval.
**Submitted**: 2026-04-30 12:50 JST (form ack received).
**SLA window**: 2026-05-03 → 2026-05-05 JST (1–3 business days).

### Detect activation (automated probe)

Run from any machine that has the production Crossmint API key:

```bash
CROSSMINT_PRODUCTION_API_KEY=sk_production_... \
CROSSMINT_TREASURY_WALLET=0x... \
  npx tsx storefront/scripts/crossmint-onramp-probe.ts
```

Exit codes:
- `0` → ✅ READY. Proceed to §5.6 of `docs/crossmint-integration.md` for $1
  live smoke test.
- `1` → ⏸ BLOCKED. Re-run in 30 minutes. Cron template:
  ```cron
  */30 * * * * cd /path/to/sericia && npx tsx storefront/scripts/crossmint-onramp-probe.ts >> /var/log/crossmint-probe.log 2>&1
  ```
- `2` → ⚠️ ERROR. Read the body excerpt — check API key validity at
  `https://www.crossmint.com/console`.

### After approval: 5-min playbook

Refer to `docs/crossmint-integration.md` §5.1–5.8 — exit-door-first sequence.
Highlights:
1. §5.3 — swap Coolify env: `NEXT_PUBLIC_CROSSMINT_CLIENT_ID` → production id
2. §5.5 — re-register webhook signing secret in Crossmint Console
3. §5.6 — $1 live smoke test (your card, your address)
4. §5.7 — keep the rollback recipe printed within reach until §5.8 sign-off

**Fallback if SLA exceeded** (5+ business days no flip): see
`docs/crossmint-sales-activation.md` §7 for the 3 alternates ranked by speed
(Stripe direct / Stripe Atlas + USDC swap / PayPal Standard).

---

<a id="op-cf-bots"></a>
## 2. 🚨 Cloudflare AI Crawl Control (GEO blocker — fix BEFORE launch)

**Why this is critical**: Cloudflare has TWO separate AI bot controls that
both override `/robots.txt` at the edge. Our 2026-04-30 incident proved that
disabling the simpler "Block AI Bots" toggle is **not enough** — the deeper
"AI Crawl Control" feature also writes Content Signals + per-bot Disallow
rules into the managed `/robots.txt` and must be reconfigured separately.

If left default, /robots.txt serves:
```
Content-Signal: search=yes,ai-train=no
+ Disallow: /  for GPTBot, ClaudeBot, CCBot, Google-Extended,
                 Applebot-Extended, Amazonbot, Bytespider, meta-externalagent
```

This **invalidates the entire GEO playbook** — Drop #1 invisible to AI
search engines (Perplexity / ChatGPT / Gemini / Claude).

### Verify current state

```bash
curl -sS https://sericia.com/robots.txt | grep -A1 "User-agent: GPTBot"
```

- `Disallow: /` → BLOCKED (fix below)
- `Allow: /` or GPTBot line absent → OK

### Fix — TWO settings must both be touched

**Setting A: Block AI Bots** (Security → Settings → AIボットをブロックする)

1. Modal opens with three radios
2. Select **"ブロックしない (クローラーを許可する)"**
3. **Click 保存** (the modal stays open until you click save — selecting the
   radio alone does nothing)
4. Confirm parent text changes to "AIボットをブロックする範囲: ブロックしない（オフ）"

**Setting B: AI Crawl Control** (left sidebar, top — separate top-level item,
just below "最近" / above "調査"). This is the deeper one that controls the
actual robots.txt Content Signals + per-bot rules.

1. Click "AI Crawl Control" in left sidebar
2. Find Content Signals section. Either:
   - Disable AI Crawl Control entirely, OR
   - Change `ai-train` from `no` to `yes` (or remove the signal so no
     restriction is asserted)
3. Find the Per-bot rules / Bot list section. For each AI search bot
   (GPTBot, ClaudeBot, CCBot, Google-Extended, PerplexityBot,
   Applebot-Extended, anthropic-ai), set rule to **Allow** (not Block)
4. Save

### Verify both settings

After **both** A and B are saved, wait 30-60s for edge propagation, then:

```bash
# Should show Allow: / or no GPTBot line at all
curl -sS https://sericia.com/robots.txt | grep -A1 "User-agent: GPTBot"

# Top-level should be Content-Signal absent or with ai-train=yes
curl -sS https://sericia.com/robots.txt | grep -A1 "^User-agent: \*"
```

If still showing the bot blocklist 5+ minutes after save, both settings are
managed at edge and no origin / API workaround exists from current
Cache Rules.Edit token scope. The dashboard is the only fix path.

### Why we don't fight CF at origin

We DO ship explicit `Allow: /` rules for every AI bot in
`storefront/app/(frontend)/robots.ts` — but Cloudflare's edge AI Crawl
Control overrides the origin response entirely (the request never reaches
Next.js for GET /robots.txt when AI Crawl Control is enabled).
Origin intent is documented for clarity and for the case where AI Crawl
Control gets disabled in dashboard.

---

<a id="op-search-console"></a>
## 3. Search Console / Bing / Yandex verification

### Google Search Console

1. https://search.google.com/search-console → Add property → URL prefix → `https://sericia.com`
2. Choose "HTML tag" verification method
3. Copy the `content="..."` value (NOT the full meta tag)
4. Coolify → storefront app → Environment → add:
   ```
   NEXT_PUBLIC_GSC_VERIFICATION=<paste content value>
   ```
5. Redeploy storefront
6. Back in GSC → Verify → should turn green within 30 seconds
7. **Submit sitemap**: GSC → Sitemaps → `https://sericia.com/sitemap.xml` → Submit

### Bing Webmaster Tools (optional but recommended)

1. https://www.bing.com/webmasters → Add site → `https://sericia.com`
2. Choose "HTML meta tag" → copy content value
3. Coolify env: `NEXT_PUBLIC_BING_VERIFICATION=<value>`
4. Redeploy → Verify in Bing
5. Submit sitemap (same URL)

### Yandex Webmaster (covers RU + Eastern Europe)

1. https://webmaster.yandex.com → Add site → meta tag method
2. Coolify env: `NEXT_PUBLIC_YANDEX_VERIFICATION=<value>`
3. Redeploy → Verify
4. Submit sitemap

---

<a id="op-google-indexing"></a>
## 4. Google Indexing API service account (F50 unlock)

**Status**: code wired and ready. Endpoint `/api/google-indexing` returns
`503 google_indexing_unconfigured` until env is set.

### One-time setup

1. https://console.cloud.google.com → Create or pick project
2. APIs & Services → Library → enable **"Indexing API"**
3. APIs & Services → Credentials → **Create Service Account**:
   - Name: `sericia-indexing-bot`
   - Role: skip (none needed at project level)
4. On the service account page → **Keys → Add key → JSON** → download
5. **Verify ownership** of `sericia.com` in Google Search Console (§3 above) —
   the service account email needs to be added as **Owner** of the GSC
   property at https://search.google.com/search-console → Settings → Users
   and permissions → Add user → email = service account email → Permission
   = Owner
6. Take the downloaded JSON file, copy entire contents (Ctrl+A, Ctrl+C)
7. Coolify env (single line, escaped):
   ```
   GOOGLE_INDEXING_SA_JSON=<paste full JSON>
   ```
8. Redeploy storefront

### Verify

```bash
SERICIA_ADMIN_SECRET=xxx npx tsx storefront/scripts/google-indexing-bulk.ts
```

Should output `[google-bulk] batch 1/N ok=...`. First run touches up to 200
URLs (Google's daily quota); re-run with `--offset=200` 24h later for the
remainder of Sericia's 372-URL sitemap.

---

<a id="op-push-vapid"></a>
## 5. Push notification VAPID keys (already deployed — sanity check)

VAPID public + private keys generated during F37 are in Coolify env:
`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT=mailto:tomohiro@sericia.com`.

### Verify

```bash
curl -sS https://sericia.com/api/push/subscribe -X POST \
  -H "Content-Type: application/json" \
  -d '{"endpoint":"https://example.invalid","keys":{"p256dh":"x","auth":"y"}}'
# expected: 401 (RLS — needs auth) or 400 (invalid payload). If 503 →
# VAPID env missing.
```

Real-world subscribe happens client-side via `<PushOptIn>` on
`/account` and `/thank-you`. Test by logging in as a customer and clicking
"Subscribe to drop alerts".

---

<a id="op-email"></a>
## 6. Email — Cloudflare Email Routing health check

`tomohiro@sericia.com` / `contact@` / `accessibility@` / `hello@` all forward
to `apple.info.9124@gmail.com` via CF Email Routing (zero cost).

### Verify

Send a test email from any external address to `tomohiro@sericia.com`.
Should land in `apple.info.9124@gmail.com` inbox within 60 seconds.

### MX / DKIM / SPF (already configured in CF dashboard)

Verify with:
```bash
dig +short MX sericia.com           # → route1/2/3.mx.cloudflare.net
dig +short TXT sericia.com | grep spf
dig +short TXT cf2024-1._domainkey.sericia.com
```

Missing any of these → CF Email Routing dashboard → Email → DNS records → fix.

---

<a id="op-watch"></a>
## 7. Post-launch monitoring (24h watch)

After §1 Crossmint flips to READY and you complete the §5.1–5.8 playbook:

### Hour 0 — first $1 smoke test

- §5.6 of `docs/crossmint-integration.md` — your real card, real address
- Verify webhook lands → Slack `#all-paradigm` should fire `paid` bell
- Verify Medusa admin shows order with `status: paid`
- Verify Resend email arrives at customer mailbox

### Hour 0–6 — first 5 real customer orders

Monitor:
- Slack `#all-paradigm` for `paid` and `webhook` events
- Coolify storefront logs: `coolify logs storefront --tail 200`
- Hetzner CPX22 RAM: `ssh root@46.62.217.172 "free -h"` (must stay above
  500MB free; OOM kills storefront)
- Crossmint Console → Activity → confirm USDC settles to treasury wallet

### Hour 6–24 — SEO + GEO indexing watch

- GSC → Coverage → Indexed pages count (sitemap.xml has 372 URLs)
- IndexNow has flooded Bing/Yandex/Naver/Seznam/Yep at F40
- After §4 (Google Indexing API) lands, run `google-indexing-bulk.ts` →
  expect "Indexed" status changes within 24–48h for top-priority URLs
- Perplexity / ChatGPT Browse — search "Sericia rescued Japanese craft food"
  and verify domain shows up (lagging indicator, may take days)

### Rollback triggers (any one → halt + investigate)

- Crossmint webhook signature failures > 0% (check `/api/crossmint-webhook`
  logs for `401`)
- Storefront error rate > 1% on `/products` or `/products/[slug]`
- Hetzner RAM < 200MB free for 5+ minutes (OOM imminent)
- Resend bounces > 5% (Cloudflare Email Routing forwarding broke)

Rollback recipe: `docs/crossmint-integration.md` §5.7 (env revert + redeploy
in <5 minutes).
