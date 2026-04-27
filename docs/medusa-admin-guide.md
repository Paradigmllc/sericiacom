# Medusa Admin Guide — Sericia 商品 / 在庫 / 注文 / 送料 運用

このガイドは「Medusa Admin で商品をどう追加・編集するか」「価格 / 在庫 / 送料はどこを触るか」を、Sericia の現在の構成（9 region / 4 product / Tokyo Fulfillment 1 拠点 / EMS Worldwide）に即して書いたものです。

---

#### 📋 目次

| # | セクション |
|---|-----------|
| 1 | [ログイン & ダッシュボード概要](#mag-login) |
| 2 | [商品の追加（フローと落とし穴）](#mag-add-product) |
| 3 | [価格の調整（リージョン別）](#mag-prices) |
| 4 | [<a id="stock"></a>在庫の調整](#mag-stock) |
| 5 | [注文（受注 / 発送 / キャンセル）](#mag-orders) |
| 6 | [<a id="promotions"></a>クーポン・割引（Promotions）](#mag-promotions) |
| 7 | [<a id="shipping"></a>送料・配送オプション（EMS Worldwide）](#mag-shipping) |
| 8 | [リージョン管理 — 9 リージョンの裏側](#mag-regions) |
| 9 | [Sales Channel と Publishable Key](#mag-channels) |
| 10 | [カテゴリ（tea / miso / mushroom / seasoning）](#mag-categories) |
| 11 | [トラブルシューティング](#mag-troubleshoot) |

---

## <a id="mag-login"></a>1. ログイン & ダッシュボード概要

| 項目 | 値 |
|-----|---|
| URL | https://api.sericia.com/app |
| 管理者 | `admin@sericia.com` |
| パスワード | `~/.claude/projects/.../memory/reference_api_keys.md` 参照 |

### サイドバー（左メニュー）

| メニュー | 用途 | Sericia での頻度 |
|---------|-----|----------------|
| **Orders** | 受注・発送・キャンセル | 毎日 |
| **Products** | 商品マスタ | ドロップごと |
| **Customers** | 顧客 / 連絡先 | サポート時 |
| **Categories** | tea / miso / mushroom / seasoning | 商品追加時 |
| **Promotions** | クーポン・割引 | キャンペーン時 |
| **Inventory** | SKU 単位の在庫 | ドロップ準備時 |
| **Settings → Regions** | 9 region の通貨・税率・配送 | 設定変更時のみ |
| **Settings → Sales channels** | Sericia 公式チャネル | 設定変更時のみ |
| **Settings → Stock locations** | Tokyo Fulfillment | 拠点追加時のみ |
| **Settings → Shipping profiles / options** | EMS Worldwide | 料金改定時 |
| **Settings → Tax** | リージョン別税率 | 設定変更時のみ |
| **Settings → Publishable API Keys** | storefront 用キー | キーローテーション時 |

---

## <a id="mag-add-product"></a>2. 商品の追加 — フローと落とし穴

⚠️ **Medusa v2 の商品追加には順番がある**。途中で止めると storefront に出ないので、最後まで通すこと。

### 2-1. 必要な情報を先に揃える

商品追加画面に飛ぶ前に、以下を手元に用意しておく：

| 項目 | 例（sencha 商品の場合） |
|-----|----------------------|
| Title（英語）| `Single-Origin Sencha (Rescued)` |
| Handle（URL パス）| `product-sencha` ← 後から変えると `/products/product-sencha` がリンク切れになる |
| Description | プロデューサーストーリー含む 200 字程度 |
| サムネイル URL | `https://sericia.com/placeholders/sencha.svg` または S3 URL |
| Variants（バリアント）| `100g standard`（1 variant でも可・サイズ違いは複数）|
| 価格 9 region 分 | JP ¥4,200 / US $35 / EU €33 / GB £29 / CA $48 / AU $54 / SG $46 / HK HK$280 / ME AED 130 |
| Weight | 170g（梱包込み）— EMS ブラケット計算で重要 |
| Stock | 100 個 |
| Category | `tea` |
| Sales channel | `Sericia` |
| Shipping profile | `EMS Worldwide` |

### 2-2. 追加手順（GUI）

1. **Products → Create product** をクリック
2. **General**: Title / Handle / Description / Thumbnail を入力
3. **Organize**: Categories → `tea` を選択 / Sales channels → `Sericia` をチェック
4. **Variants**:
   - 1 variant の場合は "Single variant" を選び SKU・重量・価格を入力
   - 複数 variants（例: 50g / 100g / 200g）の場合は "Multiple variants" を選び Options（例: `Weight`）を作ってから Variants を生成
5. **Pricing**: 各 region の通貨・価格を 9 行入力（JP / US / EU / GB / CA / AU / SG / HK / ME）
6. **Inventory**: Stock location `Tokyo Fulfillment` に在庫数を入力
7. **Attributes**:
   - `weight` — グラム単位で入力（EMS 計算で必須）
   - `metadata` — JSON で `{ "drop": "001", "featured": true }` 等を入力（任意）
8. **Save** → status を **Published** にする（Draft のままだと storefront に出ない）

### 2-3. ⚠️ よくある落とし穴

| 症状 | 原因 | 直し方 |
|-----|-----|------|
| 商品が storefront に出ない | status が Draft | **Published** に変更 |
| 商品が storefront に出ない | Sales channel が紐付いていない | Organize → Sales channels で `Sericia` をチェック |
| 商品が一覧に出るが詳細ページが 404 | Handle に空白や日本語が入っている | 半角小文字 + ハイフンのみ（例: `product-sencha`）に直す |
| 価格が "Contact us" と表示される | 該当 region に価格が未設定 | Pricing タブで全 9 region を埋める |
| カート追加時に「在庫切れ」になる | Inventory が 0 のまま | Inventory → Stock locations で数量を入力 |
| 配送オプションが選べない | Shipping profile が未紐付け | Settings → Shipping profiles → `EMS Worldwide` に商品を追加 |

---

## <a id="mag-prices"></a>3. 価格の調整（リージョン別）

### 3-1. 単発で価格を変える

1. Products → 該当商品 → **Pricing** タブ
2. 該当 region の行をクリック → 新価格を入力 → Save
3. 即座に storefront 反映（Next.js ISR で最大 60 秒キャッシュ・通常はもっと早い）

### 3-2. 一括で値上げ・値下げ（PriceList）

期間限定セールや一斉値上げは Pricing 画面から個別に変えると 9 region × 商品数で大変。代わりに **Price Lists** を使う：

1. Products → **Price Lists** → Create
2. Type: `Sale`（期間限定セール）or `Override`（恒久変更）
3. 適用対象（特定の variant / category / customer group）を選択
4. 各 region で新価格を入力
5. Schedule: 開始日時 / 終了日時（任意）
6. Save & Activate

例: 「JP region のみ全商品 10% off キャンペーン」「ME region 値上げ」など。

### 3-3. ⚠️ Sericia での価格設計ルール

| ルール | 理由 |
|-------|-----|
| 利益率 80%+ を維持 | s11 経費・収益シミュ参照 |
| JP region は `物販ECとして特商法/消費税対応` で内税表示 | 日本の特商法準拠 |
| US/EU/GB/CA/AU/SG/HK/ME は外税 | 海外慣習 + 関税は顧客負担 |
| 送料無料閾値 $200 を切らない | 4 個まとめ買い導線（s14-4 EMS ブラケット最適化）|

---

## <a id="mag-stock"></a>4. 在庫の調整

### 4-1. 単一 SKU の在庫を増減する

1. Inventory → 該当 SKU をクリック
2. Stock location `Tokyo Fulfillment` の行で `+` `-` を押すか、直接数値を編集
3. Save

### 4-2. ドロップ前の一括登録

新ドロップで複数 SKU を一気に登録する場合：

```bash
# medusa-backend/src/scripts/seed-inventory.ts として書き、
cd medusa-backend
npx medusa exec ./src/scripts/seed-inventory.ts
```

スクリプトのパターンは既存 `medusa-backend/src/scripts/seed.ts` を参考にする（idempotent に書く）。

### 4-3. 売り切れ時の挙動

- 在庫 0 になると Storefront 商品ページの CTA が自動的に **Notify Me** モーダルに切り替わる（`storefront/components/PDP/NotifyMeModal.tsx`）
- ユーザーがメール登録すると Supabase `sericia_waitlist` に `metadata.productId` 付きで保存
- 在庫補充時に n8n でメール一斉送信（`n8n-workflows/restock-notify.json` 想定）

---

## <a id="mag-orders"></a>5. 注文（受注 / 発送 / キャンセル）

### 5-1. 注文一覧の見方

Orders 画面で受注を確認できる。Sericia は **Crossmint webhook 経由で注文が自動作成**されるため、PoS 入力は通常不要。

| カラム | 意味 |
|-------|-----|
| Display ID | 表示用注文番号（例: `#1023`）|
| Customer | 購入者 email |
| Date | 受注日時 |
| Total | 合計金額（送料・税込み） |
| Payment status | `captured`（Crossmint 完了）/ `awaiting`（決済待ち）|
| Fulfillment status | `not_fulfilled` / `fulfilled` / `shipped` / `returned` |

### 5-2. 発送処理（毎営業日のルーチン）

1. Orders → status `not_fulfilled` でフィルタ
2. 該当注文を開く
3. **Create Fulfillment** → SKU と数量を確認 → **Mark as Fulfilled**
4. EMS で発送 → 追跡番号を取得（日本郵便のサイト or Click Post 等）
5. **Add Tracking Number** → tracking number を入力 → Save
6. **Mark as Shipped** をクリック
7. Sericia 自動で発送通知メール（Resend）+ Slack #all-paradigm に通知 + referral reward の `pending → issued` flip（state machine）が走る

### 5-3. キャンセル / 返金

1. 注文を開く → **More actions** → **Cancel order**
2. 理由を入力（在庫切れ / 顧客都合 / 不良品 等）
3. Crossmint 側で USDC 返金処理（手動 or n8n 自動）
4. referral reward が issued 済みの場合は `revoked` に flip（state machine）

---

## <a id="mag-promotions"></a>6. クーポン・割引（Promotions）

### 6-1. クーポンコードを発行する

1. Promotions → Create promotion
2. Type を選ぶ:
   - **Standard**: コード入力で適用（例: `WELCOME10`）
   - **Buy X Get Y**: 2点購入で1点無料 等
3. Discount 設定:
   - `percentage` — 全体 ◯% off
   - `fixed_amount` — 固定額 off（region ごとに通貨指定）
4. Conditions（任意）:
   - 対象 region（JP のみ等）
   - 対象 customer group（returning customer のみ等）
   - 対象 category（tea のみ等）
   - 最低購入額
5. Code: `WELCOME10`（半角英数）/ または `Auto-apply` をチェックすると全カートに自動付与
6. Schedule: 開始 / 終了日時
7. Usage limit: 全体上限 / 1 顧客あたり上限
8. Save & Activate

### 6-2. Sericia の標準クーポン例

| Code | 内容 | 期間 |
|-----|-----|-----|
| `FIRST10` | 初回購入 -10% | 永続（newcomer 限定）|
| `DROP001` | Drop #1 ローンチ -15% | ドロップ期間中 |
| Referral codes | $5 off friend / $5 reward on ship | 紹介プログラム経由（自動発行）|

### 6-3. ⚠️ Storefront 側との連携

Storefront のカートで `?coupon=FIRST10` URL パラメータがあれば自動適用される（既に実装済み・`storefront/components/cart/CouponField.tsx` 参照）。

---

## <a id="mag-shipping"></a>7. 送料・配送オプション（EMS Worldwide）

### 7-1. 現在の設定

| Profile | Option | Provider | 価格 |
|---------|--------|---------|-----|
| EMS Worldwide | Standard | manual | 重量ブラケット別（s14-4 参照）|

重量ブラケット:
- ≤250g → ¥1,750
- ≤500g → ¥2,150
- ≤1kg → ¥3,100

商品単価が高い region は USD 換算で `$18` を表示している（為替変動は手動で見直す）。

### 7-2. 送料を改定する

1. Settings → **Shipping profiles** → `EMS Worldwide` を開く
2. **Shipping options** タブ → 該当 option を編集
3. Pricing → 各 region の価格を更新
4. Conditions → 重量ブラケットの境界値（`requirements.weight` 等）が現実とずれていないか確認
5. Save

### 7-3. 送料無料閾値（$200）の管理

これは Storefront 側のロジックで管理（`storefront/lib/cart-utils.ts` 想定）。Medusa Admin の Promotions 機能で「$200 以上 → 送料無料」の自動 promotion として実装することも可能。

---

## <a id="mag-regions"></a>8. リージョン管理 — 9 リージョンの裏側

⚠️ Sericia では **storefront 側の `lib/medusa.ts` で metadata.slug / name / countries.iso_2 の3キーを lowercase index** して region を解決している（M4c launch-ready で確立）。Medusa Admin で region 名や country list を変更する場合、必ず以下を確認:

| 確認項目 | 意味 |
|---------|-----|
| Region **Name** | `Japan` / `United States` / `Europe` / 等 |
| Region **Currency** | JP=`jpy` / US=`usd` / EU=`eur` / GB=`gbp` / CA=`cad` / AU=`aud` / SG=`sgd` / HK=`hkd` / ME=`aed` |
| Region **Countries** | EU は 11 ヶ国 / ME は 6 ヶ国 / 他は 1〜2 |
| Region **Tax rate** | JP=8%（内税）/ 他=0%（外税扱い・関税は顧客負担）|
| Region **Metadata.slug** | `jp` / `us` / `eu` / `gb` / `ca` / `au` / `sg` / `hk` / `me` ← **storefront 解決の主キー** |

`metadata.slug` を変更すると `/products` の region 推定が壊れるので、変更時は必ず storefront 側の `NEXT_PUBLIC_DEFAULT_REGION` env と整合させる。

---

## <a id="mag-channels"></a>9. Sales Channel と Publishable Key

### 9-1. なぜ重要か

Storefront は **Publishable API Key** で Medusa Store API を呼ぶ。このキーは1つの Sales Channel に紐づく。Sericia 公式チャネルから外れると商品が storefront に出ない。

### 9-2. 現在のキー

```
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_3cbe523eed266eb8eead0a6d75841c341ddc63faa31275c37b7e025b1c64798e
```

このキーは `Sericia` チャネルに紐付き済み。Coolify storefront env vars に登録済み。

### 9-3. 新しいチャネルを作るとき（B2B / Wholesale など）

1. Settings → Sales Channels → **Create**
2. 名前: `Sericia Wholesale`（例）
3. Settings → Publishable API Keys → Create で新キーを発行 → 該当チャネルに紐付け
4. B2B 専用 storefront を立てるか、既存 storefront に B2B モードを実装する

---

## <a id="mag-categories"></a>10. カテゴリ（tea / miso / mushroom / seasoning）

### 10-1. 現在の階層

```
Root
├── tea         (pcat_01KPQRFNWAVKCYN8YBPH0RXGBK)
├── miso        (pcat_01KPQRFQ53QN8TBER8Z9J3343A)
├── mushroom    (pcat_01KPQRFRD5C0JXVJ5VQ7430QH3)
└── seasoning   (pcat_01KPQRFSN1Q6GPWDEV7A4JDKMF)
```

商品は1つ以上のカテゴリに属する（例: drop-001 は seasoning に紐付き済みだが将来 `drops` 専用カテゴリ追加余地あり）。

### 10-2. カテゴリを追加する

1. Categories → Create
2. Name / Handle（半角小文字）/ 親カテゴリ（root or 既存カテゴリ）
3. Save
4. Storefront 側 `storefront/lib/products-medusa.ts` の `inferCategory()` switch に新カテゴリを追加（または `categories[0].handle` 自動マッピングで対応）

---

## <a id="mag-troubleshoot"></a>11. トラブルシューティング

| 症状 | 確認手順 |
|-----|---------|
| Admin にログインできない | (1) パスワード確認 (2) `https://api.sericia.com/health` 200 か (3) Hetzner サーバ生存確認 |
| 商品保存できない | バリデーションエラーをポップアップで確認・特に Variant の SKU 重複 / 価格未入力 |
| 注文一覧が空 | Crossmint webhook が届いていない可能性 → Coolify logs → `storefront` コンテナで `crossmint-webhook` の 401/503/200 を確認 |
| ドロップ追加後 storefront に出ない | (1) Status `Published` (2) Sales channel `Sericia` 紐付け (3) Region 全部に価格 (4) Inventory > 0 (5) 60 秒待つ（ISR）|
| 在庫が反映されない | Inventory → Stock locations で `Tokyo Fulfillment` に値が入っているか・`reservation` で予約されている数を引いて表示しているので新規分は注文後に反映 |
| 価格が変だ | (1) Pricing タブで該当 region の通貨と数値 (2) 有効な Price List が上書きしていないか (3) Promotion が adapply 中ではないか |
| Admin が遅い | Hetzner CPX22 はリソース限界。`htop` で memory pressure 確認・必要なら一時的に `docker restart medusa` |

### 11-1. ログの場所

```bash
# Hetzner SSH 経由（Coolify 上）
ssh root@46.62.217.172 "docker logs --tail 200 medusa"
ssh root@46.62.217.172 "docker logs --tail 200 storefront"
```

### 11-2. データベース直接アクセス（最終手段）

```bash
# 注文を SQL で直接見る
ssh root@46.62.217.172 "docker exec medusa-postgres psql -U medusa -d medusa -c 'SELECT id, display_id, total, payment_status FROM \"order\" ORDER BY created_at DESC LIMIT 10;'"
```

---

## 関連ドキュメント

- [`docs/admin-tools-overview.md`](./admin-tools-overview.md) — Medusa vs Payload の使い分け
- [`docs/cms-editing-guide.md`](./cms-editing-guide.md) — Payload CMS のエディタガイド
- [`docs/plugin-installation-guide.md`](./plugin-installation-guide.md) — Medusa modules / Payload plugins の追加方法
- [`docs/crossmint-integration.md`](./crossmint-integration.md) — Crossmint 決済 + 本番 playbook
- [`docs/marketing-automation.md`](./marketing-automation.md) — n8n 自動化
