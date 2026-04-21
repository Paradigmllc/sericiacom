#### 📋 目次

| # | セクション |
|---|-----------|
| 1 | [<a id="cm-1"></a>事前準備](#cm-1) |
| 2 | [<a id="cm-2"></a>APIキー取得手順](#cm-2) |
| 3 | [<a id="cm-3"></a>環境変数の設定](#cm-3) |
| 4 | [<a id="cm-4"></a>Webhook設定（Option B Bridge）](#cm-4) |
| 5 | [<a id="cm-5"></a>Sandbox → Production移行](#cm-5) |
| 6 | [<a id="cm-6"></a>トラブルシューティング](#cm-6) |

---

## <a id="cm-1"></a>1. 事前準備

Sericia は **Crossmint Headless Checkout（Fiat-only モード）** を採用。買い手は普通のクレカ決済 UI で購入し、Sericia の財布には USDC で入金される。サプライヤー支払い時のみ Tria / RedotPay で日本円に変換する。

**必要なもの**:
- Crossmint アカウント（https://www.crossmint.com/signup）
- 収益先の USDC ウォレット（Polygon もしくは Solana チェーン推奨。Phantom / MetaMask いずれも可）
- Medusa 管理画面の Admin API Token（`https://api.sericia.com/app` から発行）

---

## <a id="cm-2"></a>2. APIキー取得手順

1. https://staging.crossmint.com/console にログイン
2. **Projects → New Project**「Sericia」作成（Environment: `staging`）
3. **Integrate → API Keys** でクライアントサイド用のキーを発行:
   - `NEXT_PUBLIC_CROSSMINT_CLIENT_ID` → `CrossmintPayButton` 用
   - Scope: `payments:fiat.checkout`
4. **Webhooks → Create Signing Secret** を発行:
   - `CROSSMINT_WEBHOOK_SECRET` → サーバー側 HMAC 検証に使用
   - Events: `order.succeeded`, `order.failed`

---

## <a id="cm-3"></a>3. 環境変数の設定

Coolify 管理画面でそれぞれのアプリに設定する:

**storefront (em2luzsfjoxb77jo3rxl4c9c)**:
```
NEXT_PUBLIC_CROSSMINT_CLIENT_ID=ck_staging_xxx
CROSSMINT_WEBHOOK_SECRET=whsec_xxx
```

**medusa-backend (wl8ke5lf6rxjoepi058qv89u)**:
```
CROSSMINT_API_KEY=sk_staging_xxx
CROSSMINT_WEBHOOK_SECRET=whsec_xxx
RESEND_API_KEY=re_xxx
```

---

## <a id="cm-4"></a>4. Webhook設定（Option B Bridge）

**URL**: `https://api.sericia.com/webhooks/crossmint`（Medusa側のハンドラ）

**バックアップパス**: `https://sericia.com/api/crossmint-webhook`（storefrontがMedusaへ転送）

Crossmint コンソールで両方を登録しておくと、片方が落ちても他方が受ける。

**署名検証**:
```
signature = HMAC-SHA256(CROSSMINT_WEBHOOK_SECRET, raw_body)
```
`x-crossmint-signature` ヘッダと突合し、一致しないリクエストは401で拒否する（実装済み: `medusa-backend/src/api/webhooks/crossmint/route.ts`）。

**フロー**:
1. 顧客が `CrossmintPayButton` でクレカ入力 → Crossmint がカード処理
2. Crossmint が USDC を Sericia ウォレットに送金
3. Crossmint が `order.succeeded` webhook を発火
4. Medusa が受信 → HMAC検証 → `orderModule.createOrders()` でオーダー作成
5. `inventoryModule.adjustInventory(variantId, -qty)` で在庫減算
6. Resend で注文確認メール送信

---

## <a id="cm-5"></a>5. Sandbox → Production移行

Sandbox で 5 件以上のテスト注文が成功したら本番へ:

1. Crossmint コンソールで **Switch to Production** を有効化（KYC・住所確認が必要）
2. `CrossmintPayButton` の `environment` を `"production"` に変更
3. API キーを `ck_production_xxx` / `sk_production_xxx` に差し替え
4. Webhook URL を本番ドメインで再登録
5. 受け取りウォレットを本番用 USDC アドレスに変更

---

## <a id="cm-6"></a>6. トラブルシューティング

| 症状 | 原因 | 対処 |
|------|------|------|
| Webhook 401 | HMAC 不一致 | `CROSSMINT_WEBHOOK_SECRET` が storefront/medusa 両方で同じか確認 |
| `CrossmintPayButton` 表示されない | `NEXT_PUBLIC_CROSSMINT_CLIENT_ID` 未設定 | Coolify 環境変数を再確認し再デプロイ |
| オーダーが Medusa に入らない | Webhook URL 間違い | Crossmint ログで delivery status 確認 → リトライ送信 |
| USDC が届かない | ウォレットチェーン不一致 | Polygon/Solana/Base いずれか選択時の受取アドレス確認 |
