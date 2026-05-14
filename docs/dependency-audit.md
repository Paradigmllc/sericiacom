# Dependency Audit — Sericiacom

> 実行日: 2026-05-14
> ツール: `depcheck` (latest, via `npx --yes depcheck --json`)
> 監査対象: `medusa-backend/` + `storefront/`

---

## 1. medusa-backend

### depcheck 生出力サマリ

```
Unused dependencies:
  @medusajs/admin-sdk, @medusajs/cli, @mikro-orm/core, @mikro-orm/knex,
  @mikro-orm/migrations, @mikro-orm/postgresql, @swc/core, awilix, pg,
  prop-types, react-dom, ts-node, typescript, vite

Unused devDependencies:
  @types/react, @types/react-dom, yalc

Missing dependencies: (none)
```

### 分析

#### 削除候補 (実際に import なし・削除可能)

| Package | 種別 | 根拠 |
|---------|------|------|
| `prop-types` | dependencies | ソースコード内に import 文なし（React 18 + TypeScript では不要） |
| `react-dom` | dependencies | ソースコード内に import 文なし（Medusa admin SDK が内部的に依存する可能性あり・要確認） |
| `yalc` | devDependencies | `package.json` 以外に参照なし。ローカルパッケージリンクツールで CI 不要 |

#### depcheck 誤検知 (削除非推奨)

| Package | 理由 |
|---------|------|
| `@medusajs/admin-sdk` | Medusa Admin UI ビルド時に CLI 経由で使用 |
| `@medusajs/cli` | `medusa build/develop/start` コマンドで使用 |
| `@mikro-orm/*` | Medusa フレームワークが動的ロードする ORM |
| `@swc/core` | ts-node のトランスパイラ |
| `awilix` | Medusa プラグイン DI コンテナ |
| `pg` | PostgreSQL ドライバ（MikroORM が動的ロード） |
| `ts-node`, `typescript`, `vite` | ビルド/開発ツールチェイン |
| `@types/react`, `@types/react-dom` | 型定義（ビルド時のみ使用） |

### Missing dependencies

なし — すべてのランタイム依存は宣言済み。

---

## 2. storefront

### depcheck 生出力サマリ

```
Unused dependencies:
  @payloadcms/plugin-cloud-storage, @swc-node/register, @swc/core,
  @types/react-dom, autoprefixer, clsx, flag-icons, graphql, postcss,
  react-dom, tailwind-merge, tsx, typescript, typewriter-effect

Unused devDependencies:
  eslint, eslint-config-next

Missing dependencies: (none)
```

### 分析

#### 削除候補 (実際に import なし・削除可能)

| Package | 種別 | 根拠 |
|---------|------|------|
| `clsx` | dependencies | `lib/cn.ts` は自前実装で clsx 未使用（コメントにも明記） |
| `tailwind-merge` | dependencies | 同上。`lib/cn.ts` コメントに「必要になったら追加」と記載 |
| `graphql` | dependencies | 全ソースコードで import なし。GraphQL Playground は Payload CMS が内部バンドル |
| `@payloadcms/plugin-cloud-storage` | dependencies | 全ソースコードで import/設定なし（payload.config.ts にも未使用） |
| `react-dom` | dependencies | 全ソースコードで import なし。Next.js 15 のエントリポイントが内部処理（peer dep として要確認） |
| `@types/react-dom` | dependencies | 型定義が dependencies に入っているが devDependencies が適切（現状コード内で明示的 import なし） |

#### depcheck 誤検知 (削除非推奨)

| Package | 理由 |
|---------|------|
| `@swc-node/register`, `@swc/core` | tsx/Next.js ビルドのトランスパイラ |
| `autoprefixer`, `postcss` | Tailwind CSS / PostCSS ビルドパイプライン |
| `tsx`, `typescript` | `scripts/` の実行 (`tsx scripts/...`) と型チェック |
| `eslint`, `eslint-config-next` | `next lint` コマンドで使用 |
| `flag-icons` | `components/LocaleSwitcher.tsx` で import あり（depcheck が検出漏れ） |
| `typewriter-effect` | `components/CinematicHero.tsx` で import あり（depcheck が検出漏れ） |

### Missing dependencies

なし — すべてのランタイム依存は宣言済み。

---

## 3. 結論: 削除推奨パッケージ

### medusa-backend (3 パッケージ)

| Package | 推定サイズ削減 | リスク |
|---------|-------------|--------|
| `prop-types` | ~5KB | 低。React 18 + TS では PropTypes 不要 |
| `react-dom` | ~1MB | 中。Medusa admin SDK が peer dep として要求する可能性あり。削除後に `medusa build` が通るか要確認 |
| `yalc` | ~2MB | 低。開発者ローカルツール。CI では不使用 |

### storefront (6 パッケージ)

| Package | 推定サイズ削減 | リスク |
|---------|-------------|--------|
| `clsx` | ~5KB | 低。自前 cn() 実装で代替済み |
| `tailwind-merge` | ~15KB | 低。同上 |
| `graphql` | ~2MB | 低。Payload CMS が内部バンドルするため不要 |
| `@payloadcms/plugin-cloud-storage` | ~50KB | 低。未設定・未使用 |
| `react-dom` | ~1MB | 中。Next.js が peer dep として要求。削除後に `next build` が通るか要確認 |
| `@types/react-dom` | ~30KB | 低。dependencies→devDependencies 移動も選択肢（削除より安全） |

### 合計推定削減 (確実に削除可能なもののみ)

- **medusa-backend**: `prop-types` + `yalc` → ~2MB
- **storefront**: `clsx` + `tailwind-merge` + `graphql` + `@payloadcms/plugin-cloud-storage` + `@types/react-dom` → ~2.1MB

`react-dom` は両プロジェクトとも peer dependency の可能性があるため、削除前にビルド検証を推奨。

### Bundle size 削減見込みコメント

`node_modules` のディスク使用量削減は上記合計で ~4-6MB 程度（react-dom 含むと +2MB）。
実効的な bundle size への影響は限定的（未使用コードは tree-shaking で除外される可能性が高い）だが、
- `pnpm install` 時間の短縮
- 依存関係グラフの簡素化
- `npm audit` / Dependabot アラートの削減
- 新規開発者の認知負荷低減

に貢献する。

### 注意

- **本レポートでは `package.json` / `pnpm-lock.yaml` は変更していない。**
- depcheck は動的 import や CLI 経由の依存を検出できないため、多くの誤検知が含まれる。
- 削除を実行する場合は、各プロジェクトで `pnpm build` が成功することを確認すること。
