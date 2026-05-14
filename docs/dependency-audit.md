# Dependency Audit — Sericiacom

> 監査日: 2026-05-14
> ツール: depcheck
> **注意**: depcheck は静的解析のため、CLI ツール・ビルドツール・設定ファイル経由のパッケージは「未使用」と誤検出されることがあります。

---

## medusa-backend

### Unused dependencies (削除候補)

| Package | 確度 | 備考 |
|---------|------|------|
| `@medusajs/admin-sdk` | ⚠️ 中 | 要確認 |
| `@medusajs/cli` | ⚠️ 低 | CLI/ビルドツール — 誤検出の可能性大 |
| `@mikro-orm/core` | ⚠️ 中 | ORM/DB — medusa-config.ts 経由で利用の可能性 |
| `@mikro-orm/knex` | ⚠️ 中 | ORM/DB — medusa-config.ts 経由で利用の可能性 |
| `@mikro-orm/migrations` | ⚠️ 中 | ORM/DB — medusa-config.ts 経由で利用の可能性 |
| `@mikro-orm/postgresql` | ⚠️ 中 | ORM/DB — medusa-config.ts 経由で利用の可能性 |
| `@swc/core` | ⚠️ 低 | CLI/ビルドツール — 誤検出の可能性大 |
| `awilix` | ⚠️ 中 | DI コンテナ — フレームワーク内部で利用 |
| `pg` | ⚠️ 中 | ORM/DB — medusa-config.ts 経由で利用の可能性 |
| `prop-types` | 🟢 高 | バックエンドに React 系は不要の可能性 |
| `react-dom` | 🟢 高 | バックエンドに React 系は不要の可能性 |
| `ts-node` | ⚠️ 低 | CLI/ビルドツール — 誤検出の可能性大 |
| `typescript` | ⚠️ 低 | CLI/ビルドツール — 誤検出の可能性大 |
| `vite` | ⚠️ 低 | CLI/ビルドツール — 誤検出の可能性大 |

### Unused devDependencies

- `@types/react` — ⚠️ 低: 型定義、TypeScript コンパイルに必要
- `@types/react-dom` — ⚠️ 低: 型定義、TypeScript コンパイルに必要
- `yalc` — 🟢 高: ローカル開発用リンクツール、CI 不要の可能性

### Missing dependencies (使われているが宣言なし)

- なし (ただし以下のパッケージが使用されているが `package.json` に宣言なし)
  - `@medusajs/framework` — 依存パッケージの peer dependency として解決されている可能性あり
  - `@medusajs/medusa` — 依存パッケージの peer dependency として解決されている可能性あり
  - `@types/node` — 依存パッケージの peer dependency として解決されている可能性あり
  - `react` — 依存パッケージの peer dependency として解決されている可能性あり
  - `resend` — 依存パッケージの peer dependency として解決されている可能性あり

---

## storefront

### Unused dependencies (削除候補)

| Package | 確度 | 備考 |
|---------|------|------|
| `@payloadcms/plugin-cloud-storage` | ⚠️ 中 | Payload CMS プラグイン — 設定ファイル経由 |
| `@swc-node/register` | ⚠️ 低 | CLI/ビルドツール/CSS — 誤検出の可能性大 |
| `@swc/core` | ⚠️ 低 | CLI/ビルドツール/CSS — 誤検出の可能性大 |
| `@types/react-dom` | ⚠️ 中 | 要確認 |
| `autoprefixer` | ⚠️ 低 | CLI/ビルドツール/CSS — 誤検出の可能性大 |
| `clsx` | 🟢 高 | インポート未検出 — 未使用の可能性 |
| `flag-icons` | 🟢 高 | インポート未検出 — 未使用の可能性 |
| `graphql` | ⚠️ 中 | Payload CMS 内部依存の可能性 |
| `postcss` | ⚠️ 低 | CLI/ビルドツール/CSS — 誤検出の可能性大 |
| `react-dom` | 🟢 高 | インポート未検出 — 未使用の可能性 |
| `tailwind-merge` | ⚠️ 低 | CLI/ビルドツール/CSS — 誤検出の可能性大 |
| `tsx` | ⚠️ 低 | CLI/ビルドツール/CSS — 誤検出の可能性大 |
| `typescript` | ⚠️ 低 | CLI/ビルドツール/CSS — 誤検出の可能性大 |
| `typewriter-effect` | 🟢 高 | インポート未検出 — 未使用の可能性 |

### Unused devDependencies

- `eslint` — ⚠️ 低: リンター、CLI 経由のため未検出
- `eslint-config-next` — ⚠️ 低: リンター、CLI 経由のため未検出

### Missing dependencies

- なし

---

## 削除推奨サマリー

### 高確度で削除可能 (合計 5 件)

| Package | プロジェクト | 理由 |
|---------|------------|------|
| `prop-types` | medusa-backend | バックエンドに React PropTypes 不要 |
| `react-dom` | medusa-backend | バックエンドに ReactDOM 不要 |
| `clsx` | storefront | インポート未検出 |
| `flag-icons` | storefront | インポート未検出 |
| `typewriter-effect` | storefront | インポート未検出 |

### 要確認 (中確度)

- `@medusajs/admin-sdk` — medusa-backend (Admin UI SDK、未使用なら削除可)
- `@mikro-orm/*` 系 4 パッケージ — medusa-backend (medusa-config 経由で利用の可能性)
- `pg` — medusa-backend (DB ドライバ、内部利用の可能性)
- `awilix` — medusa-backend (DI コンテナ)
- `@payloadcms/plugin-cloud-storage` — storefront (payload.config 経由)
- `graphql` — storefront (Payload CMS GraphQL 利用時のみ必要)

### 誤検出の可能性が高い (削除非推奨)

- ビルドツール系: `typescript`, `ts-node`, `tsx`, `vite`, `@swc/core`, `@swc-node/register`
- CSS 系: `tailwind-merge`, `autoprefixer`, `postcss`
- CLI 系: `@medusajs/cli`, `eslint`, `eslint-config-next`
- 型定義: `@types/react`, `@types/react-dom`

## バンドルサイズ削減見込み

高確度 5 件を削除した場合、`pnpm-lock.yaml` の依存ツリーから除去される見込み。
削除前に `pnpm install` でビルドが通ることを確認すること。

> **制約遵守**: 本監査では `package.json` / `pnpm-lock.yaml` は一切変更していません。