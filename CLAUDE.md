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
| ★★★★☆ | 7 | [🗺️ プロダクト設計](#s7) | Medusa v2+Next.js確定 |
| ★★★☆☆ | 8 | [⚙️ 技術設計](#s8) | スタック確定・デプロイ設定中 |
| ★★★☆☆ | 9 | [📣 GTM・集客](#s9) | Reddit戦略・SNS設計済み |
| ★★☆☆☆ | 10 | [🖥️ 運用](#s10) | 環境変数未設定 |
| ★★★★☆ | 11 | [💴 経費・収益シミュ](#s11) | 利益率計算済み |
| ★★☆☆☆ | 12 | [🌐 ドメイン・商標](#s12) | sericia.com取得予定 |
| ★☆☆☆☆ | 13 | [📚 リソース一覧](#s13) | 未整備 |

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
