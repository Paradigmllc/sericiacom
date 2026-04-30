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
| ★★★★☆ | 9 | [📣 GTM・集客](#s9) | Reddit戦略・SNS設計済み + pSEO briefs自動生成基盤（DeepSeek V3 Context Caching 90%OFF）+ Push PWA再訪導線 |
| ★★★★☆ | 10 | [🖥️ 運用](#s10) | UAT自動化E2E完備（uat:magic-link 9check / uat:purchase-flow 8check・triple safety interlock・tampered HMAC rejects 401）+ Crossmint本番移行§5.1-5.8 playbook（rollback先置）+ /api/push/subscribe VAPID RLS |
| ★★★★☆ | 11 | [💴 経費・収益シミュ](#s11) | 利益率計算済み + referral経済（$5 off friend / $5 reward on ship・pending→issued/revoked state machine） |
| ★★☆☆☆ | 12 | [🌐 ドメイン・商標](#s12) | sericia.com稼働中・商標未出願 |
| ★★★☆☆ | 13 | [📚 リソース一覧](#s13) | 主要14ツール整備（DeepSeek V3 / web-push VAPID / Payload CMS 3.x / Resend / Crossmint / Supabase / Medusa v2 / Dify / n8n / Coolify / Next.js 15 / next-intl 8言語+Arabic RTL / Framer Motion / Lenis）|
| ★★★★☆ | 14 | [🧠 壁打ち詳細メモ](#s14) | 仕入れTier/EMS最適化/非採用/Phase戦略 |
| ★★★★★ | 15 | [🚧 M1-M5 実行トラッカー](#s15) | M1〜M4b全完了 + F35 = Crossmint Onramp blocker特定済 (sales activation pending) / M5はbrief投入待ち |

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

> 全詳細は `~/.claude/knowledge/business-idea-303-japan-craft-food.md` (941行)
> このセクションは「なぜそう決めたか」を他のエンジニア・将来の自分が読んで再現できる形で残したもの

### 14-1. 情報非対称アービトラージの構造

```
日本側: 訳あり = 値引き・廃棄対象
西洋側: Irregular = Natural = Artisan = プレミアム
円安:   日本仕入れ価格が欧米比で1/5〜1/10
────────────────────────────────
= 同じ物が「文脈変換」だけで5〜10倍の価格差
```

**英語フレーミング変換表**:
| 訳あり(日本語) | 英語プレミアム |
|-------------|------------|
| ラベル不備 | "Unlabeled Batch / Direct from Kura" |
| 規格外サイズ | "Artisan Irregular, Hand-selected" |
| 在庫過多 | "Limited Reserve, This Season Only" |
| 廃業前在庫 | "Final Vintage, Brewery Closing 2025" |
| 発酵過多 | "Extra-aged, Umami Intensified" |

### 14-2. 仕入れ先Tierマップ

| Tier | サイト | 特徴 | 取得方法 |
|------|-------|-----|---------|
| **S** | KURADASHI | フードロス特化・訳あり整理済み | Playwright |
| **S** | Otameshi | 訳あり・お試し専門 | Playwright |
| **A** | 楽天ふるさと納税 | **公式API** | Rakuten API ✅ |
| **A** | ふるさとチョイス | 最大規模80万点 | Playwright |
| **B** | 食べチョク / ポケマル | 農家直販 | Playwright |
| **底値参照** | BASE個人店 | KURADASHI比30-40%安いケースあり | Playwright |
| **スポット** | ジモティー | 無料〜格安 | 手動週1確認 |

⚠️ **KURADASHI神話の修正**: 常に最安ではない。コモディティ品（定番静岡茶等）はBASE個人店 < Amazon < KURADASHIのケースあり。**商品ごとに3サイト比較して最安値源泉を選択**する。

### 14-3. BASE個人店 送料無料閾値の最適化ロジック

```javascript
// 各店舗ページから送料条件を自動抽出→最適発注数を算出
function calcOptimalOrder(unitPrice, shippingFee, freeThreshold = 3000) {
  if (freeThreshold === null) {
    return { qty: 1, totalCogs: unitPrice + shippingFee };
  }
  const qty = Math.ceil(freeThreshold / unitPrice);
  return { qty, totalCogs: unitPrice * qty, unitCogs: unitPrice };
}
// 例: 煎茶¥648 × 5個 = ¥3,240（¥3,000超 → 送料¥0）
// → 実質単価 ¥648 / EMS ¥1,750 / $95販売 → 利益率 83.7%
```

**実証例（お茶の荻野園）**: 単品購入78.5% → 5個まとめ買い送料無料で**81.2%**（Tier A→S）

### 14-4. EMSブラケット × 購入数の構造的優位性

```
EMS重量ブラケット（100g商品+梱包材 ≈170g/個）:
  1個(170g)  → ≤250g → ¥1,750
  2個(340g)  → ≤500g → ¥2,150
  3個(510g)  → ≤1kg  → ¥3,100
  4個(680g)  → ≤1kg  → ¥3,100  ← 3個と送料同額！
  5個(850g)  → ≤1kg  → ¥3,100  ← さらに有利

→ "$200以上で送料無料" = 実質4個購入誘導
→ AOV自然増 + 1個あたり送料負担↓ + 利益率↑ の3点同時解決
```

### 14-5. n8n自動収集パイプライン（3層構造）

```
週次cron:
  [Layer 1: メイン訳あり品収集]
    Playwright → KURADASHI全商品 / Otameshi新着
    Rakuten API / Yahoo Shopping API

  [Layer 2: 底値参照（BASE個人店）]
    Playwright → BASE キーワード検索
    → calcOptimalOrder() で最適発注数・実質COGS算出

  [Layer 3: Amazon USフィルター（必須）]
    PA-API → Amazon US 同商品検索
    → 見つかった = 輸出優位性なし → スキップ
    → 見つからない = パイプライン続行 ✅

      ↓ DeepSeek V3（Context Caching 90%OFF・$0.014/1M）
      ↓ 英語説明+侘び寂びストーリー生成
      ↓ スコアリング（軽量×高単価×ストーリー×AmazonUS不在×利益率）
      ↓ 上位10件 → Slack承認 → Next.js LP自動掲載
```

### 14-6. 商品利益率ティア早見表

| Tier | 利益率 | 典型商品 | 条件 |
|------|-------|---------|------|
| 🥇 SS | 85%+ | 山椒+七味+出汁粉末キット / 昆布パウダー / 黒にんにく100g | 総重量≤250g & 仕入≤¥500 |
| 🥈 S | 80-85% | 抹茶粉末 / 乾燥椎茸 / 一味唐辛子 | 軽量×プレミアム |
| 🥉 A | 75-80% | 煎茶葉 / 梅干し乾燥型 / 番茶 | 中量定番 |
| B | 70-75% | 現行Drop#1（煎茶+味噌+椎茸） / 味噌300g | 重め |
| ❌ OUT | <70% | 酒類 / 液体醤油 / 生鮮 / 動物性だし | 構造的不可 |

> **重量削減 > 仕入れ値削減**。送料固定コスト削減のほうが値引き交渉より利益率インパクトが大きい。

### 14-7. 決済・キャッシュフロー設計

```
顧客: クレカ/Apple Pay (摩擦ゼロ)
  ↓ Crossmint (2.5%手数料のみ)
USDC着金(数分)
  ↓ Tria/RedotPay Visaデビット(即時)
  ↓
仕入れ(Visa加盟店なら即日)

キャッシュサイクル: ほぼ0分 / クレカ不要 / 立替初回¥2〜3万のみ
```

**Stripe/Shopifyを採用しない理由**:
- Stripe: 7日ローリング入金 → キャッシュフロー問題
- Shopify: Crossmint(外部決済)に2%追加手数料
- Crossmint: 2.5%のみ・チャージバック低減・グローバル対応

**Crossmint審査タイムライン**: Sandbox即日 / 本番(物理商品)1週間前後 → Sandbox開発と審査を並行

### 14-8. Medusa採用の根拠（スクラッチから転換）

スクラッチ比 **工数▲2.5日削減**。Admin・在庫・注文管理がゼロコストで付属。

| ツール | 役割 | 工数 |
|-------|-----|-----|
| Medusa v2 | 商品・在庫・注文管理バックエンド | 1日 |
| Medusa Admin | ドロップ管理・注文一覧・在庫更新（内蔵） | 0日 |
| Next.js | ストアフロント（Medusa starter流用） | 0.5日 |
| Crossmint Button | 顧客決済 | 0.5日 |

**Crossmint × Medusa 統合はOption B（Webhookブリッジ）採用**:
- AbstractPaymentProvider実装（Option A）は工数+2日で割に合わない
- Crossmint決済はMedusa外で完結 → 複雑さゼロ
- Medusaは「Admin/在庫管理専用」として割り切る

```
[顧客] → Crossmint決済完了
       → POST /api/orders/crossmint-webhook (Next.js)
       → Medusa Admin APIで注文手動作成
       → 在庫 -1
       → Supabaseにミラー（バックアップ）
       → Resendで発送メール
```

### 14-9. 対象国Tier

| Tier | 国 | 理由 |
|-----|---|-----|
| **即日開始** | 米国・カナダ・UK・シンガポール | 英語圏・小ロット通関実績豊富 |
| **3ヶ月後** | オーストラリア・香港・台湾 | 実績積んでから |
| **検討** | UAE等中東 | 醤油除外セット限定 |
| **永久除外** | EU・韓国 | EU農薬基準 / 韓国福島規制 |

**FDA Prior Notice（米国）の運用実態**: 建前は事前通知必要だが、B2C小パッケージ（個人消費量）は実務上ほぼスルー。止められても返送 or 廃棄（初回は罰金なし）。植物性・乾燥・密封品限定でリスク最小化。

### 14-10. 賞味期限の輸出可否ルール

EMS発送〜顧客手元まで最短10〜20日。残存期限が短い商品は輸出不可。

| 商品カテゴリ | 最低残存期限 |
|------------|-----------|
| 抹茶・山椒・粉末類 | 3ヶ月以上 |
| 乾燥椎茸・昆布 / 煎茶葉 / 味噌密封 | 4ヶ月以上 |
| 梅干し | 6ヶ月以上 |

→ セカンダリー残り1〜2ヶ月品は輸出不可。残り3〜6ヶ月品を厳選する。

### 14-11. フェーズ別モデル進化

```
Phase 1: 転売屋 (0〜3ヶ月・月50件)
  KURADASHIで買って海外で売る（手動・小規模）

Phase 2: バイヤー (3〜12ヶ月・月300件)
  販売実績を武器にKURADASHI出品者へ直接コンタクト
  「次の余剰品が出たら優先連絡を」
  n8n: 生産者リスト自動収集 + DeepSeek V3 個別化メール

Phase 3: 商社 (1年後〜)
  複数メーカーと継続契約・優先仕入れ確保
  訳あり品から通常品の輸出代理まで拡大
  廃業メーカー在庫競売（Yahoo官公庁オークション）定期監視
```

**Phase 2 直接交渉のWin-Win構造**:
```
KURADASHI経由: 定価¥1,000 → 販売¥400 → 生産者取り分 ¥200〜280
直接取引:     定価¥1,000 → こちら買取¥350 → 生産者取り分 ¥350
→ 生産者: PF手数料節約(Win) / こちら: 仕入れ30-50%削減(Win)
```

⚠️ **PF上での直接取引勧誘はNG（BANリスク）** → KURADASHIで実購入→購入後に公式サイト/SNS経由で「継続取引の相談」として連絡する。

### 14-12. 非採用アイデアと理由（重要）

| アイデア | 非採用理由 |
|---------|-----------|
| マーケットプレイス型 | 生産者自走不可→ポータル化→モートゼロ |
| サブスクBox型 | 安定供給不要・選べない不満・チャーン |
| 問い合わせ形式 | バイパスされて収益なし |
| 生産者直取引(初期) | 交渉コスト高・即日開始不可（Phase 2送り） |
| Shopify | Crossmint追加手数料2%・¥100K/月損失 |
| Stripe | 7日入金待ち・キャッシュフロー問題 |
| EU市場 | 農薬基準・VAT・GDPR・複雑度高 |
| 酒類・ワイン | EMS禁止+FedEx15kg¥22,000+各国規制→最大40% |
| 重量液体（醤油大瓶） | EMS制限→60%以下 |
| 野菜・果物 / 生鮮 | 鮮度+検疫 |
| 鰹節・動物性だし | 検疫リスク |
| セカンダリー以降格安 | フードバンク行き（非営利）=購入不可 |
| FC(初期) | 月50件未満は自己発送で十分 |

### 14-13. 成功モデル参照

| 企業 | 学び |
|-----|-----|
| Bokksu ($40M+ ARR) | キュレーション=商品。だが**固定Boxは採用せずドロップ型に** |
| Misfits Market ($1.1B) | 規格外=プレミアム先行事例 |
| Natural Wine | 「濁り=無濾過=本物」で高単価化（侘び寂びと同構造） |
| Supreme | ドロップ型FOMO設計（安定供給不要・在庫リスクゼロ） |

**採用モデル**: キュレーションBox型ではなく**限定ドロップ型**
- 理由: 安定供給不要・FOMO自然発生・在庫リスクゼロ・選べない不満なし

### 14-14. Phase 1 Week別タスク

```
Week 1:
  ✅ Crossmint Sandbox作成
  ✅ 特商法ページ + Privacy Policy（Termly.io自動生成）
  ✅ Next.js LP + Crossmint埋め込み
  ✅ Coolifyデプロイ

Week 2:
  ✅ KURADASHI等で商品実物確認・仕入れ値確定
  ✅ 英語商品ページ・ストーリーライティング
  ✅ Reddit / Steepster / TeaChat 3コミュ投稿
  ✅ 無料サンプル5名告知（Zappos型リーチ）

Month 1-3:
  ✅ 初回ドロップ: 12ユニット限定 $95
  ✅ EMS自己発送で学習
  ✅ 売り切れ→メーリングリスト構築
  ✅ 2回目ドロップ告知
```

**初回ドロップ告知テンプレ**:
```
"Japan's artisan breweries are closing.
Their 'irregular' batches were going to waste.

I'm sourcing them directly and shipping worldwide.
150-year-old miso, hand-packed tea,
label-imperfect soy sauce —
everything Western artisan shops charge 3x for.

First drop: 12 units only. $95.
Ships within 14 days from Japan.

[Link]"

+ "Sending 5 free samples to the first 5 people who DM me their address"
→ 無料サンプル→レビュー→次ドロップ売り切れ
```

---

## <a id="s15"></a>15. 🚧 M1-M5 実行トラッカー（2026-04-21〜）

### 進捗

| # | マイルストーン | 状態 | コミット | 検証 |
|---|-------------|-----|---------|------|
| **M1** | /tools/* 500/404 修正 + Dify チャットボット | ✅ 完了 | `fe30f8c2`, `87782adf` | 全ツール200 / Dify 2段フォールバック（SDK→iframe） |
| **M2** | PayloadCMS v3 インストール（7 collections + 2 globals + 6 blocks） | ✅ 完了 | `db83336b` | ビルド成功・M2-activate で本番稼働済み |
| **M2-activate** | Payload 本番アクティベーション（env 投入 → DB pw reset → migrate/bootstrap → admin login E2E 検証 → init migration コミット） | ✅ 完了 | `21156de8`, `f60042fc` | https://sericia.com/cms/admin 稼働中（`admin@sericia.com` ログイン HTTP 200 + JWT 発行確認）/ Dockerfile に Payload CLI ソース依存（tsconfig/payload.config.ts/collections/globals/blocks/migrations/scripts）を同梱 / `docker-entrypoint.sh` の3フェーズ冪等ブート（migrate=fail-fast / bootstrap=fail-open / next start exec）/ SSL急所 = `sslmode=no-verify`（pg v3 が `require` を `verify-full` エイリアスするため必須） |
| **M3** | Medusa v2 起動（9 regions + 4 products + Coolifyデプロイ） | ✅ 完了 | `46384141`, `6737fd61` | `api.sericia.com/health` 200 / `/store/regions` 9件 / `/store/products` 4件 / `/admin` JWT 200 |
| **M4a-1** | storefront products facade → Medusa（listing/PDP/search-index の data source 切替 + Strategy B カテゴリ紐付け 4 products） | ✅ 完了 | `40d7b9e6`, `f858ac5c` | `/store/products` 4件にカテゴリ付き（tea/miso/mushroom/seasoning）/ Coolify storefront の env vars 待ち |
| **M4a-2** | checkout rewrite（`/api/orders/create-cart` を Medusa 価格・在庫ソースに切替 / Crossmint 保持） | ✅ 完了 | (this commit) | `getProductsByIds()` 経由で Medusa が prices + stock の source of truth / sericia_orders は受注台帳として残し Crossmint は無変更 / Slack webhook on order_created 追加（Rule N 準拠） |
| **M4a-Dify hotfix** | 本番 sericia.com に表示されていた "App with code WnX69... not found" トーストを除去（DifyChat.tsx のハードコード fallback token を削除） | ✅ 完了 | (this commit) | `NEXT_PUBLIC_DIFY_TOKEN` 未設定時は何もレンダーしない graceful degradation（Rule V 準拠） |
| **M4a-3** | payment-success 副作用一括（storefront `/api/crossmint-webhook` に Medusa admin 在庫 decrement + Slack paid bell 追加・Crossmint webhook は storefront 直行のためこの経路が単一情報源） | ✅ 完了 | (this commit) | `storefront/lib/medusa-admin.ts`（admin JWT 50分キャッシュ）/ `storefront/lib/slack.ts`（Block Kit DRY）/ webhook 側で `sericia_order_items` から variant を走査し `decrementVariantInventory()` を `Promise.allSettled` で並列実行・失敗時は Slack bell に ⚠️ マーク |
| **M4a-3b** | Medusa subscriber `order-placed.ts` 拡張（admin UI 経由オーダー用セーフティネット）| ⏸️ 待機 | — | post-open 対応。現状 Crossmint → storefront webhook が全オーダー経路 |
| **M4a-4** | n8n ワークフロー JSON コミット（abandoned-cart / low-stock-alert / welcome-email / post-purchase-review）| ✅ 完了 | (this commit) | `n8n-workflows/*.json` × 4 / Supabase RPC `list_abandoned_carts` + `list_review_targets` と schema columns `cart_abandoned_notified` / `review_requested` が未整備（post-open で追加）|
| **M4a-5** | Dify knowledge base 初期シード（shipping / ingredients / refund-policy / faq）| ✅ 完了 | (this commit) | `docs/knowledge-base/*.md` × 4 / Dify の `knowledge_bases:` 配下で `dify/customer-support.yml` から参照 |
| **M4a-6** | Supabase schema 追加（n8n marketing automation 用 RPC + columns + partial indexes）| ✅ 完了 | `376134e4` | `supabase/migrations/20260421_marketing_automation.sql`（`cart_abandoned_notified` / `review_requested` + RPC 2本 + backfill 2行 / Supabase MCP `apply_migration` 経由で appexx-studio に適用済み） |
| **M4a-7a** | Google OAuth UI 実装（`GoogleSignInButton` + `/login` + `/signup` に配線・PKCE/`access_type:offline`・プロフィール自動生成は `sericia_handle_new_user()` トリガー活用）| ⚠️ 破棄（M4c-8 で Magic Link に置換） | (historical) | `storefront/components/GoogleSignInButton.tsx` は M4c-8 で削除。`/auth/callback` は OTP と OAuth を同じ `exchangeCodeForSession` で処理するため Magic Link 移行時に再利用（無変更） |
| **M4a-7b** | Google Cloud Console + Supabase Dashboard セットアップガイド | ⚠️ 破棄（M4c-8 で撤回） | (historical) | `docs/GOOGLE_OAUTH_SETUP.md` はセットアップ手順としては残すが **Google OAuth 自体を撤退**。再採用時は Supabase Pro+ で `auth.sericia.com` カスタムドメインを先に立ててから（現状 `<ref>.supabase.co` 露出が premium ブランドに不適切） |
| **M4a-OOM hotfix** | ビルド時 OOM 対策（`NODE_OPTIONS=--max-old-space-size=3072` + `NEXT_TELEMETRY_DISABLED=1` を Coolify envs に追加 + Hetzner box に 4GB swap file + `vm.swappiness=10`）| ✅ 完了 | (this commit) | Rule WW で Hetzner API POST `/actions/reset` ハードリセット復旧後、次の storefront ビルドが 3GB ヒープキャップで成功 / 以降は swap が OOM のセーフティネットとして機能 |
| **M4a-Webhook hard** | Crossmint webhook fail-close（本番で `CROSSMINT_WEBHOOK_SECRET` 未設定時は 503 を返す）| ✅ 完了 | `9d12bfb4` | prod で未署名POSTが 200 で受理されるセキュリティリグレッションを封鎖（Rule V） / dev/test は従来通り bypass 可能 / verify-live-storefront.sh で 503 をランチブロッカー表示 |
| **M4a-Header mobile** | ヘッダーUXモバイル修正（国旗横の英語ラベル削除・アカウントアイコンを sm 以下でも表示）| ✅ 完了 | `3208fc19` | `HeaderClient.tsx` / `LocaleSwitcher.tsx` 両方更新 / 本番で検証済み |
| **M4a-Dify v2** | `udify.app` embed を破棄し `/api/dify-chat` サーバープロキシ + カスタム Sericia UI に全面刷新 | ✅ 完了 | `f31e17a0` | `DIFY_SERVICE_API_KEY`（`app-*` 秘密鍵）がクライアントJSに漏れない設計 / 503 時は offline 状態で `hello@sericia.com` 案内表示（Rule V）/ Tailwind `sericia-accent` 等のデザイントークンで統一 / Dify KB の Sericia コンテキストをそのまま活用 |
| **M4a-8 Webhook live** | Crossmint `whsec_Svrn+w...` signing secret を Coolify env + memory に反映 → storefront restart (`kvox6zxs02jinepf2gjdm4z2`) で new container 起動 → webhook **503→401 flip** 確認 → **HMAC SHA-256 署名付き POST で 200 OK** E2E 確認 | ✅ 完了 | (this session) | Rule R 準拠で `whsec_...` をメモリ永続化 / Coolify API 経由で Rule S 完全遵守（ダッシュボード操作ゼロ）/ container env 4 secrets 全部ロード確認（CROSSMINT_WEBHOOK_SECRET:38 / N8N_ESCAL:48 / DIFY:28 / RESEND:36）/ 残り `SLACK_WEBHOOK_URL` は graceful null-return で launch blocker ではない |
| **M4c launch-ready** | ストアオープン直前ブロッカー 7 件を一発 PR で解消（リージョン3層解決 / 特商法 / About / thumbnails / Google OAuth / ENV `japan` / noImplicitAny hotfix）| ✅ 完了 | `492dd9f7` + `7bdab6d2` | ① `lib/medusa.ts` getRegionId が **metadata.slug / name / countries.iso_2** 3キー全部を lowercase index → `"jp"`/`"japan"`/`"JP"` すべて同じ region_id に解決（従来は PDP 404 / `/products` 空の根本原因）② `/tokushoho` — 特商法 section 11 全12項目 bilingual（Paradigm LLC / 050-3120-3706 / 請求あれば遅滞なく開示方式）③ `/about` — Server-rendered ブランド長文 5 H2（Why / How a drop / Producer-share / Limited drops / Who's behind）④ 4商品に Unsplash placeholder thumbnails を **admin API 冪等スクリプト** で適用（`storefront/scripts/upload-product-thumbnails.ts` + `product-thumbnails.json` / 再実行で no-op・brand photography 来たら JSON 差し替え）⑤ Supabase Management API（`sbp_...` PAT）で `external_google_enabled=true` + `site_url=https://sericia.com` + `uri_allow_list` whitelist ⑥ Coolify env PATCH `NEXT_PUBLIC_DEFAULT_REGION=japan`（`jp` から変更・belt & suspenders）⑦ 3-deploy roulette: deploy #1 失敗（`noImplicitAny` on `countries.map` — `tsc --noEmit` をローカルで実行せずに push した代償）→ 1行型注釈で hotfix commit `7bdab6d2` → deploy #2 も失敗だが**build は通過**し Docker `#27 exporting to image` exit 255（host-level transient・コード無罪）→ code 変更なしで retry → deploy #3 (`w81azrqs70v9zd0wa3xagq4v`) 成功（finished @ 2026-04-21T23:28:25Z） | 全 8 URL 200 verified: `/` `/products` `/products/{sencha,miso,shiitake,drop-001-tea-miso-shiitake}` `/tokushoho` `/about` — PDP は `<title>Single-Origin Sencha (Rescued) — Sericia</title>` と `<h1>` が正しくレンダ、`/tokushoho` に `Paradigm LLC / 050-3120-3706 / 特定商取引法`、`/about` に 5 H2 全て出現 |
| **M4c-8 Magic Link switch** | Google OAuth 撤退 → Email Magic Link のみに全面切替（UI 3ファイル書換・ルート5個削除・trigger 契約維持） | ✅ 完了 | `d13d5fc9` | **トリガー**: Google OAuth 同意画面に `<ref>.supabase.co` が露出し premium D2C ブランドに phishing-adjacent に見える（Supabase Custom Domain は Pro+ のみ）/ **実装**: ① `LoginForm.tsx` を `signInWithOtp({ shouldCreateUser: true })` 単体フォームに書換（Google ボタン + password field + magic-link link 全削除）② `SignupForm.tsx` から password field 削除し `options.data: { full_name, country_code }` で `auth.users.raw_user_meta_data` 経由 `sericia_handle_new_user` トリガーへ流す（既存 profile seed 契約を維持）③ `SettingsForm.tsx` から「Update password」フォーム削除 ④ `GoogleSignInButton.tsx` / `/login/magic` / `/reset` 5ファイル削除 ⑤ `middleware.ts` NON_I18N_PREFIXES から `/reset` 除去 / **検証**: `tsc --noEmit` EXIT=0（`.next/types/` stale cache clear 後）/ `/auth/callback` の `exchangeCodeForSession(code)` が OAuth と OTP を同一ハンドラで処理するためバックエンド変更ゼロ / **deploy**: `kg4zr2fggrukailov0x1j2qw`（finished @ 2026-04-22）/ **Live verify**: `/login` 200 + "Send sign-in link" コピー + `type="password"` input 無し + Google ボタン無し / `/signup` 200 / `/reset` 404 / `/login/magic` 404 / `/account/settings` 307 (unauth → `/login` redirect) |
| **M4c-9 Drop #1 UX polish** | 4件のUX磨き込み（特商法locale switch / くるくる開店 loader / Difyクイック返信チップ / Sericia純正SVGプレースホルダー） | ✅ 本番投入完了・検証済（2026-04-22 11:31 JST deploy `r112pa764t8qp5op1dnv40ii` finished / 全アセット & API fanout OK / **Payload admin bootstrap も同セッションで完走**：`admin@sericia.com` user_id=1 動作確認・`POST /cms/api/users/login` 200 + JWT 発行 / `products:upload-thumbnails` applied=4 skipped=0・Store API に `https://sericia.com/placeholders/{sencha,miso,shiitake,drop-001}.svg` 4商品分反映確認済） | `bc6a1fa4` | **① `/tokushoho` locale switch**: `getLocale()` + `getTranslations("tokushoho")` で async server component 化。9 locales の `messages/*.json` に `tokushoho` namespace 6キー追加。Row コンポーネントに `japaneseFirst` prop を追加し locale === "ja" で EN/JA 視覚階層を swap（JA primary 14px ink + EN 11px uppercase）。法的拘束力ある JA 本文は全 Row 内に bilingual で保持（特商法 Art. 11 要件）/ **② LuxuryLoader くるくる開店**: sessionStorage gate 撤廃（毎 full-load で発動）。鮮 hanko seal が 720°回転しながら scale 0.2→1 で着地（くるくる）→ wordmark/rule/tagline フェードイン → 紙色 noren カーテンが中央縫い目から左右に引き分けて page を露出（開店）。`cubic-bezier(0.65, 0, 0.35, 1)` emphasized-decelerate で布の重みを表現。`prefers-reduced-motion` respect。`RouteProgress.tsx` にもミニ 鮮 seal を追加し client-side navigation 中は top-right で 900ms/rev 連続回転（全ページ適用要件を SPA route 変化にも拡張）/ **③ DifyChat context-aware chips**: `getQuickReplies(pathname, locale)` で 7 ルート × EN/JA = 14 セット × 4 chips。product detail → アレルゲン/保存法/使い方/産地、drops → 限定数/次回/再販/内容、/tokushoho → 返品/支払/販売者/配送、cart → 送料/日数/ギフト/決済、account → 追跡/未着/履歴/削除、index/home → Drop/国/送料/連絡。`sendMessage(directText?)` に optional 引数を追加し chip click は controlled state をバイパスして直接送信（one-tap UX）。`messages.length === 1` で自動消滅（visitor engagement 後は disappear）/ **④ Sericia純正 SVG プレースホルダー**: Unsplash random を全廃。`public/placeholders/{sencha,miso,shiitake,drop-001}.svg` を新規作成（1200×1200 viewBox / paper-card bg / silk-fibre 横ストローク 12本 / 二重ヘアライン frame / 鮮 hanko seal 右上 / 中央 kanji 440px 茶/味/椎/集 / 下部 romaji Cormorant italic / 大文字 subtitle UJI/KYOTO/OITA/303 UNITS / tagline `RESCUED JAPANESE CRAFT FOOD`）。drop-001 のみ paper-deep `#ebe4d4` bg でヒエラルキー上位を視覚化（Aesop/Le Labo の collection tier）。`scripts/product-thumbnails.json` 4件を Unsplash URL → `https://sericia.com/placeholders/<handle>.svg` に差し替え（`_usage` に「storefront deploy 完了後に `npm run products:upload-thumbnails` 実行」明記）。`ProductGallery.tsx` は plain `<img>` + `// eslint-disable-next-line @next/next/no-img-element` 利用のため `next/image` の `dangerouslyAllowSVG` 不要（vector native render で crisp at every zoom） |
| **M4c-10 CMS hybrid blocks** | Option C Hybrid CMS — Payload `homepage.blocks[]` に story/newsletter renderer 配線。brand skeleton（hero/ticker/footer/product grids）はコード固定のまま editorial middle（Philosophy ↔ TestimonialsWall 間）のみ editor-controlled | ✅ 完了・本番検証済 | `97ee2e4b` (deploy `beshiqjclmhae2bov9o6e35j` finished 2026-04-22 19:30:34) | **新規**: `lib/payload-blocks.ts`（typed fetcher・React `cache()` で 1リクエスト1フェッチ・`depth: 2` で Media resolve・try/catch silent-fallback）/ `components/blocks/StoryBlockRenderer.tsx`（Lexical `<RichText data={body} />` + image 3レイアウト right/left/below・`next/image` aspect-ratio boxes）/ `components/blocks/NewsletterBlockRenderer.tsx`（既存 `<WaitlistForm>` wrapper・editor コピー差替のみ・attribution `source="homepage-newsletter-block"` をサーバー固定で analytics 分離）/ `components/HomepageBlocks.tsx`（server dispatcher・`blockType` switch・hero/drop/testimonialsStrip/pressStrip は**意図的 no-op**で重複レンダ防止）/ `docs/cms-editing-guide.md`（9-section editor runbook: login → blocks panel → Story → Newsletter → no-op 解説 → 10-locale workflow → drafts/autosave → media → troubleshooting）/ **変更**: `app/page.tsx` に `<HomepageBlocks country={country} />` を `id="story"` ↔ `<TestimonialsWall />` 間にスロット / `components/WaitlistForm.tsx` に optional `ctaLabel?: string = "Join"` prop 追加（既存 coded 呼び出しは後方互換・無変更でコンパイル）/ **silent-fallback**: 現状 `_status: draft / blocks count: 0` のため live HTML は pre-deploy と視覚差分ゼロ — editor が `/cms/admin` → Globals → Homepage → Add Story/Newsletter block → Publish で初めて表示 / **型設計**: `Extract<HomepageBlock, { blockType: "story" }>` で 6-variant discriminated union を narrow した `StoryBlockData` / `NewsletterBlockData` を re-export し renderer 側は narrow 型だけ import（`payload-types.ts` の巨大木を全ファイルに引き込まない）/ Rule RR 横展開: AirTabi editorial 中段・Paraful 記事間 CMS section に移植可 |
| **M4b-T2 Aesop polish** | Aesopティアマーケ仕上げ — CinematicHero typewriter × 静物クロスフェード / SakuraFall tsparticles / SocialProofToast + Gate / DropCountdown / PressStrip / TestimonialsWall (Payload sourced) / CouponBanner / ProductsFilterBar (URL-synced サーバー権威型) / AnimatedHeart wishlist / Payload `testimonials` + `articles` 配線 / Arabic (MSA) locale + RTL `dir` wiring / `/products`・`/products/[slug]` PDP リッチ化 | ✅ 完了 | `086396ea` | Tier A ライブラリ全投入（typewriter-effect / tsparticles / embla / auto-animate）/ SocialProofToast は CookieConsent ゲート下で analytics 同意後のみ発火（GDPR 準拠）/ `/products?category=miso` がサーバー権威でレンダ（JS 切でも filter 生存）→ SEO/共有リンクで正しくプレビュー / `lib/payload.ts` + `lib/payload-homepage.ts` で Server Component から read-only 取得 / 9 → 10 locales（ar 追加・`isRtlLocale()` で document `dir="rtl"` 自動切替）/ Tailwind `sakura-fall` keyframes 追加 |
| **M4b-T3-A/D referrals** | 紹介プログラム — `sericia_referrals` + `sericia_referral_redemptions`（pending/issued/revoked 三態ライフサイクル）+ ReferralCookieSetter (first-touch 365d) + ReferralCodeField チップ入力 + CartCheckoutForm 割引適用 + `/account/referrals` ダッシュボード + `/thank-you` シェア CTA + **T3-D reward flip**（ship / admin cancel で pending→issued / revoked） | ✅ 完了 | `24d0a495` | RLS で owner_user_id のみ read / サーバー側で常に code を再検証（client の discount 値は trust せず）/ Medusa 側 `order-placed` subscriber + storefront admin-update + ship route の3経路全部で `flipRewardStatus()` 共有ヘルパ経由 / Rule N DB ベル + Slack fanout / unique (code, referred_email) 制約で self-gaming 封鎖 |
| **M4b-T3-B Web Push PWA** | Service Worker + VAPID 購読 + `/api/push/subscribe` + `/api/push/unsubscribe` + `push_subscriptions` RLS テーブル + offline.html フォールバック + PushOptIn UI | ✅ 完了 | `5b42d60e` | `web-push ^3.6.7` + `@types/web-push ^3.6.4` / Rule J モバイル戦略（メール開封率 20% vs プッシュ 60%+ → 再エンゲージ最優先手段）を基盤として完成。実配信は Drop #2 のカウントダウン通知から段階投入 |
| **M4b-T3-C pSEO briefs** | `pseo_briefs` + `pseo_pages` テーブル + DeepSeek V3 chat helper（システムプロンプト固定プレフィックスで Context Caching 自動ヒット → 実効 $0.014/1M）+ `/api/pseo/generate` + `/api/pseo/publish` + n8n ナイトリー batch（Slack 承認ゲート付き）+ `scripts/seed-pseo-briefs.ts` | ✅ 完了 | `37d5759a` | 記事生成インフラは基盤完成・初期 briefs シード待ち（M5 で 20 記事 sample 投入予定）/ Rule RR 横展開: 同じ DeepSeek V3 cached generator を Paraful / Appexx の pSEO にも転用可 |
| **M4b-T0-A UAT Magic Link** | `scripts/uat-magic-link.ts` — Supabase `admin.generateLink({type:'magiclink'})` でメール配信を介さず 9 check E2E（link 生成 → verify → `/auth/callback` → `sb-*-auth-token` cookie → auth.users + sericia_profiles 行確認 → cleanup on success のみ）+ `docs/uat-magic-link.md` 6 section runbook + `scripts/verify-live-storefront.sh` #8 の Google OAuth 誤アサーション修正（Magic Link form + OAuth 非復活ガード へ反転） | ✅ 完了 | `0b348dd2` | Resend 到達率から独立・CI で回せる / 失敗時は user を DB に残して post-mortem 可能（cleanup-on-success policy）/ `.invalid` TLD で test email が real mailbox に絶対届かない安全策 |
| **M4b-T0-C UAT purchase flow** | `scripts/uat-purchase-flow.ts` — cart → signed webhook → paid の Bridge 側 8 check E2E + `docs/uat-purchase-flow.md` + triple safety interlock（`UAT_ALLOW_DESTRUCTIVE=1` + production URL ブロック + env validation）+ 改竄 body 送信で 401 を期待する HMAC regression guard | ✅ 完了 | `4399ec56` | Crossmint iframe / real card / USDC / webhook auto-delivery は意図的に対象外 — `docs/crossmint-integration.md §5.6 $1 live smoke test` との役割分担を明示 / Rule LL (E2E 必須) |
| **M4b-T0-D Crossmint playbook** | `docs/crossmint-integration.md §5` を 5 行箇条書きから 8 サブセクション運用 playbook に書き換え — §5.1 前提GO判定 / §5.2 Console 切替 / §5.3 env 差し替え / §5.4 コード有効化 / §5.5 Webhook 再登録 / §5.6 $1 スモークテスト / §5.7 ロールバック（サインオフ前に配置）/ §5.8 サインオフゲート + §6 トラブルシューティング 5 行追加 | ✅ 完了 | `ca3319e9` | §5.7 をサインオフ前に置くことで「本番ボタンを押す前に 5 分で戻す exit path が見えている」状態を作る心理設計 / §5.1 で Solana を除外し Polygon を推奨（Tria 非互換が理由）|
| **M5** | pSEO 量産（DeepSeek Context Caching + キーワードリサーチ + 20記事サンプル実投入） | ⏸️ 待機（T3-C 基盤完成済 → あと brief 投入のみ） | — | — |
| **M4b-F1 Cinematic Video Foundation** | Aesop級の動画基盤 — `<CinematicVideo>` 汎用コンポーネント + Payload `homepageCopy.featuredBundle` に video URL 3スロット + 新規 `homepageCopy.interstitial` (Makers↔Philosophy間 full-bleed break) + `makers.items[]` に per-maker videoUrl/posterUrl/tone | ✅ 完了 | (this commit) | **設計**: `storefront/components/CinematicVideo.tsx` — gradient fallback (7 brand tones tea/miso/mushroom/seasoning/paper/ink/drop) + poster-first paint (CLS=0・onCanPlay で video fade-in) + scroll-tied scale 1→1.06 + IntersectionObserver `playWhenInView` (Makersで3本同時 autoplay decoder pressure 回避) + `prefers-reduced-motion` で scale & autoplay を完全停止 (poster静止表示・WCAG 2.2 AA) / **配線**: page.tsx の Drop section 右側 gradient grid → `<CinematicVideo>` 3枚 (col-span-2 4:5 + 2x square) / Makers 3 cards の gradient → `<CinematicVideo>` per maker (tone自動マップ tea/miso/mushroom) / interstitial section は `videoUrl` 設定時のみレンダ (空 = section ごと削除・空の黒帯ゼロ・Aesop restraint) / **空時の見え方**: 全gradient + grain で現状と同等の品で degrade（破壊的変更ゼロ）/ Editor が Payload (Site Settings → Homepage section copy → Featured bundle / Interstitial / Makers item ごと) で URL 入れた瞬間に video 反映 / **型**: `payload-types.ts` の `SiteSetting` interface + `*Select<T>` の両方を手動同期（worktree から `payload generate:types` は DB 接続不可のため）|
| **F35 Crossmint sales activation** | 本番Onramp起動の唯一の残blocker特定 + sales問い合わせ playbook 作成 | ✅ 完了 (this commit) | (this commit) | **2026-04-30 production probe**: storefront コンテナ内から `https://www.crossmint.com/api/2022-06-09/orders` を本物の payload (tokenLocator USDC + recipient.walletAddress = treasury) で叩いた結果、HTTP 400 + `"Onramp is not yet enabled for production use in this project. ... please contact our team at crossmint.com/contact/sales to enable production access."` を確認 / **判定**: SK は valid（無効なら 401）/ scopes は OK（不足なら 403）/ Apple Pay verified + webhook signing healthy → 残るは Crossmint Sales partnerships team の **production Onramp ホワイトリスト承認** 1点 / **新規 doc**: [`docs/crossmint-sales-activation.md`](docs/crossmint-sales-activation.md) — 7セクション（① 現状 / ② なぜ sales でなく support じゃないか / ③ sales フォーム貼り付け用 英文 message body 1枚 / ④ Console pre-flight 4項目 / ⑤ staging E2E は **skip 推奨**（`NEXT_PUBLIC_CROSSMINT_CLIENT_ID` が build-time inline → rebuild 込み 30分で staging 検証付加価値 vs cost が悪い・必要なら server-only probe レシピ別記）/ ⑥ 承認後の本番切替 5分 playbook / ⑦ >3営業日 fallback 3案 ranked by speed (Stripe direct / Stripe Atlas + USDC swap / PayPal Standard) / **launch-go-handoff.md 更新**: Step 1 を旧「Console scopes 5分」から新「Sales Onramp 申請 10分 → 1〜3営業日 SLA」に置換 + Recommended launch sequence を T+0〜T+24h の wall-clock-realistic timeline に rewrite（Day 0 / Day 1-3 review / 承認後 5分 smoke）/ **net wall-clock 評価**: 「store-open intent → 初dollar accepted」は **1〜3営業日 bounded by Crossmint sales SLA**、それ以外は全て waiting period に並列化済み |

### M1 根本原因（完了済）

**/tools/* 500**: `SiteHeader`/`SiteFooter` が async server component として `getTranslations`（server-only）を呼んでいたが、`/tools/*` は `"use client"` のためクライアント境界でクラッシュ。**`useTranslations` hook に切り替え**て解決（`fe30f8c2`）。

**/tools/* 404**: Coolifyが古いビルド（`87c813f4` 以前）をサーブしていた。再デプロイで解消。

**Dify（現行: M4a-Dify v2 / `f31e17a0`）**: `components/DifyChat.tsx` を **自前カスタムUI + `/api/dify-chat` サーバープロキシ** に全面刷新。旧アーキテクチャ（`udify.app/embed.min.js` SDK + iframe fallback / `87782adf`）は破棄した。

**なぜ刷新したか**:
1. **秘密鍵漏洩リスク除去**: Dify の `app-*` キーは Service API の全権限を持つ SECRET。`NEXT_PUBLIC_DIFY_TOKEN` 方式だと `.next/static/chunks/*.js` にバンドルされ全訪問者のDevToolsから見える。サーバープロキシなら `DIFY_SERVICE_API_KEY`（Coolify env・runtime-only）が一度もブラウザに届かない
2. **`udify.app/chatbot/{token}` が 404 を返すようになった**: URL パターン変更 or 公開共有トグル問題。`api.dify.ai/v1/chat-messages` Service API は健全

**構成**:
- `storefront/app/api/dify-chat/route.ts` — Service API プロキシ（Rule V 準拠で secret 未設定時は 503 + `dify_not_configured`）
- `storefront/components/DifyChat.tsx` — カスタム UI（`sericia-accent` / `sericia-paper-card` トークン・Enter で送信・Shift+Enter で改行・conversation_id 維持・localStorage 匿名 user_id・offline 状態で `hello@sericia.com` 案内）
- Coolify env: `DIFY_SERVICE_API_KEY=app-WnX69EkeJYork2rTBtbB3wnY` / `DIFY_API_URL=https://api.dify.ai/v1`（両方 runtime-only）

### M2 スコープ（完了・`db83336b`）

**目的**: 記事/メディア/テスティモニアル/ヒーロー/サイト設定をエディタが編集可能にする。

**配置**: `/cms/admin`（既存 `/admin/*` スクラッチ管理画面との衝突回避）・route group `app/(payload)/`

**DB**: Supabase Postgres + schemaName `payload`（既存 `app.*` テーブルと衝突回避）

**ロケール**: 現在 **9 言語**（en/ja/de/fr/es/it/ko/zh-TW/**ru**）稼働中。M4 で `ar` を追加して 10 言語化（RTL 有効化）

**インストール済パッケージ** (全て `3.83.0`):
- `payload` / `@payloadcms/next` / `@payloadcms/db-postgres` / `@payloadcms/richtext-lexical` / `@payloadcms/plugin-cloud-storage` / `@payloadcms/storage-s3` / `sharp 0.34.5` / `graphql 16.13.2`

**Collections** (7): Users / Articles / Guides / Tools / Media / Testimonials / PressMentions

**Globals** (2): SiteSettings / Homepage

**Blocks** (6): Hero / Drop / Testimonials / PressStrip / Story / Newsletter

**ビルド検証**: `node ./node_modules/next/dist/bin/next build` 成功・新規ルート 4 個登録:
- `/cms/admin/[[...segments]]` (Payload admin UI、730kB)
- `/cms/api/[...slug]` (REST)
- `/cms/api/graphql` + `/cms/api/graphql-playground`

**既存ルート**（`/admin/*`・`/tools/*`・`/products`・`/guides`・`/journal`等 20+）は全て変更なしでコンパイル成功。

**Coolifyデプロイ手順** (✅ M2-activate `f60042fc` で完了済):
1. ✅ Coolify env 投入済: `PAYLOAD_SECRET` (64-hex) / `DATABASE_URL_PAYLOAD` (`?schema=payload&sslmode=no-verify` 必須) / `PAYLOAD_ADMIN_EMAIL` / `PAYLOAD_ADMIN_PASSWORD`（SUPABASE_S3_* はpost-open）
2. ✅ `docker-entrypoint.sh` が起動時に `payload:migrate` → `payload:bootstrap` を冪等に自動実行（新しいコンテナ再起動でも安全）
3. ✅ `https://sericia.com/cms/admin` ログイン検証完了（HTTP 200 + JWT）
4. 認証情報は `~/.claude/projects/C--Users-apple-OneDrive-Desktop-sericiacom/memory/reference_api_keys.md` 参照

**既知の留意点**:
- Windowsビルドは `node ./node_modules/next/dist/bin/next build` 直呼び必要（`npm run build` の cmd.exe PATH 問題）。Linux/Coolifyでは問題なし
- `S3` プラグインは `SUPABASE_S3_*` 4変数揃って有効化。未設定時はローカルディスクにフォールバック
- Next.js 15.1.3 で `turbopack` 警告（無害・15.2+で解消予定）

### M3 スコープ（完了・`46384141` + `6737fd61` / 2026-04-21）

**目的**: Medusa v2 Admin を本番稼働させ、商品・注文・在庫・割引・配送を集中管理。

**配置**: `api.sericia.com/app` (Coolify Hetzner CPX22 / UUID `wl8ke5lf6rxjoepi058qv89u`)

**リソース**:
- Coolify project `qnry7poqtz364qhgupfq4c0k`
- Postgres `h128il6uh7sxdkb5s3w0vuz7` / Redis `yau9i5yafa98tc8dm8ag5kmp`

**Seed 実績** (idempotent `medusa-backend/src/scripts/seed.ts`):
- **9 regions**: JP / US / EU (×11 countries) / GB / CA / AU (×2) / SG / HK / ME (×6)
- **4 products**: sencha / miso / shiitake 単体 + `drop-001` bundle
- **7 SKUs × 100 units** @ Tokyo Fulfillment stock location
- **EMS Worldwide** shipping profile + shipping options
- Default Sericia sales channel + publishable API key
- Admin: `admin@sericia.com`

**検証 (全 200)**:
| Endpoint | 結果 |
|---------|------|
| `GET /health` | 200 |
| `GET /store/regions` (pk 認証) | 200 / 9 regions |
| `GET /store/products` (pk 認証) | 200 / 4 products |
| `POST /auth/user/emailpass` | 200 + JWT |
| `GET /admin/inventory-items` (bearer) | 200 / 7 SKUs × 100 stock |

**クレデンシャル**: `~/.claude/projects/C--Users-apple-OneDrive-Desktop-sericiacom/memory/reference_api_keys.md` に永続保存済（R ルール準拠）

**Storefront 接続用 env vars** (Coolify Storefront に要設定):
```
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.sericia.com
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_3cbe523eed266eb8eead0a6d75841c341ddc63faa31275c37b7e025b1c64798e
NEXT_PUBLIC_DEFAULT_REGION=jp
```

**Postmortem (Medusa v2.4 learnings)**:
1. `shipping_profile_id` は **もはや `product` テーブルに存在しない**（v2.4で削除）。`createLinksWorkflow` で商品作成後に module link を張る必要あり
2. `createLinksWorkflow` は (product ↔ shipping_profile) ペアの **リンク登録が事前に必要**。デフォルトでは Medusa は登録しないため、`medusa-backend/src/links/product-shipping-profile.ts` に `defineLink(ProductModule.linkable.product, FulfillmentModule.linkable.shippingProfile)` を追加

### M4a-1 スコープ（完了・`40d7b9e6` + `f858ac5c` / 2026-04-21）

**目的**: storefront の商品一覧/詳細/検索インデックスの **データソースを Supabase `sericia_products` から Medusa v2 Store API に完全切替**する。cart-store が保持する `productId` は Medusa `prod_01K...` id に切替わるため、以降追加される checkout 経路も Medusa cart API を前提に設計できる。

**実装**:
- `storefront/lib/medusa.ts` 新規: `@medusajs/js-sdk@2.4.0` singleton ＋ region slug→region_id resolver (1h Next fetch cache)。env guard (`NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` 未設定時は console.error でCoolifyログに可視化、silent 空配列化は避ける — rule V 準拠)
- `storefront/lib/products-medusa.ts` 新規: Medusa Store API から `Product` 型形状で fetch する shim。3 関数（`listActiveProducts` / `getProductBySlug` / `getProductsByIds`）を実装し、variants から cheapest price を選出・images は thumbnail 先頭 + gallery、weight/stock も Medusa 由来に統一
- `storefront/lib/products.ts` を **facade に転換**: `Product` 型 + `categoryLabel` は canonical 定義としてここに残し、fetcher は `./products-medusa` から re-export。consumer 4 箇所（`app/products/page.tsx` / `app/products/[slug]/page.tsx` / `app/page.tsx` / `app/api/products/search-index/route.ts`）は import 文無変更のまま Medusa データで稼働
- `medusa-backend/src/scripts/categorize-products.ts` 新規: 4 top-level product_category（tea/miso/mushroom/seasoning）を冪等生成し、seed の4製品を紐付け。新規環境・DB リセット時の再現性を担保

**カテゴリ戦略 (B: category handle)**:
| product handle | category handle | Medusa ID |
|---------------|----------------|-----------|
| `product-sencha` | `tea` | `pcat_01KPQRFNWAVKCYN8YBPH0RXGBK` |
| `product-miso` | `miso` | `pcat_01KPQRFQ53QN8TBER8Z9J3343A` |
| `product-shiitake` | `mushroom` | `pcat_01KPQRFRD5C0JXVJ5VQ7430QH3` |
| `drop-001-tea-miso-shiitake` | `seasoning` | `pcat_01KPQRFSN1Q6GPWDEV7A4JDKMF` *(仮置・専用"drops"カテゴリ検討余地)* |

`inferCategory()` は categories[0].handle → 4-enum 変換、fallback として handle keyword match（新管理画面追加商品がカテゴリ未設定でも UI に現れる安全網）

**Coolify Storefront に必須の env vars**:
```
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.sericia.com
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_3cbe523eed266eb8eead0a6d75841c341ddc63faa31275c37b7e025b1c64798e
NEXT_PUBLIC_DEFAULT_REGION=jp
```

未設定のままデプロイ → storefront の商品一覧は空になる（env guard で console.error が Coolify ログに流れる）。設定後に再デプロイ必須。

**残件（M4a-2）**: `/api/orders/create-cart` は依然として Supabase `sericia_products` を参照（checkout 経路は未移行）。admin UI 3 ページも同じ。カート→決済を Medusa `sdk.store.cart.*` + `createPaymentCollection` → Stripe 経由に rewrite する作業を M4a-2 として切り出し

### 2026-04-21 i18n ホットフィックス（完了・`302f037b` + `874a903d`）

ユーザー指摘による本番UX修正3点を M3 稼働中に差し込みで対応:

1. **🇬🇧 → 🇺🇸 切替** (`302f037b`): LocaleSwitcher の `en` ロケールが 🇬🇧 に固定されていて US ユーザーを視覚的に疎外していた。Sericia は `en` ロケール1つで US+UK+CA+AU+SG+HK を hreflang 経由でサーブする設計のため、最大市場の🇺🇸を採用。ラベルも "EN" → "English" に変更してネイティブ表記（日本語/Deutsch/Español等）と統一
2. **Windows 国旗絵文字レンダリング修正** (`874a903d`): Windows の Segoe UI Emoji が Regional Indicator Symbol を描画拒否し "US"/"JP" 等のテキスト2文字で表示されていた問題。`flag-icons@^7.5.0` の SVG スプライトCSS を導入（`app/globals.css` で import）、`<span class="fi fi-*" />` でクロスプラットフォーム描画。国旗は 18×14 (trigger) / 22×16 (dropdown) + 0.5px ink border-shadow でラグジュアリー仕上げ
3. **🇷🇺 Russian ロケール追加** (`874a903d`): 145M ネイティブ・top-10 e-commerce 市場・日本クラフト食品（抹茶/味噌/椎茸）との文化的親和性が高いロシア語圏を追加。`messages/ru.json` (en.json 1:1 スキーマ・完全ネイティブ翻訳) + `routing.ts`/`middleware.ts` LOCALES + `accountGuard` regex + `app/layout.tsx` hreflang (`ru-RU` + 不足していた `ja-JP`/`ko-KR`/`zh-TW`/`es-ES`/`it-IT` も追加)

### M4 スコープ（待機中・要件確定済）

`M2`+`M3` 完了後に以下を統合:

1. **記事・固定ページ・ツール 全ページ共通サイドバー**（2026-04-21 ユーザー指示）
   - 現在 `ContentSidebar` は 4 新ツール + `/journal/[slug]` + `/guides/[country]/[product]` のみ
   - 要追加: `/tools/shelf-life` `/tools/miso-finder` `/tools/matcha-grade` `/tools/ems-calculator` / `/tools`(index) / `/journal`(index) / `/guides` / `/guides/[country]` / `/privacy` / `/terms` / `/refund` / `/shipping`
   - 共通 layout（例: `app/(with-sidebar)/layout.tsx` route group）で一度だけ定義してDRY化

2. **Aesop シネマティックヒーロー** — 背景動画（Payload Media 経由で差し替え可能）・スクロール連動ズームアウト・paper-cream 配色維持

3. **日本らしい演出** — 桜が散るパーティクル（tsparticles・prefers-reduced-motion尊重）・ウィッシュリストハート赤塗り（`fill-red-500` + framer-motion bounce）

4. **マーケティング（品よく）**:
   - 初回クーポン（-10% first order・静的バナー・popupなし）
   - ドロップカウントダウンタイマー（ホーム + PDP、`react-countdown`）
   - "Most requested" ランキング（Medusa 売上 top 3）
   - `<social-proof>` トースト（Sonner、最近の購入地域表示）
   - ❌ 採用しない: 派手な割引スタンプ / 強制ポップアップ / 恐怖系タイマー

5. **PLG/UGC バイラル**:
   - 15-20 seeded testimonials（Payload Testimonials 経由）
   - "As seen in" プレスストリップ（Payload PressMentions）
   - 紹介プログラム（refer-a-friend → 次注文 $10 OFF）
   - `#SericiaDrop` ハッシュタグ CTA

6. **カテゴリー/タグソート** — 商品一覧に category chips + sort dropdown（URL sync `?category=&sort=`）

7. **pUtility 拡充** — 5 新ツール + 記事内埋め込み（ContentSidebar / 記事中 `<ToolEmbed>` blocks）

8. **アラビア語（ar）** — UAE/サウジ/カタール向け RTL 対応（next-intl `as const` + Tailwind `[dir=rtl]`）

9. **PWA** — manifest.json拡充・service-worker.js・web-push基盤（Supabase `push_subscriptions`）

10. **SEO/GEO** — JSON-LD Article/FAQ/Product/Recipe、sitemap auto-gen、hreflang、TL;DR先出し

### M5 スコープ（待機中）

**DeepSeek V3 Context Caching 基盤**（$0.014/1M = 90% OFF）:
- n8n workflow で 1 プロンプト × 1,000 キーワード × 9 言語を自動量産
- Ahrefs/Mangools で月検索100-1,000件のロングテールを収集（徹底リサーチ後）
- 競合（Bokksu / Misfits Market / The Feedfeed 等）のSEOギャップを特定
- 最初に 20 記事サンプルを手動レビューしてプロンプトを固める → その後自動量産
- 記事は Payload `articles` コレクションに投入（ローカライズ 9 言語）

**注意**: やみくもな量産禁止（Googleペナルティリスク）。TL;DR先出し・自社統計・一次データ・Recipe Schema 完備で GEO（AI検索）評価も狙う。

### 共通サイドバー仕様（M4 で実装）

```tsx
// app/(with-sidebar)/layout.tsx
<div className="mx-auto max-w-7xl lg:grid lg:grid-cols-[1fr_300px] lg:gap-12">
  <main className="min-w-0">{children}</main>
  <aside className="hidden lg:block sticky top-24 h-fit">
    <ContentSidebar />
  </aside>
</div>
```

**ContentSidebar セクション**:
1. **Tools**（ツール一覧リンク・現在ページハイライト）
2. **Guides**（国別配送ガイド）
3. **Shop**（Most requested + Drop #1 CTA）
4. **Newsletter**（メール登録）
5. **Journal**（最近の記事 3件）

モバイル: hidden（下部タブで代替・タッチしやすい単一カラム）

