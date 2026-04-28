#### 📋 目次

| # | セクション |
|---|-----------|
| 1 | [What's broken right now](#cm-1) |
| 2 | [Step 1 — Verify SK scopes in Console](#cm-2) |
| 3 | [Step 2 — Enable fiat checkout for the project](#cm-3) |
| 4 | [Step 3 — Re-test the API call](#cm-4) |
| 5 | [Step 4 — End-to-end $1 smoke test](#cm-5) |
| 6 | [Rollback](#cm-6) |
| 7 | [Why we hit this](#cm-7) |

---

# Crossmint operator runbook — unblock card payments

The storefront is wired correctly:
`/api/pay/create` calls Crossmint with the right env var (`CROSSMINT_SERVER_SK`),
the right endpoint (`https://www.crossmint.com/api/2022-06-09/orders`), and
the right payload shape. **The block is on the Crossmint Console side**:
the production SK currently returns `HTTP 403` for `POST /orders`.

This runbook walks the ~5 minute fix.

<a id="cm-1"></a>

## 1. What's broken right now

Reproduce the 403:

```bash
SK=$(ssh -i ~/.ssh/coolify_localhost_key root@46.62.217.172 \
  "docker exec \$(docker ps -q -f name=storefront | head -1) printenv CROSSMINT_SERVER_SK")

curl -sS -X POST https://www.crossmint.com/api/2022-06-09/orders \
  -H "X-API-KEY: $SK" \
  -H "Content-Type: application/json" \
  -d '{
    "payment":{"method":"stripe-payment-element","currency":"usd","receiptEmail":"t@sericia.com"},
    "lineItems":{"callData":{"totalPrice":"1.00","quantity":1}}
  }' \
  -w "\nHTTP %{http_code}\n"
```

Current output: `HTTP 403` with empty body. The 403 + empty body
combination is Crossmint's signal for **"valid auth, but project missing
required scope/feature"** (vs. 401 = invalid key).

What this means for the storefront:
- Visitors land on `/pay/[orderId]`
- Page calls `/api/pay/create` → returns `502 provider_scope_missing`
- `<CrossmintPayment>` renders the "Payment temporarily unavailable" state
  with a concierge mailto fallback
- **No card payments process until this is fixed**

<a id="cm-2"></a>

## 2. Step 1 — Verify SK scopes in Console

1. Sign in to [Crossmint Console](https://www.crossmint.com/console).
2. Top-left project switcher → select the **Sericia production project**
   (project ID `364b45b9-ff42-41…` per memory).
3. Left rail → **Developer settings** → **API keys**.
4. Find the row matching `sk_production_23uQ1AbH4eZxcEKtsHG67MUKN…` (first
   30 chars; the SK starts with `sk_production_23uQ1`).
5. Click the row → **Scopes / Permissions** panel.
6. Confirm these scopes are checked. If any is missing, this is the bug:
   - ✅ `orders.create`
   - ✅ `orders.read`
   - ✅ `orders.update`
   - ✅ `payments.read`

If scopes look correct, move to Step 2 — the issue is project-level.

<a id="cm-3"></a>

## 3. Step 2 — Enable fiat checkout for the project

Even with `orders.create` scope, the project itself must be **enabled for
credit-card payments** (separate from NFT minting):

1. Console → left rail → **Payments**.
2. **Methods** tab → ensure **Credit / debit card** has a green "Enabled"
   pill. If it shows "Pending verification" or "Disabled":
   - Click the row → **KYC checklist**
   - Provide any outstanding business docs (tax ID, bank account,
     beneficial-owner KYC). Crossmint runs this through Stripe Connect's
     standard onboarding — usually clears in 1–3 business days.
3. **Settings** tab → confirm `payment.method: "stripe-payment-element"`
   is in the allowed methods list. If not, add it.

<a id="cm-4"></a>

## 4. Step 3 — Re-test the API call

After scopes + payments are green, re-run the curl from Step 1.

Expected output:

```
HTTP 200
{
  "order": {
    "orderId": "ord_abc123…",
    "payment": {
      "preparation": {
        "stripeClientSecret": "pi_3...secret_..."
      }
    }
  },
  "clientSecret": "pi_3...secret_..."
}
```

If still 403, capture the full response headers:

```bash
curl -sS -X POST https://www.crossmint.com/api/2022-06-09/orders \
  -H "X-API-KEY: $SK" -H "Content-Type: application/json" \
  -d '...' -i  # -i adds response headers
```

Look for `cf-cache-status` (CF block?) or `x-error-id` (Crossmint trace)
and email Crossmint support at support@crossmint.com with that ID — they
resolve scope issues within hours.

<a id="cm-5"></a>

## 5. Step 4 — End-to-end $1 smoke test

Once the API returns 200:

1. Create a $1 product in Medusa Admin temporarily:
   ```bash
   # SSH into Medusa container
   ssh -i ~/.ssh/coolify_localhost_key root@46.62.217.172 \
     "docker exec \$(docker ps -q -f name=medusa | head -1) \
      npx medusa exec ./src/scripts/create-test-product.ts"
   ```
   (or via the Admin UI — set price to $1.00 USD)

2. Add to cart on https://sericia.com → checkout → use a real personal
   card (the `4242 4242 4242 4242` test card only works in `sk_staging_`
   mode; production needs a real charge).

3. Verify:
   - Webhook fires: check Coolify logs for `[crossmint-webhook] order
     paid` with the `sericia_order_id` matching your cart
   - Order email arrives at the address you used at checkout
   - Order status in Supabase flips `pending → paid`:
     ```sql
     SELECT status, crossmint_order_id, paid_at
     FROM sericia_orders WHERE email = 'YOUR@EMAIL';
     ```
   - Stock decrements in Medusa: variant inventory `100 → 99`

4. Issue refund via Crossmint Console (Payments → find order → Refund) to
   reverse the $1.

5. Hide the test product in Medusa Admin (set status to draft).

<a id="cm-6"></a>

## 6. Rollback

To revert the storefront to the concierge-mailto state without redeploying:

```bash
# Set CROSSMINT_SERVER_SK to empty string in Coolify env
curl -X PATCH http://46.62.217.172:8000/api/v1/applications/em2luzsfjoxb77jo3rxl4c9c/envs \
  -H "Authorization: Bearer 3|b0dc083b6c5048a39f06ed5d766344567ca9d6abaaaf3913348dcd1b844ed87224b5329071ac699e" \
  -H "Content-Type: application/json" \
  -d '{"key":"CROSSMINT_SERVER_SK","value":"","is_runtime":true,"is_buildtime":true,"is_preview":false,"is_literal":false}'
```

Then trigger a redeploy. `<CrossmintPayment>` will show the
"payment_provider_unconfigured" graceful state with the concierge mailto.

<a id="cm-7"></a>

## 7. Why we hit this

**Root cause sequence**:

1. The storefront was originally wired against
   `process.env.CROSSMINT_SERVER_API_KEY` (per the original
   `app/api/pay/create/route.ts`).
2. The Coolify env was set as `CROSSMINT_SERVER_SK` (no `_API_` infix).
3. So the route silently fell through `apiKey = undefined` and returned
   `payment_provider_unavailable` for months — concierge mailto became
   the de-facto launch state.
4. We never noticed the env-quote corruption (`'sk_production_…'` with
   wrapping single quotes from `is_literal=true`) because the route
   never ran far enough to authenticate.

**Fixed in F24** (separate PR landing alongside this runbook):
- `app/api/pay/create/route.ts` reads `CROSSMINT_SERVER_SK` (canonical)
- Multi-line items (was hardcoded for the legacy single-drop schema)
- Surfaces `provider_scope_missing` distinctly from `network_error` so
  the UI can show the correct CTA.
- Coolify env quote-stripped via `is_literal=false`.

**Remaining**: Console-side scope enablement, which is what this runbook
walks through.
