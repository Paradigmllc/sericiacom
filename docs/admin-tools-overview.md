# Sericia Admin Tools — Where do I manage what?

Sericia は2つの管理画面を併用します。**どっちで何を管理するかが明確でないと混乱する**ので、まずこの判断ツリーから始めてください。

---

#### 📋 目次

| # | セクション |
|---|-----------|
| 1 | [判断ツリー — どっちの admin？](#aoo-tree) |
| 2 | [Medusa Admin で管理するもの](#aoo-medusa) |
| 3 | [Payload CMS で管理するもの](#aoo-payload) |
| 4 | [両方触る作業](#aoo-both) |
| 5 | [URL / ログイン情報まとめ](#aoo-urls) |
| 6 | [ドキュメント早見表](#aoo-docs) |

---

## <a id="aoo-tree"></a>1. 判断ツリー — どっちの admin？

```
やりたいこと
   │
   ├── 「商品」「在庫」「価格」「カート」「注文」「送料」「クーポン」
   │     ├──→ 答え: Medusa Admin   (api.sericia.com/app)
   │     └──→ なぜ: ECとして商売する全機能はMedusa側に集約
   │
   ├── 「記事」「ブログ」「ジャーナル」「SEO文章」「FAQ」
   │     ├──→ 答え: Payload CMS    (sericia.com/cms/admin)
   │     └──→ なぜ: 文章の編集にはdeploy不要にしてある
   │
   ├── 「テスティモニアル（顧客の声）」「プレス掲載」「店主の写真」
   │     ├──→ 答え: Payload CMS
   │     └──→ なぜ: 編集者が deploy なしで差し替えできる構造
   │
   ├── 「ホームページのヒーロー画像差し替え」「のれん文言変更」
   │     ├──→ 答え: Payload CMS の Globals → Homepage
   │     └──→ なぜ: ハイブリッドCMS設計（コード固定の骨格 + 編集者制御の中段）
   │
   ├── 「特商法ページ更新」「会社情報」「メールアドレス変更」
   │     ├──→ 答え: コード変更（Payload には今載せていない）
   │     └──→ なぜ: 法定文言は監査ログ重視でgit管理。`storefront/app/(frontend)/tokushoho/page.tsx`
   │
   └── 「新しいツール（/tools/* 計算機）追加」
         ├──→ 答え: コード追加 + Payload で説明文ロード
         └──→ なぜ: 計算ロジックはコード、説明テキストはCMS
```

---

## <a id="aoo-medusa"></a>2. Medusa Admin で管理するもの

URL: **https://api.sericia.com/app**

| カテゴリ | 具体例 |
|---------|-------|
| **商品** | 名前 / handle / description / 画像 / variant（重さ・サイズ）/ 各 region の価格 |
| **在庫** | SKUごとの個数 / Stock Location（現在は Tokyo Fulfillment 1拠点）|
| **注文** | 受注一覧 / ステータス変更 / 発送追跡番号 / キャンセル / 返金 |
| **顧客** | 購入履歴 / 連絡先 / 住所 |
| **割引・クーポン** | パーセント / 固定額 / 期間限定 / 商品単位 / リージョン単位 |
| **販売チャネル** | Sericia 公式（デフォルト1個・将来 wholesale 追加予定）|
| **リージョン** | 9リージョン (JP/US/EU/GB/CA/AU/SG/HK/ME) ごとの通貨 / 税率 / 配送有効化 |
| **配送オプション** | EMS Worldwide / 価格 / 重量ブラケット |
| **税** | リージョンごとに自動計算（JPは内税8%、USはステート税0%等）|
| **API キー** | publishable key（pk_...）と admin token（JWT）|

📖 詳細手順: [`docs/medusa-admin-guide.md`](./medusa-admin-guide.md)

---

## <a id="aoo-payload"></a>3. Payload CMS で管理するもの

URL: **https://sericia.com/cms/admin**

| カテゴリ | 具体例 |
|---------|-------|
| **Articles**（ジャーナル）| `/journal/[slug]` の本文 / 著者 / カバー画像 / 10言語ローカライズ |
| **Guides**（国別ガイド）| `/guides/[country]/[product]` の記事 / 配送日数 / 関税情報 |
| **Tools**（ツール説明）| `/tools/*` の説明文・FAQ・関連リンク（計算ロジック自体はコード）|
| **Media**（画像 DB）| 商品以外の画像（ヒーロー / 産地写真 / プロデューサー）/ alt text / caption |
| **Testimonials**（顧客の声）| 引用文 / 出典 / 評価 / TestimonialsWall に表示 |
| **Press mentions**（メディア掲載）| ロゴ / 媒体名 / 掲載リンク / 日付 / "As seen in" ストリップに表示 |
| **Globals → Homepage** | ヒーロー / Story ブロック / Newsletter ブロックの **コピーライト**（差し替え可能）|
| **Globals → Site Settings** | フッター文言 / SNSリンク / メタディスクリプション / 連絡先メール |

📖 詳細手順: [`docs/cms-editing-guide.md`](./cms-editing-guide.md)（既存・9セクション）

---

## <a id="aoo-both"></a>4. 両方触る作業（連携が必要なケース）

### 4-1. 新しい商品をローンチする

| ステップ | どこで | やること |
|---------|-------|---------|
| 1 | Medusa Admin | Products → 新規追加（商品マスタ）|
| 2 | Medusa Admin | Variants → 価格 9リージョン分入力 |
| 3 | Medusa Admin | Inventory → 在庫数を Tokyo Fulfillment に登録 |
| 4 | Medusa Admin | Categories → tea/miso/mushroom/seasoning のいずれかに紐付け |
| 5 | Payload CMS | Media → 商品の高解像度写真を登録（必要なら）|
| 6 | Payload CMS | Articles → "新しいドロップ告知" 記事を書く（任意）|

### 4-2. 既存記事に商品リンクを貼る

- Payload Articles の rich text editor に handle (`product-sencha`) を含む URL を直書き → ストアフロントが Medusa から最新価格・在庫を取得して表示

### 4-3. ホームページの "Most loved" 3商品の選定

- Medusa Admin で各商品の `metadata.featured = true` をセット → ストアフロントが metadata fetch で並べる
- もしくは Payload Globals → Homepage に編集者が並べたい順に商品 handle を入力（コード設計次第）

---

## <a id="aoo-urls"></a>5. URL / ログイン情報まとめ

| 用途 | URL | ログイン |
|-----|-----|---------|
| Medusa Admin | https://api.sericia.com/app | `admin@sericia.com` / メモリ参照 |
| Payload CMS | https://sericia.com/cms/admin | `admin@sericia.com` / メモリ参照 |
| Coolify (インフラ) | http://46.62.217.172:8000 | メモリ参照 |
| 本番ストアフロント | https://sericia.com | — |
| Medusa Health | https://api.sericia.com/health | — |

🔐 パスワードは `~/.claude/projects/C--Users-apple-OneDrive-Desktop-sericiacom/memory/reference_api_keys.md` を参照（git管理外）。

---

## <a id="aoo-docs"></a>6. ドキュメント早見表

| 知りたいこと | 読むべきファイル |
|------------|----------------|
| 商品の追加・編集 | `docs/medusa-admin-guide.md` |
| 在庫・価格調整 | `docs/medusa-admin-guide.md#stock` |
| 送料・配送設定 | `docs/medusa-admin-guide.md#shipping` |
| クーポン作成 | `docs/medusa-admin-guide.md#promotions` |
| 記事を書く | `docs/cms-editing-guide.md` |
| ホームページのコピー差し替え | `docs/cms-editing-guide.md#cms-homepage-panel` |
| 10言語ローカライズ | `docs/cms-editing-guide.md#cms-i18n` |
| プラグインを追加する | `docs/plugin-installation-guide.md` |
| 決済（Crossmint）統合 | `docs/crossmint-integration.md` |
| マーケ自動化（n8n）| `docs/marketing-automation.md` |
| ブランドガイドライン | `docs/brand.md` |
