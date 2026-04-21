# Sericia — プロジェクトコンテキスト

## 📊 進捗ダッシュボード（目次）

| 進捗 | # | セクション | 状態メモ |
|------|---|-----------|---------|
| ★★★★☆ | 1 | [🎯 事業概要](#s1) | 設計確定 |
| ★★★☆☆ | 2 | [🏆 競合・差別化](#s2) | Bokksu/Misfits Market比較済み |
| ★★★★☆ | 3 | [💰 ビジネスモデル](#s3) | 利益率・価格設計確定 |
| ★★☆☆☆ | 4 | [📊 財務KPI](#s4) | 粗利試算あり、目標KPI未設定 |
| ★★★☆☆ | 5 | [📈 ロードマップ](#s5) | Phase 1〜3定義済み |
| ☆☆☆☆☆ | 6 | [⚖️ 法的リスク](#s6) | 未着手 |
| ★★★★★ | 7 | [🗺️ プロダクト設計](#s7) | ラグジュアリーUX（Aesop/LV級）実装完了・カートドロワー/カスタムカーソル/Fuse検索/ウィッシュリスト/PDPアコーディオン稼働 |
| ★★★★☆ | 8 | [⚙️ 技術設計](#s8) | Next.js 15 + Supabase + Framer Motion + Lenis + vaul + Fuse.js + Embla 完成・Coolifyデプロイ稼働 |
| ★★★☆☆ | 9 | [📣 GTM・集客](#s9) | Reddit戦略・SNS設計済み |
| ★★☆☆☆ | 10 | [🖥️ 運用](#s10) | 環境変数未設定 |
| ★★★★☆ | 11 | [💴 経費・収益シミュ](#s11) | 利益率計算済み |
| ★★☆☆☆ | 12 | [🌐 ドメイン・商標](#s12) | sericia.com取得予定 |
| ★☆☆☆☆ | 13 | [📚 リソース一覧](#s13) | 未整備 |
| ★★★★☆ | 14 | [🧠 壁打ち詳細メモ](#s14) | 仕入れTier/EMS最適化/非採用/Phase戦略 |
| ★★★★☆ | 15 | [🚧 M1-M5 実行トラッカー](#s15) | M1/M2/M3/M4a-1〜5 + Dify hotfix完了 / ストアオープン可（2026-04-21〜） |

⚠️ **要強化**: 6(法的) / 10(運用) / 13(リソース)

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
| **M2** | PayloadCMS v3 インストール（7 collections + 2 globals + 6 blocks） | ✅ 完了 | `db83336b` | ビルド成功・要Coolify env 設定 + migrate + bootstrap |
| **M3** | Medusa v2 起動（9 regions + 4 products + Coolifyデプロイ） | ✅ 完了 | `46384141`, `6737fd61` | `api.sericia.com/health` 200 / `/store/regions` 9件 / `/store/products` 4件 / `/admin` JWT 200 |
| **M4a-1** | storefront products facade → Medusa（listing/PDP/search-index の data source 切替 + Strategy B カテゴリ紐付け 4 products） | ✅ 完了 | `40d7b9e6`, `f858ac5c` | `/store/products` 4件にカテゴリ付き（tea/miso/mushroom/seasoning）/ Coolify storefront の env vars 待ち |
| **M4a-2** | checkout rewrite（`/api/orders/create-cart` を Medusa 価格・在庫ソースに切替 / Crossmint 保持） | ✅ 完了 | (this commit) | `getProductsByIds()` 経由で Medusa が prices + stock の source of truth / sericia_orders は受注台帳として残し Crossmint は無変更 / Slack webhook on order_created 追加（Rule N 準拠） |
| **M4a-Dify hotfix** | 本番 sericia.com に表示されていた "App with code WnX69... not found" トーストを除去（DifyChat.tsx のハードコード fallback token を削除） | ✅ 完了 | (this commit) | `NEXT_PUBLIC_DIFY_TOKEN` 未設定時は何もレンダーしない graceful degradation（Rule V 準拠） |
| **M4a-3** | payment-success 副作用一括（storefront `/api/crossmint-webhook` に Medusa admin 在庫 decrement + Slack paid bell 追加・Crossmint webhook は storefront 直行のためこの経路が単一情報源） | ✅ 完了 | (this commit) | `storefront/lib/medusa-admin.ts`（admin JWT 50分キャッシュ）/ `storefront/lib/slack.ts`（Block Kit DRY）/ webhook 側で `sericia_order_items` から variant を走査し `decrementVariantInventory()` を `Promise.allSettled` で並列実行・失敗時は Slack bell に ⚠️ マーク |
| **M4a-3b** | Medusa subscriber `order-placed.ts` 拡張（admin UI 経由オーダー用セーフティネット）| ⏸️ 待機 | — | post-open 対応。現状 Crossmint → storefront webhook が全オーダー経路 |
| **M4a-4** | n8n ワークフロー JSON コミット（abandoned-cart / low-stock-alert / welcome-email / post-purchase-review）| ✅ 完了 | (this commit) | `n8n-workflows/*.json` × 4 / Supabase RPC `list_abandoned_carts` + `list_review_targets` と schema columns `cart_abandoned_notified` / `review_requested` が未整備（post-open で追加）|
| **M4a-5** | Dify knowledge base 初期シード（shipping / ingredients / refund-policy / faq）| ✅ 完了 | (this commit) | `docs/knowledge-base/*.md` × 4 / Dify の `knowledge_bases:` 配下で `dify/customer-support.yml` から参照 |
| **M4b-f** | Payload 配線 / 共通サイドバー / Aesopヒーロー・桜・赤ハート・マーケ / アラビア語RTL / PWA・SEO | ⏸️ 待機 | — | — |
| **M5** | pSEO 量産基盤（DeepSeek Context Caching + キーワードリサーチ + 20記事サンプル） | ⏸️ 待機 | — | — |

### M1 根本原因（完了済）

**/tools/* 500**: `SiteHeader`/`SiteFooter` が async server component として `getTranslations`（server-only）を呼んでいたが、`/tools/*` は `"use client"` のためクライアント境界でクラッシュ。**`useTranslations` hook に切り替え**て解決（`fe30f8c2`）。

**/tools/* 404**: Coolifyが古いビルド（`87c813f4` 以前）をサーブしていた。再デプロイで解消。

**Dify**: `components/DifyChat.tsx` を2段戦略に刷新（`87782adf`）:
1. `udify.app/embed.min.js` SDK 注入を試行
2. 3秒後に `#dify-chatbot-bubble-button` の存在確認
3. 欠けていれば自前の浮遊ボタン + iframe パネルにフォールバック（CDNブロック/SDKクラッシュ時もUI到達可能）

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

**Coolifyデプロイ手順** (M3完了後に実施):
1. Coolify env に `PAYLOAD_SECRET` (32文字+) / `DATABASE_URL_PAYLOAD` (`?schema=payload` suffix必須) / `PAYLOAD_ADMIN_EMAIL` / `PAYLOAD_ADMIN_PASSWORD` / `SUPABASE_S3_*` をセット
2. `npm run payload:migrate` で `payload` schema作成
3. `npm run payload:bootstrap` で admin ユーザー作成
4. `https://sericia.com/cms/admin` ログイン検証

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

