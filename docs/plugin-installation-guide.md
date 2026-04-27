# Plugin Installation Guide — Medusa Modules & Payload Plugins

Sericia は **2 つの拡張系統** を持っています。混同すると import path も config も別物なので、まず違いから整理します。

| システム | 用語 | config ファイル | 配列名 |
|---------|-----|---------------|------|
| Medusa v2 | **Modules** | `medusa-backend/medusa-config.ts` | `modules: [...]` |
| Payload v3 | **Plugins** | `storefront/payload.config.ts` | `plugins: [...]` |

⚠️ **Medusa v1 の "plugin" 概念は v2 で廃止**された。v2 は **Modules** が拡張点で、ローカルディレクトリ or npm パッケージのどちらでも `resolve` で参照できる構造。これを混同して "Medusa plugin" と検索すると古い v1 ドキュメントに迷い込むので注意。

---

#### 📋 目次

| # | セクション |
|---|-----------|
| 1 | [Payload Plugin の入れ方（4 step）](#pig-payload) |
| 2 | [Sericia 推奨 Payload Plugin 5 選](#pig-payload-recos) |
| 3 | [Medusa Module の入れ方（3 形態）](#pig-medusa) |
| 4 | [Sericia 推奨 Medusa Module 4 選](#pig-medusa-recos) |
| 5 | [入れた後の検証手順](#pig-verify) |
| 6 | [失敗ケースと復旧](#pig-troubleshoot) |

---

## <a id="pig-payload"></a>1. Payload Plugin の入れ方（4 step）

### Step 1: パッケージをインストール

```bash
cd storefront
npm install @payloadcms/plugin-seo
# OneDrive で EPERM が出るときは linux container 経由で
docker run --rm -v $(pwd):/app -w /app node:22-alpine npm install @payloadcms/plugin-seo
```

⚠️ **package.json を直接編集して deps を足してはいけない** — `package-lock.json` がズレて Coolify build が `EUSAGE: Missing: ... from lock file` で 100% 失敗する（CLAUDE.md SAFE-DEPLOY ルール 2）。必ず `npm install` 経由。

### Step 2: payload.config.ts に追加

```typescript
// storefront/payload.config.ts
import { seoPlugin } from "@payloadcms/plugin-seo";

export default buildConfig({
  // ...既存の設定...
  plugins: [
    s3Storage({ /* 既存 */ }),
    seoPlugin({
      collections: ["articles", "guides", "tools"],   // 適用するコレクション
      uploadsCollection: "media",                      // OG image を保存する collection
      generateTitle: ({ doc }) => `${doc.title} — Sericia`,
      generateDescription: ({ doc }) => doc.excerpt,
    }),
  ],
});
```

### Step 3: マイグレーション（フィールドが追加される場合）

SEO plugin は各コレクションに `meta` フィールドを足すので、Postgres スキーマに変化が出る:

```bash
cd storefront
npx payload migrate:create   # ローカルでマイグレーションファイルを生成
git add migrations/
git commit -m "chore(payload): add SEO plugin migration"
```

Coolify deploy 時に `docker-entrypoint.sh` の **migrate フェーズが fail-fast で実行**するので、マイグレーションを忘れると admin が 500 で起動しない。

### Step 4: importMap を再生成

Payload v3 は admin UI のクライアント component を `importMap.js` として静的に列挙する。新 plugin が独自 admin UI を出す場合は再生成が必要:

```bash
cd storefront
npx payload generate:importmap
git add app/\(payload\)/cms/admin/importMap.js
```

これを忘れると admin の該当パネルが「空白 + console error」で出る（hydration 系の症状とは別物）。

---

## <a id="pig-payload-recos"></a>2. Sericia 推奨 Payload Plugin 5 選

| Plugin | 用途 | Sericia での使い所 | 優先度 |
|-------|-----|------------------|------|
| `@payloadcms/plugin-seo` | OG / meta / Twitter card 生成 | Articles / Guides / Tools の SEO 自動化 | ⭐⭐⭐ 高 |
| `@payloadcms/plugin-redirects` | URL リダイレクト管理（301/302）| 旧記事 URL の付け替え / drop ローンチ後の URL 統合 | ⭐⭐ 中 |
| `@payloadcms/plugin-form-builder` | フォーム作成（contact / waitlist 拡張）| Drop 別 waitlist / プロデューサー応募フォーム | ⭐⭐ 中 |
| `@payloadcms/plugin-search` | 全文検索インデックス | Articles / Guides の検索（現在 Fuse.js だが将来 Meilisearch 連携時に活用）| ⭐ 中 |
| `@payloadcms/plugin-sentry` | エラーロギング | Payload admin のエラー追跡（Sentry プロジェクト立てた時）| ⭐ 低 |

**今すぐ入れて効果的**: `plugin-seo`。10 言語ローカライズと組み合わせて `meta.title` / `meta.description` / `meta.image` を locale 別に編集可能になる。

### 例: SEO Plugin を最低限の手で入れる

```typescript
import { seoPlugin } from "@payloadcms/plugin-seo";

plugins: [
  seoPlugin({
    collections: ["articles", "guides"],
    uploadsCollection: "media",
    tabbedUI: true,                    // SEO を別タブに分離（編集 UX 向上）
    generateTitle: ({ doc, locale }) =>
      doc.title ? `${doc.title} — Sericia` : "Sericia",
    generateDescription: ({ doc }) =>
      doc.excerpt || "Rescued Japanese craft food.",
    generateImage: ({ doc }) => doc.heroImage?.id,
  }),
],
```

→ admin UI で各記事に **SEO** タブが追加され、編集者が locale ごとにメタデータを書ける。

---

## <a id="pig-medusa"></a>3. Medusa Module の入れ方（3 形態）

Medusa v2 modules は以下 3 つの起源がある:

### 形態 A: ローカルカスタム Module（Sericia 専用ロジック）

```bash
# medusa-backend/src/modules/sericia-rewards/index.ts を新規作成
# その後 medusa-config.ts に追加:
```

```typescript
// medusa-backend/medusa-config.ts
modules: [
  // ...既存モジュール...
  {
    resolve: "./src/modules/sericia-rewards",   // ローカルパスで参照
    options: {
      rewardPercentage: 5,
    },
  },
],
```

### 形態 B: 公式 Medusa Module（@medusajs/* 配下）

```bash
cd medusa-backend
npm install @medusajs/inventory   # 例: 在庫モジュール（v2 では既定で同梱・参考まで）
```

```typescript
modules: [
  {
    resolve: "@medusajs/inventory",
    options: { /* ... */ },
  },
],
```

### 形態 C: サードパーティ Module（npm 公開済み）

```bash
cd medusa-backend
npm install medusa-plugin-algolia   # 例: 仮想 Algolia integration
```

```typescript
modules: [
  {
    resolve: "medusa-plugin-algolia",
    options: {
      appId: process.env.ALGOLIA_APP_ID!,
      apiKey: process.env.ALGOLIA_API_KEY!,
      productIndexName: process.env.ALGOLIA_PRODUCT_INDEX_NAME!,
    },
  },
],
```

⚠️ **Medusa v2 対応の third-party module はまだ少ない**。v1 用 `medusa-plugin-*` パッケージは v2 で動かないので必ず最新 README で v2 対応を確認する。

### Step: マイグレーション + 再起動

```bash
cd medusa-backend
npm run build
npx medusa db:migrate          # 新 module が DB スキーマを変える場合
docker restart medusa-backend  # Hetzner CPX22 上で再起動
```

---

## <a id="pig-medusa-recos"></a>4. Sericia 推奨 Medusa Module 4 選

| Module | 用途 | Sericia での使い所 | 優先度 |
|-------|-----|------------------|------|
| `@medusajs/cache-redis` | Redis キャッシュ層 | Store API のレスポンス高速化 | ⭐⭐⭐ 高（既に有効）|
| `@medusajs/event-bus-redis` | イベント配信を Redis キューで | order.placed → n8n / 在庫更新の信頼性向上 | ⭐⭐ 中 |
| `@medusajs/notification-resend` | Resend 経由の transactional email | 注文確認 / 発送通知 / 在庫補充通知（既存 webhook の置き換え）| ⭐⭐ 中 |
| `medusa-plugin-meilisearch`（v2 対応版） | Meilisearch インデックス | storefront の検索を Fuse.js → Meilisearch に格上げ（M5 pSEO 量産後）| ⭐ 低 |

**今すぐ入れて効果的**: `notification-resend` — 自前の `lib/medusa-admin.ts` + `crossmint-webhook` で配送通知を出している現状を、**Medusa native の subscriber + Resend module** に統一すると保守性が上がる。

### 例: Resend Notification Module の追加

```bash
cd medusa-backend
npm install @medusajs/notification-resend
```

```typescript
// medusa-backend/medusa-config.ts
modules: [
  // ...
  {
    resolve: "@medusajs/medusa/notification",
    options: {
      providers: [
        {
          resolve: "@medusajs/notification-resend",
          id: "resend",
          options: {
            apiKey: process.env.RESEND_API_KEY!,
            fromEmail: "hello@sericia.com",
          },
        },
      ],
    },
  },
],
```

その後、Medusa 側のテンプレートを書く（order.placed / order.shipped 等）。

---

## <a id="pig-verify"></a>5. 入れた後の検証手順

### Payload Plugin

```bash
# 1. ローカルで TS check（worktree 環境 or main repo）
cd storefront
node node_modules/typescript/lib/tsc.js --noEmit --project tsconfig.json
echo "EXIT=$?"   # → 0 が出れば OK

# 2. Payload admin に開く
open https://sericia.com/cms/admin
# 該当コレクションに新タブ・新フィールドが出ているか確認

# 3. デプロイ（Coolify webhook）
curl -X POST "http://46.62.217.172:8000/api/v1/deploy?uuid=em2luzsfjoxb77jo3rxl4c9c&force=false" \
  -H "Authorization: Bearer $COOLIFY_TOKEN"

# 4. デプロイ完了まで status を polling（自動 wakeup でも可）
curl "http://46.62.217.172:8000/api/v1/deployments/<deployment_uuid>" \
  -H "Authorization: Bearer $COOLIFY_TOKEN"
# status=finished を待ってから本番 URL で動作確認
```

### Medusa Module

```bash
cd medusa-backend
npm run build                       # 型エラーがないこと
npx medusa db:migrate               # マイグレーション適用
docker restart medusa-backend       # Hetzner CPX22 で再起動
curl https://api.sericia.com/health # 200 OK 確認

# Module の機能を直接 API で叩いて検証
curl https://api.sericia.com/admin/orders \
  -H "Authorization: Bearer $ADMIN_JWT" | jq '.orders | length'
```

---

## <a id="pig-troubleshoot"></a>6. 失敗ケースと復旧

### 6-1. Payload で plugin 入れたら admin が 500

| 症状 | 原因 | 復旧 |
|-----|-----|-----|
| `/cms/admin` で 500 + Coolify logs に `Missing migration` | マイグレーション未適用 | `docker exec storefront npx payload migrate` を実行 |
| `/cms/admin` で空白 + console error | importMap 未生成 | ローカルで `npx payload generate:importmap` → commit → redeploy |
| `EUSAGE: Missing: <pkg> from lock file` | npm install 経由していない | package-lock.json を npm install で再生成して push |
| Build 中 OOM kill | NODE_OPTIONS 不足 | Coolify env に `NODE_OPTIONS=--max-old-space-size=3072` 追加（既設定済み）|

### 6-2. Medusa で module 入れたら起動しない

| 症状 | 原因 | 復旧 |
|-----|-----|-----|
| `docker logs medusa` に `Module 'X' not found` | `resolve` パスが間違い / npm install が走っていない | `docker exec medusa npm install` → restart |
| `docker logs medusa` に `relation "X" does not exist` | マイグレーション未適用 | `docker exec medusa npx medusa db:migrate` |
| Admin が起動するが API 500 | options の env が空 | Coolify medusa env に必須 env を入れる |
| v2 で v1 plugin を入れた | パッケージが v2 非対応 | `npm uninstall` → v2 対応の代替を探す or 自前で書く |

### 6-3. 巨大 deps（Crawlee / Puppeteer / Playwright 等）を入れた直後の build 失敗

CLAUDE.md SAFE-DEPLOY ルール 7 通り、**stub 化で即ロールバックできる構造**にしておく。具体的には:

- import を 1 ファイルに集中させる
- そのファイルを削除 or stub に差し替えれば deploy が通る状態を維持
- 失敗時は `git revert <commit>` を躊躇わず即実行

---

## 関連ドキュメント

- [`docs/admin-tools-overview.md`](./admin-tools-overview.md) — 何をどっちで管理するかの判断ツリー
- [`docs/medusa-admin-guide.md`](./medusa-admin-guide.md) — Medusa Admin 操作リファレンス
- [`docs/cms-editing-guide.md`](./cms-editing-guide.md) — Payload CMS エディタガイド
- Medusa v2 公式 modules: https://docs.medusajs.com/resources/architectural-modules
- Payload v3 公式 plugins: https://payloadcms.com/docs/plugins/overview
