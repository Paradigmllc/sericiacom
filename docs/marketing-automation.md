# Sericia マーケティング自動化 設計書

#### 📋 目次

| # | セクション |
|---|-----------|
| 1 | [<a id="ma-principles"></a>基本原則](#1-基本原則) |
| 2 | [<a id="ma-stack"></a>採用スタック](#2-採用スタック) |
| 3 | [<a id="ma-funnel"></a>ファネル全体像](#3-ファネル全体像) |
| 4 | [<a id="ma-acquisition"></a>①獲得（Acquisition）自動化](#4-獲得acquisition自動化) |
| 5 | [<a id="ma-waitlist"></a>②Waitlist→LaunchコンバージョンLoop](#5-waitlistlaunchコンバージョンloop) |
| 6 | [<a id="ma-transactional"></a>③取引メール（order → shipped → delivered）](#6-取引メールorder--shipped--delivered) |
| 7 | [<a id="ma-retention"></a>④リテンション・再購入](#7-リテンション再購入) |
| 8 | [<a id="ma-referral"></a>⑤紹介・バイラル](#8-紹介バイラル) |
| 9 | [<a id="ma-recovery"></a>⑥カート放棄・Waitlist無反応リカバリ](#9-カート放棄waitlist無反応リカバリ) |
| 10 | [<a id="ma-social"></a>⑦SNS投稿自動化（Postiz）](#10-sns投稿自動化postiz) |
| 11 | [<a id="ma-pseo"></a>⑧pSEO継続生成・再クロール促進](#11-pseo継続生成再クロール促進) |
| 12 | [<a id="ma-dashboard"></a>⑨KPIダッシュボード](#12-kpiダッシュボード) |
| 13 | [<a id="ma-workflows"></a>n8nワークフロー一覧](#13-n8nワークフロー一覧) |
| 14 | [<a id="ma-env"></a>必要な環境変数](#14-必要な環境変数) |

---

## 1. 基本原則

1. **人は介在しない**。全てのマーケティング運用はn8n × Dify × DeepSeek V3で自立実行。人間は意思決定のみ（drop開始/中止・価格変更・クレーム返答）
2. **1つのイベント＝1つのワークフロー**。Supabase `sericia_events` テーブルがSingle Source of Truth。全イベントに対してn8nが自動発火
3. **コストは限界費用ベース**。DeepSeek Context Caching（90%OFF・$0.014/1M入力）で固定プロンプト+変数のpSEO/コピー生成は実質タダ
4. **CLG × PLG × pSEOの三位一体**。SEO（guides 64ページ）で検索流入→Waitlist→Drop購入→UGC/紹介→バイラル→再びSEO経由で流入強化の正のループ
5. **測定不能な施策は打たない**。PostHog + Supabase `sericia_events` でアトリビューションを取り、ROAS非黒字の施策は72hで停止

---

## 2. 採用スタック

| 層 | 採用 | 代替検討 |
|----|------|---------|
| CDP / イベントストア | Supabase `sericia_events` + PostHog | Segment不要 |
| ワークフロー | n8n (appexx.me OSS) | Zapier不要 |
| AI判断・コピー生成 | Dify Cloud + DeepSeek V3 (Context Caching) | GPT-4o mini代替可 |
| メール配信 | Resend (`contact@sericia.com`) | 月3,000通以内は無料枠 |
| SNS一斉配信 | Postiz（appexxmeのAPI流用・SNS開設後発動） | Buffer不要 |
| チャット／一次対応 | Dify右下常設（全ページ） | Intercom不要 |
| 検索・LLMO対応 | `llms.txt` + JSON-LD | ― |
| アフィリエイト（L1流入時） | Rakuten Affiliate ID内蔵 | Impact不要 |
| 画像生成 | ComfyUI on Vast.ai RTX 4090 | Midjourney不要 |
| 分析ダッシュボード | Supabase SQL View + Lovable/Retoolダッシュ or Grafana | Mixpanel不要 |

---

## 3. ファネル全体像

```
┌──────────────────────────────────────────────────────────────┐
│  SEO (64 guides) · GEO (llms.txt) · Reddit · SNS · pSEO      │
│  ↓                                                            │
│  Landing (sericia.com)                                       │
│  ↓              ↓                                             │
│  Waitlist   →   Checkout → Pay → Paid → Shipped → Delivered  │
│  ↓                                  ↓                         │
│  Nurture email    Order confirmation → Shipping → Review     │
│  (Drop preview)   → UGC photo request → Referral code        │
│  ↓                                                            │
│  Next drop reminder (24h before public)                      │
│  ↓                                                            │
│  Re-purchase (drop #N+1) · Referral share                    │
└──────────────────────────────────────────────────────────────┘
```

主要KPI5つ:
- Waitlist joins/week
- Drop sell-through time (minutes to sold-out)
- CVR (waitlist → buyer) 目標 15%+
- Repeat rate (drop #N → drop #N+1) 目標 30%+
- Organic traffic share 目標 60%+（≠ 広告依存）

---

## 4. 獲得（Acquisition）自動化

### 4-1. SEO/pSEO（64 guides）
- **自動**: 毎月1日 n8n cron → `scrape-l1-rakuten.mjs` 実行 → 新規商品候補追加 → Dify（DeepSeek V3）で64ページ自動更新 → sitemap更新 → Bing/Google Indexing APIにPing
- **ワークフロー**: `pseo-monthly-refresh.json`

### 4-2. GEO（LLM検索流入）
- `/llms.txt` は実装済み（Perplexity/ChatGPT/Gemini対応）
- **自動**: 新drop公開時にDify → DeepSeek V3で`llms.txt`のFAQ 3問を差し替え → GitHub commit → deploy
- **ワークフロー**: `geo-llms-refresh.json`

### 4-3. Reddit 種まき
- **半自動**: r/JapaneseFood, r/tea, r/matcha, r/fermentation, r/foodrescue 8コミュで新drop公開の1-2日前に「質問形式の投稿」を人力承認付きで自動起案（Dify）→ Slack #all-paradigm に承認ボタン → 承認後 n8n → Reddit API投稿
- **ワークフロー**: `reddit-seeding-approve.json`

### 4-4. SNS（Postiz連携・開設後）
- 詳細は §10

---

## 5. Waitlist→Launchコンバージョン Loop

### 5-1. Waitlist登録時（`waitlist_join` event）
- **即時**: Resendで確認メール「Welcome — next drop in X days」+ 過去ドロップのstory 1件
- **Day 3**: Nurture email 1 「Why we rescue Japanese craft food」 (brand story)
- **Day 7**: Nurture email 2 「Inside a Japanese miso cellar」 (producer profile + photo)
- **新drop公開24h前**: Early-access email 「You're in. Drop #N opens tomorrow 10am JST」
- **新drop公開2h前**: Countdown email 「2 hours until drop #N」
- **新drop公開時**: Launch email 「LIVE: Drop #N — [title]」
- **開封×未購入者のみ**: 6h後 reminder 「Still 12/50 left」
- **売切後**: Sold-out email 「Drop #N sold out in X minutes. Next drop Y days」

### 5-2. ワークフロー
`n8n-workflows/waitlist-nurture.json`:
- Supabase `sericia_waitlist` INSERT trigger (webhook from /api/waitlist)
- Branch: Country/Locale による本文分岐（DeepSeek V3で動的翻訳 + Context Caching）
- Schedule node: Day3, Day7, drop-24h, drop-2h, drop-launch
- Resend API呼び出し
- 開封・クリックを Resend webhook → `sericia_events` に記録

### 5-3. 配信停止
- 全メールに1-click unsubscribe（Resendのbuilt-in List-Unsubscribe header）
- Unsubscribe → `sericia_waitlist.unsubscribed = true` 更新

---

## 6. 取引メール（order → shipped → delivered）

| タイミング | Event | メール内容 | 送信元 |
|---------|-------|----------|-------|
| 決済成功 | `order_paid` (crossmint webhook) | 注文確認 + order ID + 予定到着日 | Crossmint webhook → Resend（実装済み） |
| 発送 | `order_shipped` (手動 or EMS API) | EMS追跡番号 + tracking link | n8n `order-shipped.json` |
| 配達完了 | `order_delivered` (EMS API polling) | UGC写真依頼 + Google Review CTA | n8n `order-delivered.json` |
| 配達+3日 | `review_request` | 味の感想 + Trustpilot/InstagramタグCTA | n8n `review-request.json` |
| 配達+14日 | `next_drop_teaser` | 次回drop の producer teaser + 友達紹介コード | n8n `post-delivery-nurture.json` |

**発送追跡自動化**:
- `order-shipped.json` → 毎時EMS tracking API（17track.net / Shippo）polling
- status変化時に `sericia_events` INSERT + メール配信

---

## 7. リテンション・再購入

### 7-1. セグメント分け
- **Champions**: 2drops以上購入 → 新drop公開48h前に限定Early-early-access
- **First-timers**: 1drop購入 → 「次回drop 10% off for friends」紹介コード配布
- **Window shoppers**: Waitlist登録のみ → Drop毎にNurtureシリーズ配信
- **Churned**: 過去Drop購入後90日未アクション → 「we miss you」+ producer new video

### 7-2. 実装
- `sericia_orders` + `sericia_waitlist` の複合SQLでセグメントView作成
- n8n cron 週1回でセグメントをDifyに渡し、DeepSeek V3でセグメント別コピー自動生成→Resend送信
- **ワークフロー**: `lifecycle-weekly.json`

---

## 8. 紹介・バイラル

### 8-1. 紹介コード発行（paid後自動）
- `order_paid` → n8nがユニーク`REF-XXXX`コード発行 → `sericia_referrals` テーブルに記録 → 次回drop時のメールに埋込
- 紹介された側：$10 off / 紹介した側：次回drop $15 off（両者得）

### 8-2. UGC促進
- `order_delivered` + 3日 → Dify自動メール「Share your drop on Instagram with #SericiaDrop → get featured + $10 credit」
- Instagram Graph API で `#SericiaDrop` を24hおきにスクレイプ → Dify で審査 → Slack承認 → 承認後 Postizで公式アカウント転載 + 送信者にクレジット発行

### 8-3. テーブル追加（Phase 2）
```sql
create table sericia_referrals (
  code text primary key,
  referrer_order_id uuid references sericia_orders(id),
  referred_order_id uuid references sericia_orders(id),
  credit_issued_usd integer,
  created_at timestamptz default now()
);
```

---

## 9. カート放棄・Waitlist無反応リカバリ

### 9-1. カート放棄（`/checkout` 到達したが `order_created` なし）
- 30分後メール「Forgot something? Your drop is still reserved for 24h」
- 24h後メール「Last call — drop has X/50 left」
- 実装: PostHog `$pageview path=/checkout` → n8n → Resend（PostHogでメール取得できないので、フォームの`onBlur`でemailを事前送信 → `cart_abandoned` event INSERT）

### 9-2. Waitlist無反応（3通連続未開封）
- Dify に「どういうコピーなら開封するか」をA/Bテスト生成させる
- 件名を自動再最適化（DeepSeek V3がcontext cachingで低コスト量産）

---

## 10. SNS投稿自動化（Postiz）

> **発動条件**: Sericia のSNSアカウント（X / Instagram / TikTok / Threads / Bluesky / Pinterest）が開設され、Postizで接続完了した時点で起動。詳細は `~/.claude/projects/*/memory/project_sericia_postiz.md`

### 10-1. トリガー
- **New drop公開時**: `drop_launched` event → n8n → 6媒体同時投稿
- **Producer story公開時**: 週2回、producer-of-the-week紹介
- **Review/UGC共有**: Instagram等で `#SericiaDrop` 取得した投稿を公式アカウントで転載

### 10-2. コピー生成
- DeepSeek V3 + Context Caching（固定のブランドトーン + 変数）
- X: 260字 + リンク
- Instagram: 画像4枚（ComfyUI生成OGP + producer photo）+ ハッシュタグ15個
- TikTok: 15秒動画（ComfyUI video pipeline + 字幕）
- Threads/Bluesky: 短文5個スレッド
- Pinterest: 画像1枚 + 商品詳細 + URL

### 10-3. ワークフロー
`n8n-workflows/postiz-broadcast.json`（設計済み・待機中）

---

## 11. pSEO継続生成・再クロール促進

### 11-1. 月次リフレッシュ
- 毎月1日 03:00 JST
- `scrape-l1-rakuten.mjs` → L2 KURADASHI / L3 47club → `sericia_candidates` 更新
- Dify → 既存64 guidesの statsブロック（producer count, avg saved food kg）を最新値で更新
- `ogp_url` を ComfyUI で再生成（Vast.ai RTX 4090 serverless）

### 11-2. Google/Bing Ping
- 更新後に `https://www.google.com/ping?sitemap=https://sericia.com/sitemap.xml` + Bing URL Submission API
- IndexNow対応: `/indexnow-key.txt` 配置 + Bingへの即時URL通知

### 11-3. Competitor rank watch
- Ahrefs API or Serpapi で「japanese sencha shipping to [country]」等50KWをwatch
- 順位変動 > 5位 で Slack通知 + Dify が改善コピー提案

---

## 12. KPIダッシュボード

### 12-1. Supabase View（毎夜再集計）
```sql
create or replace view sericia_kpi_daily as
select
  date_trunc('day', created_at) as day,
  count(*) filter (where event_name = 'waitlist_join') as waitlist_joins,
  count(*) filter (where event_name = 'order_created') as carts,
  count(*) filter (where event_name = 'order_paid') as orders,
  count(distinct distinct_id) filter (where event_name = 'order_paid') as unique_buyers,
  sum((properties->>'amount_usd')::int) filter (where event_name = 'order_paid') as revenue_usd
from sericia_events
group by 1
order by 1 desc;
```

### 12-2. Slack週次レポート
- 毎週月曜 09:00 JST n8n cron → Supabase SQL → Slack `#all-paradigm` にBlock Kit表
- 前週比＋主要イベントログ（drops完売時間 / 最高売上日 / ワーストCVR経路）

### 12-3. アラート
- `orders_last_24h = 0 AND drop_active = true` → Slack @channel
- `waitlist_join_rate < 0.5x 7-day-average` → Slack通知
- `cart_abandoned_rate > 60%` → Slack + Dify自動改善提案

---

## 13. n8nワークフロー一覧（実装順・優先度）

| # | ファイル | 優先度 | 説明 |
|---|---------|-------|------|
| 1 | `order-shipped.json` | P0 | EMS tracking取得 + shipped email |
| 2 | `waitlist-nurture.json` | P0 | 5段階ドリップ |
| 3 | `order-delivered.json` | P1 | 配達完了 + review request |
| 4 | `post-delivery-nurture.json` | P1 | 14日後次drop teaser |
| 5 | `cart-abandoned.json` | P1 | 30分/24h リマインダー |
| 6 | `pseo-monthly-refresh.json` | P1 | 64 guides月次更新 |
| 7 | `kpi-weekly-slack.json` | P1 | 週次Slackレポート |
| 8 | `drop-launch-broadcast.json` | P2 | Drop公開時Waitlist一斉配信 |
| 9 | `reddit-seeding-approve.json` | P2 | Reddit投稿人力承認 |
| 10 | `lifecycle-weekly.json` | P2 | セグメント別週次配信 |
| 11 | `postiz-broadcast.json` | P3 | SNS開設後に起動 |
| 12 | `geo-llms-refresh.json` | P3 | llms.txt月次更新 |

各JSONは `sericiacom/n8n-workflows/` 配下に置き、appexx.me の n8n にimport

---

## 14. 必要な環境変数

Storefront (Coolify):
```
RESEND_API_KEY              # 実装済み
CROSSMINT_SERVER_API_KEY    # 要取得（production）
CROSSMINT_WEBHOOK_SECRET    # 要取得（production）
NEXT_PUBLIC_CROSSMINT_CLIENT_ID  # 要取得
NEXT_PUBLIC_POSTHOG_KEY     # 要取得（PostHog Cloud Free）
NEXT_PUBLIC_POSTHOG_HOST    # https://us.i.posthog.com
N8N_WAITLIST_WEBHOOK        # 要設定（waitlist-nurture.json import後）
N8N_ESCALATION_WEBHOOK      # 要設定（escalation-router.json import後）
RAKUTEN_APP_ID              # 実装済み
RAKUTEN_ACCESS_KEY          # 実装済み
RAKUTEN_AFFILIATE_ID        # 実装済み
SUPABASE_SERVICE_ROLE_KEY   # 実装済み
```

n8n (appexx.me) 追加必須:
```
RESEND_API_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
DEEPSEEK_API_KEY
DIFY_API_KEY
SLACK_BOT_TOKEN
17TRACK_API_KEY (or shippo)
POSTIZ_API_KEY (SNS開設後)
```

---

## 販売開始チェックリスト（launch前に全てtick）

- [ ] Crossmint production account作成 + API Key取得 → Coolify
- [ ] Crossmint webhook URL登録: `https://sericia.com/api/crossmint-webhook`
- [ ] PostHog Free plan作成 + Project API Key → Coolify
- [ ] Resend sender `contact@sericia.com` verified （完了）
- [ ] /terms, /privacy, /refund, /shipping 全確認 → Paradigm LLC 住所記載チェック
- [ ] `drop-001` の hero_image_url をSupabase更新
- [ ] /sitemap.xml に/checkout/pay/thank-you が除外されているか確認（noindex済）
- [ ] /robots.txt の Disallow に /checkout /pay /thank-you /api を追加
- [ ] waitlist-nurture.json import + 初回テスト送信
- [ ] order-shipped.json import + EMS APIキー設定
- [ ] Google Search Console verified + sitemap submit
- [ ] Google Business Profile 作成（NAP: Paradigm LLC）
- [ ] Reddit公式アカウント作成（r/user/sericia）
- [ ] Email unsubscribe link が機能するか Resend test
- [ ] `sericia_kpi_daily` view作成
- [ ] 初回Reddit投稿用Dify prompt プリセット登録
