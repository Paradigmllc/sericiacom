#### 📋 目次

| # | セクション |
|---|-----------|
| 1 | [<a id="pf-1"></a>目的とスコープ](#pf-1) |
| 2 | [<a id="pf-2"></a>前提条件と安全装置](#pf-2) |
| 3 | [<a id="pf-3"></a>実行方法](#pf-3) |
| 4 | [<a id="pf-4"></a>チェック項目（8点）](#pf-4) |
| 5 | [<a id="pf-5"></a>テストが検証しないこと（重要）](#pf-5) |
| 6 | [<a id="pf-6"></a>失敗時の調査手順](#pf-6) |

---

## <a id="pf-1"></a>1. 目的とスコープ

`storefront/scripts/uat-purchase-flow.ts` は **cart → order → Crossmint webhook → paid → inventory decrement → notifications** の「Bridge側」全体をE2Eで検証するスクリプト。

実ブラウザ・実クレジットカード・実USDC送金を介在させずに、同じ `CROSSMINT_WEBHOOK_SECRET` で webhook ボディを自前で署名・送信する手法で Bridge以降の挙動を完全に再現する。

**このテストで検証される 8ステージ**:
1. Medusa Store API から公開中・在庫ありの商品を発見
2. `/api/orders/create-cart` で `sericia_orders` 行を `pending` で作成
3. `pending` 行に指定商品の `sericia_order_items` と正しい `amount_usd` が入っている
4. （オプション）`/api/pay/create` で Crossmint sandbox に実際にオーダー登録
5. 自前署名した `order.succeeded` webhook が 200 で受理される
6. webhook 処理後に `sericia_orders.status='paid'`、`paid_at` / `crossmint_order_id` / `tx_hash` が揃う
7. `sericia_events` に `event_name='order_paid'` が記録される
8. 改竄したボディを同じ署名で送信すると 401 で拒否される（HMAC検証が生きている）

---

## <a id="pf-2"></a>2. 前提条件と安全装置

### 必須環境変数
```bash
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
CROSSMINT_WEBHOOK_SECRET              # デプロイ済み storefront と完全一致
STOREFRONT_URL=https://staging.sericia.com
MEDUSA_PUBLISHABLE_KEY                # 商品発見用
UAT_ALLOW_DESTRUCTIVE=1               # 安全装置インターロック
```

### 安全装置（3段）
スクリプトは**以下すべてを満たさないと起動しない**:
1. `UAT_ALLOW_DESTRUCTIVE=1` が明示的にセットされている（`sericia_orders` / `sericia_events` に行を挿入する副作用を認識した上で実行していることの表明）
2. `STOREFRONT_URL` が `sericia.com` のまま（staging なし）ではない — 本番誤爆ガード
3. 必須環境変数が全部揃っている

### オプション
```bash
UAT_SKIP_CROSSMINT=1                  # /api/pay/create を飛ばしてオフラインBridgeのみテスト
```
Crossmint sandbox が落ちている時 / ローカル開発でインターネットを使いたくない時に使う。ステージ4がスキップされるだけで残りは全通過する。

---

## <a id="pf-3"></a>3. 実行方法

### 推奨: staging + sandbox で全通し
```bash
cd storefront
STOREFRONT_URL=https://staging.sericia.com \
CROSSMINT_ENV=staging \
CROSSMINT_WEBHOOK_SECRET=whsec_staging_xxx \
NEXT_PUBLIC_SUPABASE_URL=... \
SUPABASE_SERVICE_ROLE_KEY=... \
MEDUSA_PUBLISHABLE_KEY=pk_... \
UAT_ALLOW_DESTRUCTIVE=1 \
npm run uat:purchase-flow
```

### オフラインBridge試験のみ（最速）
```bash
UAT_SKIP_CROSSMINT=1 \
UAT_ALLOW_DESTRUCTIVE=1 \
STOREFRONT_URL=http://localhost:8000 \
... \
npm run uat:purchase-flow
```

---

## <a id="pf-4"></a>4. チェック項目（8点）

| # | 項目 | 失敗時の意味 |
|---|------|-------------|
| 1 | Discovered active Medusa product | Medusa 側に公開中・在庫ありの商品が0件 — Drop #1 の在庫切れを疑う |
| 2 | /api/orders/create-cart returns order_id | 商品ID がMedusa facadeで解決できない、または zod バリデーション失敗 |
| 3 | sericia_orders row created with status=pending | DB 書き込み失敗 — service_role key か RLS 設定ミス |
| 4 | /api/pay/create registers order with Crossmint sandbox | `CROSSMINT_SERVER_API_KEY` 未設定、またはsandbox URL 到達不可 |
| 5 | Signed order.succeeded webhook accepted | 署名済みHMACと `CROSSMINT_WEBHOOK_SECRET` が不一致（storefront deployの再起動忘れ等） |
| 6 | sericia_orders.status = paid after webhook | webhook ハンドラ内のSupabase update 失敗、またはメタデータ読み取り不備 |
| 7 | sericia_events has order_paid row | Rule N 半分の DB ベルが機能していない |
| 8 | Tampered webhook body rejected with 401 | HMAC 検証が通り抜けている — セキュリティ回帰（要緊急対応） |

---

## <a id="pf-5"></a>5. テストが検証しないこと（重要）

このスクリプトは意図的に次を**検証しない**:
- Crossmint iframe UI の表示
- 実クレジットカード決済
- USDC のウォレット着金
- Crossmint 側からの webhook 自動送信（=タイミング/順序/リトライ）
- Slack / Resend / n8n escalation の**到達確認**（ログ上の呼び出しは見えるが、実際に届いたかまでは assert しない — fire-and-forget 設計）

これらは `docs/crossmint-integration.md §5.6` の **$1 live smoke test** でカバーする。UATは「Bridge以降のコード経路」に責任を持ち、$1テストは「Crossmint決済網＋Bridge全体」に責任を持つ、という役割分担。

---

## <a id="pf-6"></a>6. 失敗時の調査手順

### 5番（HMAC受理失敗）
最も頻出。以下を順に確認:
1. Coolify storefront の `CROSSMINT_WEBHOOK_SECRET` と、スクリプト実行時の `CROSSMINT_WEBHOOK_SECRET` が完全一致しているか（余計な改行・スペースがないか）
2. Coolify で env 変更後に **Restart** したか（Rebuild不要・Restartで反映される）
3. storefront logs で `[crossmint-webhook] signature mismatch` が出ているか確認

### 6-7番（status paid にならない・events入らない）
1. storefront logs で `[crossmint-webhook]` のエラーを検索
2. webhook ハンドラの `isSuccess` 正規表現に `order.succeeded` がマッチしているか確認
3. Supabase service_role key がローテートされていないか確認

### 8番（改竄ボディが通り抜ける）
**セキュリティ重大回帰**。即時対応:
1. `NODE_ENV=production` のまま deploy されているか確認（`!secret` ブランチが dev モードに落ちていないか）
2. `signatureHeader.includes(expected)` のロジック改変を疑う（`===` から `.includes()` への変更が取り除かれていないか）
3. 緊急で `CROSSMINT_WEBHOOK_SECRET` をローテート → Crossmint Dashboard 側にも反映 → storefront Restart

---

## 参考

- webhook ハンドラ本体: `storefront/app/api/crossmint-webhook/route.ts`
- Medusa側 primary webhook: `medusa-backend/src/api/webhooks/crossmint/route.ts`
- 本番切替時の §5.6 $1ライブスモークテスト: `docs/crossmint-integration.md`
