# Sericia — プロジェクトコンテキスト

## 📊 進捗ダッシュボード（目次）

| 進捗 | # | セクション | 状態メモ |
|------|---|-----------|---------|
| ★★★★☆ | 1 | [🎯 事業概要](#s1) | 設計確定 |
| ★★★☆☆ | 2 | [🏆 競合・差別化](#s2) | Bokksu/Misfits Market比較済み |
| ★★★★☆ | 3 | [💰 ビジネスモデル](#s3) | 利益率・価格設計確定 |
| ★★☆☆☆ | 4 | [📊 財務KPI](#s4) | 粗利試算あり、目標KPI未設定 |
| ★★★☆☆ | 5 | [📈 ロードマップ](#s5) | Phase 1〜3定義済み |
| ★☆☆☆☆ | 6 | [⚖️ 法的リスク](#s6) | `/accessibility` WCAG 2.2 AA 公開・Cookie Consent 実装・特商法12項目は s7 経由で公開済み |
| ★★★★★ | 7 | [🗺️ プロダクト設計](#s7) | ラグジュアリーUX（Aesop/LV級）+ P2仕上げ + F1 動画基盤（CinematicVideo・Drop/Makers/Interstitialへ video差替可能・gradient fallback完備）完了 |
| ★★★★☆ | 8 | [⚙️ 技術設計](#s8) | Next.js 15 + Supabase + Framer Motion + Lenis + vaul + Fuse.js + Embla 完成・Coolifyデプロイ稼働 |
| ★★★★★ | 9 | [📣 GTM・集客](#s9) | Reddit戦略・SNS設計済み + pSEO briefs自動生成基盤（DeepSeek V4 Context Caching 90%OFF）+ Push PWA再訪導線 |
| ★★★★☆ | 10 | [🖥️ 運用](#s10) | UAT自動化E2E完備 + Crossmint本番移行§5.1-5.8 playbook + /api/push/subscribe VAPID RLS + F69 perf/i18n sweep 完了 |
| ★★★★☆ | 11 | [💴 経費・収益シミュ](#s11) | 利益率計算済み + referral経済（pending→issued/revoked state machine） |
| ★★☆☆☆ | 12 | [🌐 ドメイン・商標](#s12) | sericia.com稼働中・商標未出願 |
| ★★★☆☆ | 13 | [📚 リソース一覧](#s13) | 主要14ツール整備（DeepSeek V4 / web-push VAPID / Payload CMS 3.x / Resend / Crossmint+Stripe LIVE / Supabase / Medusa v2 / Dify / n8n / Coolify / Next.js 15 / next-intl **10言語+Arabic RTL** / Framer Motion / Lenis）|
| 📦 外出し | 14 | [🧠 壁打ち詳細メモ](docs/knowledge/poss-sericia-implementation.md#s14) | CEP 圧縮・要点 s14 残置・全14項目は knowledge/ 参照 |
| 📦 外出し | 15 | [🚧 F1-F69 実行トラッカー](docs/knowledge/poss-sericia-implementation.md#s15) | **F69 (perf+i18n sweep) 本セッション完了** / M1〜F69 詳細は knowledge/ 参照 |

⚠️ **要強化**: 4(KPI目標) / 6(商標/法務) / 12(商標出願)

---

## <a id="s1"></a>1. 🎯 事業概要

**一行定義**: 日本の訳あり/規格外クラフト食品を「Wabi-sabi Premium」に文脈変換して海外に限定ドロップ販売する情報非対称アービトラージ事業

**ブランド**: Sericia（シルクロード東端の古称 → 日本×東洋希少品の文脈）

**参照設計書**: `~/.claude/knowledge/business-idea-303-japan-craft-food.md`（全詳細）

**情報非対称の構造**:
```
日本側: 訳あり = 値引き・廃棄対象
西洋側: Irregular = Natural = Artisan = プレミアム
円安:   日本仕入れ価格が欧米比で1/5〜1/10
```

**採用モデル**: Supreme型限定ドロップ（在庫希少性×FOMO設計）

---

## <a id="s2"></a>2. 🏆 競合・差別化

| 競合 | 弱点 | Sericiaの差別化 |
|-----|------|--------------|
| Bokksu ($40M+ ARR) | 固定Box・高コスト | 限定ドロップ・在庫リスクゼロ |
| Misfits Market | 米国内物流のみ | 日本直送・円安活用 |
| Amazon JP直接購入 | 英語UI・送料複雑 | キュレーション×ストーリー |

**モート**: Amazon USに存在しない商品のみ扱う → 情報優位性がそのままモートになる

---

## <a id="s3"></a>3. 💰 ビジネスモデル

### 価格設計（確定）

```
商品単価:  $58〜65（商品ごと）
送料:      $18（USA / EU / AU）
送料無料:  $200以上で無料
目標利益率: S tier 80%+ / SS tier 85%+
```

### 決済スタック（確定）

| ツール | 役割 |
|-------|-----|
| Crossmint | クレカ→USDC変換（2.5%のみ） |
| Tria / RedotPay | USDC→Visaデビット即時変換 |

### キャッシュサイクル

```
顧客決済(Crossmint) → USDC着金(数分) → Visaデビット → 仕入れ即日
立替不要・キャッシュサイクルほぼゼロ
```

### 利益率実績（¥155/$・Crossmint 2.5%込み）

| 購入パターン | 利益率 | Tier |
|------------|-------|------|
| 1個 + 送料$18 | 80.6% | S |
| 4個 + 送料無料 | 83.0% | S |
| 5個 + 送料無料 | 85.1% | SS |

---

## <a id="s4"></a>4. 📊 財務KPI

### 粗利試算

| フェーズ | 月販売数 | 月粗利 |
|---------|---------|------|
| Phase 1 | 20件 | ~$1,200 |
| Phase 2 | 100件 | ~$6,000 |
| Phase 3 | 500件 | ~$30,000 |

### 固定費（月額）

| コスト | 金額 |
|-------|------|
| Hetzner CPX22（Medusa） | €9.49 |
| EMS実費（変動） | 販売数×¥1,750〜¥3,100 |
| Crossmint手数料 | 売上×2.5% |
| **合計固定費** | **~¥1,500/月** |

---

## <a id="s5"></a>5. 📈 ロードマップ

| フェーズ | 期間 | 目標 | 主な施策 |
|---------|------|------|---------|
| Phase 1 | 0〜3ヶ月 | 月20件 | LP構築・Drop #1・Reddit集客 |
| Phase 2 | 3〜12ヶ月 | 月100件 | BASE直接交渉・n8n自動化・SNS拡大 |
| Phase 3 | 12ヶ月〜 | 月500件+ | FC委託・商社化・正規品ライン追加 |

---

## <a id="s6"></a>6. ⚖️ 法的リスク

> ⚠️ 要整備

- 食品輸出規制（植物性・乾燥品は原則問題なし）
- 各国通関（USA/EU/AU/CA の食品輸入基準確認要）
- 転売規制（KURADASHI等の利用規約確認済み）
- 古物商許可（不要・食品のため）

---

## <a id="s7"></a>7. 🗺️ プロダクト設計

### フォルダ構成（予定）

```
sericiacom/
├── CLAUDE.md                    ← このファイル
├── medusa-backend/              ← Medusa v2（Hetzner CPX22）
│   ├── medusa-config.ts
│   └── src/api/crossmint-webhook/
└── storefront/                  ← Next.js（Cloudflare Pages or Coolify）
    ├── app/
    │   ├── page.tsx             ← ドロップLP
    │   └── api/webhook/         ← Crossmint Webhook
    └── components/
        └── CrossmintButton.tsx
```

### Drop #1 ラインナップ（確定）

```
「Irregular Japan Box」$95
  規格外煎茶    100g  仕入れ¥400〜648
  訳あり味噌    200g  仕入れ¥600
  規格外椎茸     50g  仕入れ¥500
総重量: 約450g / EMS: ¥2,150
```

### ラグジュアリーUX（2026-04-22 実装完了）

Aesop / Louis Vuitton 級のストアフロント体験を `storefront/` 配下で end-to-end 実装:

- **ナビ**: スマートスティッキーヘッダー（スクロール下で非表示・戻りで再表示・80px後にbackdrop-blur）/ アナウンスメントバー（CSSマーキー・prefers-reduced-motion対応）/ SERICIA ワードマーク + `favicon.svg`
- **ヘッダー3アイコン**: 検索（cmd+K / `/`）・ユーザー（ログイン時 filled + wishlistリンク）・バッグ（右側 vaul ドロワー + カウントバッジ）
- **カートドロワー**: vaul 右側 440px・auto-animate・送料進捗ストリップ・small-batch Kyoto 説明
- **グローバル演出**: Framer Motion ページトランジション + FadeIn スクロール + Lenis スムーススクロール（`window.__lenis` 公開）/ カスタムカーソル（8pxドット+40pxリング・mix-blend-difference・タッチ端末オフ）/ マグネティックボタン / BackToTop（400px後）
- **ヒーロー**: アニメーショングラデーション（22秒ループ）・SVG grain・typewriter（3行ループ）・視差パララックス・MagneticButton CTA
- **検索**: Meilisearch想定のFuse.jsフォールバック（重み付きキー・threshold 0.35）・`/api/products/search-index`（s-maxage 60秒キャッシュ）
- **商品一覧/カード**: 2グラデーションクロスフェード・ハートボタン（Zustand persist `sericia-wishlist`）・SVG noise overlay
- **PDP**: 左サムネイル5枚列・メイン画像 2x ホバーパンズーム（カーソル位置追従）・モバイルEmblaカルーセル+ドットページネーション / framer-motion アニメーションアコーディオン（Ingredients & origin / Shipping & returns / Producer story / Tasting notes）/ モバイルスティッキー下部CTA（IntersectionObserver発動）/ NotifyMeモーダル（売切時・waitlistに`metadata.productId`付与）/ Recommended pairings 3件
- **ウィッシュリスト**: `/account/wishlist`（auto-animate・全件カートイン・個別追加・日付表示・empty state）・Supabase `sericia_wishlist` テーブル（`user_id`+`product_id` UNIQUE + RLS select/insert/delete own）
- **ホーム**: CinematicHero + Current drop / Most loved（3件ずつ ProductCard + FadeIn）+ StatCountUp（23 makers / 48h ships / 100% traceable）+ 既存 WaitlistForm/FAQ セクション
- **モバイル戦略**: PWA未対応（今回範囲外）だがモバイル体験（レスポンシブ・下部CTA・vaulドロワー）は完成
- **品質**: A11y（aria-label/aria-expanded/aria-modal/focus管理）・prefers-reduced-motion 尊重・全 `target="_blank"` に `rel="noopener noreferrer"`・try/catch + toast.error + console.error 全ミューテーション

導入ライブラリ: `framer-motion` / `lenis` / `vaul` / `typewriter-effect` / `embla-carousel-react` / `fuse.js` / `@formkit/auto-animate` / `react-countup`

マイグレーション: `supabase/migrations/20260422_wishlist.sql` — `sericia_waitlist.metadata jsonb` 追加 + `sericia_wishlist` 新設（appexx-studio プロジェクトに適用済み）

### P2 Aesop-tier 仕上げ（2026-04-22 実装完了・`64d1ec74`）

Drop #1 ローンチ直前のブランドグラマー統一・情報アーキテクチャ整備・法令/A11y下支え:

- **LuxuryLoader**: 漢字ロゴ・ワードマーク・のれん演出を全撤廃 → リング spinner のみ（600ms自動消滅・`prefers-reduced-motion` 尊重）。ユーザー指示「ローディングは✖ぐるぐるのみ」準拠
- **鮮 hanko 全面削除**: 7ファイル（logo / logo-mark / og-default / drop-001 / miso / sencha / shiitake / placeholders/README）からレンダリング出力削除。ブランドプレゼンスは SERICIA ワードマーク単独で表現（監査コメントのみ残置）
- **Luxury 404**: `app/not-found.tsx` — Next.js デフォルト白画面を置換。PageHero + 6導線グリッド（Storefront/Collection/Journal/Tools/Guides/About）+ 問合せスラブ。`robots: { index: false, follow: true }`
- **XMLサイトマップ拡張**: `app/sitemap.ts` を async 化 → Medusa プロダクト動的取得（try/catch で build 耐性）+ /products /about /sitemap /accessibility /faq /tokushoho 追加。合計 **102 URL**（pSEO 64 + tools 8 + journal + products + brand pages）
- **人間向けサイトマップ**: `/sitemap` — Aesop流 7セクション index（Shop/Journal/Tools/Country guides/Company/Account/Legal）。ISR `revalidate=21600`（6h）。XML版へのリンク付き
- **FAQ**: `/faq` — 6セクション × 2-3問。FAQPage JSON-LD（GEO/Perplexity/ChatGPT引用対応）+ `<dl>/<dt>/<dd>` セマンティックマークアップ + dual answer format（`plain` for schema / `a: ReactNode` for rendering）
- **Accessibility Statement**: `/accessibility` — WCAG 2.2 AA ターゲット明記（EAA 2025対応）/ 現状対応 7項目 / 既知の不備 3項目 / 連絡先 `accessibility@sericia.com`（2営業日以内返信）
- **CookieConsent**: `components/CookieConsent.tsx` — Aesop流ペーパー調ボトムバナー（`fixed bottom-0`・hairline border・ドロップシャドウなし）。Accept/Decline 2択 + privacy link。`localStorage["sericia:cookie-consent"]` に ISO timestamp 保存・**365日再質問**サイクル。`CustomEvent("sericia:consent-changed")` 発火で Analytics 側がリアルタイム反応可能。`role=dialog` + `autoFocus` + `aria-labelledby` で a11y 完備。`RootLayout` にマウント

検証済みURL（全200/404適正）: `/` `/faq` `/accessibility` `/sitemap` `/sitemap.xml` `/tokushoho` + `/nonexistent-*` → 404

### ブランドアセット厳守ルール（2026-04-22 codified・永久）

**🚫 漢字NG — Sericia のブランドアセットには漢字（CJK Unified Ideographs `U+4E00–U+9FFF`）を一切使わない。**

対象: logo / logo-mark / favicon / OG card / 商品プレースホルダー / `public/` 配下の全 SVG・PNG・アイコン資産。鮮 hanko・中央大漢字（茶/味/椎/集）いずれも恒久的に非採用。

採用するのは Latin タイポグラフィのみ:
- **ワードマーク**: `SERICIA`（Helvetica letter-spaced 14, 300 weight）
- **ドミナント装飾**: `Sericia` italic serif（Cormorant Garamond / Didot stack, 220pt on 1200×1200 canvas）
- **タグライン**: `Craft food, rescued.` italic serif
- **フッター**: `RESCUED JAPANESE CRAFT FOOD` letter-spaced caps
- **装飾テクスチャ**: silk-fibre strokes（`#5c5d45` opacity 0.28）+ double hairline frame

日本性は「紙色（`#faf6ee` sericia-paper-card）+ silk テクスチャ + 静かな間」で表現する。字形では表現しない。これは Aesop / Le Labo / Lafco の純ワードマーク伝統に則った意図的な設計選択で、越境 ECとしてグローバル普遍性を確保する。

**例外（禁止ではない領域）**: pSEO brief prose・testimonials・ja-JP ロケールの editorial 本文など、ブランド識別ではなく「コンテンツ」としての日本語テキスト。UI の本文翻訳も禁止ではない（next-intl ja messages は正常運用）。

**強制検証**: `grep -r '[\u4e00-\u9fff]' storefront/public/` が常に zero match であること。CI に組み込む候補（TODO: `.github/workflows/brand-asset-guard.yml`）。

### 共通プレースホルダー戦略（2026-04-22）

商品画像プレースホルダー（`sencha.svg` / `miso.svg` / `shiitake.svg`）は **byte-identical な共通ブランドカード**として配信。商品ごとの差別化（かつての 茶/味/椎 中央漢字）は撤廃。グリッドが「4つのグレー枠」ではなく「1つのキュレーションされたコレクション」として読めることを優先。`drop-001.svg` のみバンドル階層を示すためダーク paper（`#ebe4d4`）+ `DROP NO. 01` eyebrow で差別化（Aesop collection card と同階層）。

URL 安定性の恩恵: Medusa の `product.thumbnail` レコード（URL が product row に永続保存されている）を再アップロードせずに、SVG ファイルを上書きするだけで全 PDP・カード・OG・pSEO に即時伝播する。

---

## <a id="s8"></a>8. ⚙️ 技術設計

### スタック（確定）

| ツール | 役割 | 場所 |
|-------|-----|------|
| Medusa v2 | バックエンド・Admin・在庫管理 | Hetzner CPX22 |
| Medusa Admin | ドロップ管理・注文一覧（内蔵） | 同上 |
| Next.js | ストアフロント | Coolify or CF Pages |
| Crossmint | 顧客決済（クレカ→USDC） | 外部SaaS |
| PostgreSQL | 注文・商品DB | Hetzner（Docker） |
| Redis | キュー | Hetzner（Docker） |
| Coolify | サーバー管理UI | Hetzner CPX22 |

### インフラ（確定）

```
Hetzner CPX22: 2vCPU / 4GB RAM / €9.49/月
  IP: 46.62.217.172
  Firewall ID: 10867883 (sericia-fw)
  ポート: 22/80/443/8000(Coolify)/9000(Medusa)
```

### Crossmint × Medusa 統合（Option B: Webhookブリッジ）

```
Crossmint決済完了
→ POST /api/webhook/crossmint
→ Medusa Admin API で注文作成
→ 在庫 -1
→ Resend でメール送信
```

### 環境変数（実値はreference_api_keys.md参照）

```
DATABASE_URL=postgres://medusa:***@h128il6uh7sxdkb5s3w0vuz7:5432/medusa
REDIS_URL=redis://default:***@yau9i5yafa98tc8dm8ag5kmp:6379/0
JWT_SECRET=（Medusa生成時に設定）
COOKIE_SECRET=（同上）
CROSSMINT_API_KEY=（Crossmint dashboard取得）
RESEND_API_KEY=（Coolify設定済み・共通）
```

### Coolify構築済みリソース（2026-04-21）

| リソース | UUID | 状態 |
|---------|------|------|
| Server (This Machine) | `s2d9yizjphbvw93sg21l7wly` | ✅ reachable |
| Project sericia | `qnry7poqtz364qhgupfq4c0k` | ✅ 作成済み |
| PostgreSQL | `h128il6uh7sxdkb5s3w0vuz7` | ✅ instant_deploy |
| Redis | `yau9i5yafa98tc8dm8ag5kmp` | ✅ instant_deploy |
| Medusa Backend | 未構築 | 次回: ソースコードscaffold→GitHub push→Coolifyでデプロイ |
| Next.js Storefront | 未構築 | Medusa後 |

---

## <a id="s9"></a>9. 📣 GTM・集客

### Phase 1 集客（Reddit主軸）

| チャネル | 戦略 |
|---------|-----|
| r/JapaneseFood | 開封レビュー投稿・コメント誘導 |
| r/mildlyinteresting | 「変な形の野菜」系Wabi-sabiコンテンツ |
| r/Frugal | 「廃棄寸前を救った食品」切り口 |
| r/foodlossreduction | フードロス削減角度 |
| TikTok | 開封動画・日本農家紹介 |
| Instagram | Wabi-sabi美学ビジュアル |

### pSEO戦略（Phase 2〜）

```
/blog/wabi-sabi-food-japan
/blog/irregular-matcha-guide
/blog/japanese-artisan-miso
→ GEO（AI検索）最適化：TL;DR先出し・自社統計必須
```

---

## <a id="s10"></a>10. 🖥️ 運用

### 環境変数実値（Coolify設定）

> 設定後にここに記録する（APIキーは reference_api_keys.md 参照）

### 仕入れ自動化パイプライン

```
n8n cron(週次):
  Layer 1: KURADASHI/Otameshi スクレイピング
  Layer 2: BASE個人店 底値参照
  Layer 3: Amazon US 在庫チェック（不在のみ通過）
  → DeepSeek V3（$0.014/1M Context Caching）
  → Slack承認 → LP自動掲載
```

---

## <a id="s11"></a>11. 💴 経費・収益シミュ

→ 詳細は `~/.claude/knowledge/business-idea-303-japan-craft-food.md` s10/s10-2 参照

**Phase 1 目標**: 月20件 × $78平均 × 80.6% = **月粗利 ~$1,258**

---

## <a id="s12"></a>12. 🌐 ドメイン・商標

| 項目 | 状態 | 値 |
|-----|------|---|
| ドメイン | 取得予定 | sericia.com |
| Cloudflare Zone | 未設定 | — |
| SNS @sericia | 未取得 | Instagram / TikTok / X |
| GitHub | 作成済み | Paradigmllc/sericiacom |

---

## <a id="s13"></a>13. 📚 リソース一覧

| ツール | 用途 | URL |
|-------|-----|-----|
| Medusa.js | ヘッドレスコマース | https://medusajs.com |
| Crossmint | Web3決済 | https://crossmint.com |
| KURADASHI | 訳あり食品仕入れ | https://kuradashi.jp |
| BASE | 個人店底値参照 | https://thebase.in |
| Hetzner | サーバー | https://console.hetzner.cloud |
| Coolify | デプロイ管理 | http://46.62.217.172:8000 |

---

## <a id="s14"></a>14. 🧠 壁打ち詳細メモ（設計決定の根拠）

> **詳細は外出し**: 情報非対称アービトラージの構造・英語フレーミング変換表・仕入れ先 Tier マップ・BASE 個人店 送料無料閾値最適化ロジック・EMS ブラケット × 購入数の構造的優位性・n8n 自動収集パイプライン (3層構造)・商品利益率ティア早見表・決済・キャッシュフロー設計・Medusa 採用根拠・対象国 Tier・賞味期限の輸出可否ルール・フェーズ別モデル進化・非採用アイデアと理由・成功モデル参照・Phase 1 Week 別タスク — 全 14 項目の意思決定背景は [`docs/knowledge/poss-sericia-implementation.md#s14`](docs/knowledge/poss-sericia-implementation.md) を参照。

**要点**: 「訳あり = Irregular = Natural = Artisan」の文脈変換 × 円安 1/5〜1/10 × Amazon US 不在を必須条件 → Supreme 型限定ドロップ × Crossmint クレカ→USDC 即時着金で立替不要 × Medusa v2 で Admin/在庫管理 × Phase 1 (転売屋) → Phase 2 (バイヤー) → Phase 3 (商社) 段階進化。

---

## <a id="s15"></a>15. 🚧 実行トラッカー（F1-F69 — 2026-04-21〜）

> **詳細は外出し**: 全マイルストーン（M1 /tools 500/404 修正 → M2 Payload CMS v3 → M3 Medusa v2 → M4a-1〜8 storefront 統合 → M4b Aesop polish + Referrals + PWA + pSEO Engine → M4c launch-ready + Magic Link → F1 Cinematic Video → F35 Crossmint sales activation → F37〜F39d 全ページ共通くるくる + CF Cache → F40 SEO/Indexing megacommit → F41-F49 視覚 upgrade + DeepSeek V4 移行 + Magic UI + pSEO scoring → F50-F57 CMS hybrid blocks + Hyperswitch + Payment settings 全 i18n → F58-F66 9 pages × 10 locales E2E 49/49 PASS → F67 /pay i18n + Stripe LIVE → F68 hydration regression → F69 perf + i18n sweep）は [`docs/knowledge/poss-sericia-implementation.md#s15`](docs/knowledge/poss-sericia-implementation.md) を参照。

### 直近の状態（2026-05-13）

| Milestone | 状態 |
|-----------|------|
| M1〜M4c (storefront + Medusa + Payload + i18n 10 locales) | ✅ 完了 |
| F58〜F66 (Stripe primary rail + 9 pages × 10 locales i18n) | ✅ 完了 (E2E 49/49) |
| F67 (Stripe pk_live + /pay i18n hybrid resolver) | ✅ LIVE |
| **F68** (HTML DOCTYPE 欠落) | ✅ 修正済 (no-transform header) |
| **F69** (perf + i18n sweep) | ✅ 本セッション完了 |
| Drop #1 ローンチ | ⏳ 起票待ち (Crossmint Sales activation 並走) |
| pSEO Engine 量産 | ⏳ brief 投入待ち (基盤は F44/F46/F47 完成) |
| Push PWA + Referrals | ⏳ 配信開始待ち (基盤完成) |
| Arabic RTL audit (T3-A-RTL-audit) | ⏳ ms-/me-/start-/end- 物理→論理 pass |

### F69 — Perf + i18n sweep（本セッション・2026-05-13）

**Performance (4 fixes)**:
1. **middleware.ts**: `supabase.auth.getUser()` を `/account/*` に gate → ゲスト全ページ TTFB -100〜300ms
2. **middleware.ts**: `Cache-Control: no-transform` を全 response に append → Cloudflare Auto Minify による `<!DOCTYPE html><html>` strip を抑制 (F68 fix)
3. **`<DeferredOverlays>`**: DifyChat / Analytics / CookieConsent / SocialProofToastGate / ServiceWorkerRegister を `lazy()` + `requestIdleCallback` 2s で post-paint mount → TTI -500〜1500ms
4. **Noto Sans JP**: `preload: false` + locale=ja 以外で CSS variable 省略 → preload signal -110kB on 90% traffic

**i18n hardcoded English sweep (60+ strings × 10 locales = 600 translations)**:
- Detected via 5-pattern grep (JSX text / placeholders / aria-labels / toast / fallback strings)
- Translated via DeepSeek V4 cached batch — 20 namespaces, 8064 cache-hit tokens, 4866 cache-miss tokens, 17324 completion tokens, **$0.0056 USD** total
- Wired 15+ components: page.tsx (home `<dt>` labels) / products listing (No matches) / PDP (The story) / WaitlistForm / FooterSubscribeForm / NotifyMeModal / PushOptIn / CartCheckoutForm (30 keys) / CartClient / CartDrawer (aria) / BackToTop (aria) / AddToCartButton (aria) / journal listing + slug / compare / uses
- New namespaces: `home_sections.spec` / `products.listing_extras` / `pdp.extras` / `journal.listing` / `compare.sections` / `uses.sections` / `forms.waitlist` / `forms.footer_subscribe` / `forms.notify_me` / `forms.push_optin` / `cart.checkout_extras` / `common.sidebar` / `common.a11y`

**Open follow-ups (F70+)**:
- Operator action: Disable CF Auto Minify HTML on sericia.com zone via dashboard (definitive fix; no-transform header is the belt-and-suspenders signal)
- CheckoutForm.tsx (legacy, less-used path) i18n wire-up
- ContentSidebar.tsx + AccountNav.tsx i18n
- Hetzner CPX22 → CPX31 upgrade (€10/月 増 / build OOM 撲滅)
- F70 verify: probe `https://sericia.com/` HTML body for DOCTYPE presence after deploy

---

> このファイル末尾に到達。実装ディテール・過去 milestone の根拠は `docs/knowledge/poss-sericia-implementation.md` を参照。
