# Task.md — Sericia (multi-agent edition)

> 永久ルール **TASK / TASK-CLEAN / ANTI-BLOAT / TEAM-DEV** 準拠 (Global CLAUDE.md).
> 新規 Task.md (2026-05-08 TEAM-DEV protocol 適用時に Sericia でも作成).
>
> **🛡️ TEAM-DEV 協業プロトコル** (Claude Code/Codex/Cline/Cursor/Aider/human が並列開発):
> 1. 着手前に必ず `git pull --rebase` で最新化
> 2. 該当 task の **Owner** を自分の名前 + **Lock-since** に時刻 → 即 `commit + push` (atomic lock)
> 3. 4h+ 無 update の lock は **stale** 扱い → 他 agent override 可
> 4. 1 task = 1 feature branch (`agent/{owner}/{slug}`)
> 5. 完了 → Status=✅ DONE / Owner=- / Notes に commit hash → push (lock 解放)
> 詳細 → `~/.claude/knowledge/team-dev-protocol.md`

---

## 🔄 進行中 (multi-agent ロック付き)

| Status | Owner | Lock-since | Branch | Task | Notes |
|--------|-------|-----------|--------|------|-------|
| ⚪ AVAILABLE | - | - | - | (現状なし) | 既存 task は CLAUDE.md s5 ロードマップ参照 |

---

## 📋 未着手 (Multi-agent 取り合い可・優先順)

| Priority | Status | Owner | Task | 工数 | Branch (推奨) |
|----------|--------|-------|------|------|---------------|
| **HIGH** | ⚪ AVAILABLE | - | **F68 — site-wide SSR hydration regression**: served HTML body から `<!DOCTYPE html><html lang>` opening tag が欠落 (curl で 0件 confirmed @ 2026-05-10 17:31 JST). Source `app/(frontend)/layout.tsx:198` は `<html lang={locale} dir={dir}>` を返しており正常 → 疑わしい責任範囲は (a) Cloudflare HTML rewriting / Auto-Minify / Workers (確認: Cache Rules のみで rewrite ルールなし) / (b) Next.js 15.1.3 streaming SSR の chunk emit 順序 / (c) Coolify reverse proxy. 影響: real-browser (Safari/Chrome) は容認・visible UI 正常レンダリング (screenshot で確認済) だが Playwright headless は React #418 + HierarchyRequestError を起こし DOM が tear down される (E2E 自動テスト + 一部 SEO crawler のリスク). Drop #1 ローンチ前に解明推奨. | 2-4h | `agent/{X}/f68-html-doctype` |
| (要起票) | ⚪ AVAILABLE | - | Drop #1 ローンチ準備 | (CLAUDE.md s5 参照) | `agent/{X}/drop1-launch` |
| (要起票) | ⚪ AVAILABLE | - | pSEO Engine 量産 | (POSS Sericia 参照) | `agent/{X}/pseo-engine` |
| (要起票) | ⚪ AVAILABLE | - | Push PWA + Referrals | (POSS Sericia 参照) | `agent/{X}/push-pwa` |
| (要起票) | ⚪ AVAILABLE | - | Arabic RTL 対応 | (i18n RTL) | `agent/{X}/arabic-rtl` |

> 詳細 task は CLAUDE.md s5 (ロードマップ・PMF) + `~/.claude/knowledge/poss-sericia.md` 参照. 着手時にこの Task.md に行を移動して lock 取得.

---

## ✅ 完了 (直近 14 日)

| 完了日 | Owner | Task | Commit |
|--------|-------|------|--------|
| 2026-05-10 | claude-code | **F67-FOLLOWUP — Stripe pk_live typo `O→0` + 本番 LIVE 検証完了** — `Invalid API Key provided: pk_live_***...IUBe` の根本原因が **メモリ保存値 position 68 の 'O'(大文字O) vs '0'(数字) 転記エラー**だったと特定 (Stripe API 直接 probe で `O` 版 → 401 / `0` 版 → 200 + `acct_1RnwKMEU4EEn0nZ8` 解決 を確証). Coolify env PATCH (UUID `ew443ikv9v5gotjom8fjrypm`) で正値投入 + `SEED_PAYMENT_SETTINGS_RESET=1` 一時投入 → fresh deploy `y10fmbyx8ghc0gknsw5u5ra1` finished → reset env 削除完了. **本番 E2E 自動検証 11/11 PASS** (JA strings 5/5 present + EN 漏洩 5/5 absent + `/api/stripe/create-intent` が `jNW0A4` 含む正 pk 返却 + PaymentIntent `pi_3TVShgEU4EEn0nZ81gcrcL7R` 発行成功 + Playwright で `Invalid API Key` console error 完全消失確認). 別途 site-wide SSR hydration 欠落 regression を発見 → F68 として未着手キューに起票 (real browser tolerant のため F67 検証完了は阻害せず). | (env+infra ops, no commit) |
| 2026-05-10 | claude-code | **F67 — /pay i18n drift 根治 + ハイブリッド CMS+next-intl resolver** — ユーザー報告のスクショ (`/pay/[orderId]` で JA 切替時に header 英語 / widget JA / footer 英語の partial-translation) を根治. 二層原因 ① 8 locale (de/fr/es/it/ko/zh-TW/ru/ar) で `pay` namespace 全文未翻訳 (英語コピペ放置) → 12 keys × 8 locales = 96 翻訳追加 ② Payload PaymentSettings global の `fallbackLocale: "en"` で seeded EN 値が JA/DE/FR を覆い隠していた → `fallbackLocale: false` に変更 + 4 新キー (eyebrow/heading/subhead/confirmation_line_fmt) × 10 locales 追加 + `lib/payment-settings.ts` を hybrid resolver に refactor (CMS > next-intl > hardcoded EN). seed script は localised text fields を空文字 seed に変更し editor の CMS 上書き flexibility は完全保持. 別途 reported Stripe `Invalid API Key pk_live_***...IUBe` は env credential mismatch (sk_live_* と pk_live_* が同 Stripe account 由来かを Coolify 側で要確認) — code 修正不可・operator action として別記載. | `15b611c5` (worktree) → `42ccc257` (main) — deploy `x16yhpqwl662i6de18wtix5u` 監視中 |
| 2026-05-10 | claude-code | **F58–F66 大規模 i18n 完全撲滅 + Stripe primary rail ✅ 本番 LIVE** — 1 セッションで以下全件完遂. ① **F58** Stripe live primary 化 (Crossmint pivot) → webhook + Apple Pay/Google Pay/Link/PayPal 全 active / ② **F59** PaymentElement onReady gate (Pay 押下 race fix) / ③ **F60** PDP accordion + /pay i18n / ④ **F62** E2E audit script v2 / ⑤ **F63** /account/page + /account/addresses + AddressForm i18n / ⑥ **F64** /account/orders + /account/wishlist i18n + 5 toast 翻訳 / ⑦ **F65** /account/orders/[id] + /account/settings + SettingsForm i18n / ⑧ **F66** /account/referrals UI wire-up. **9 customer-facing pages × 10 locales × 170 keys = 1,700 翻訳項目** すべて DeepSeek V4 cached batch で完了 (cost <$0.01 USD). **Final E2E audit: 49/49 PASS / 0 fail** / モバイルヘッダー overflow 修正同梱 / Hetzner OOM exit 255 リトライ自動化 (10 deploy 試行・最終 d10 finished `twey1ecx647yqnjd2bsaseyh`). | `6cddf3e3` (F58) → `c6d12e51` (F59) → `e8f0ff6c` (mobile UI + apiVersion) → `51a73859` (StripeError type) → `7ce06866` (F58 LIVE doc) → `c6d12e51` (F59 onReady) → `20007c22` (F60 i18n) → `f79b63df` (F62 audit) → `957a7ec7` (F63) → `7c3454c7` (F64) → `b43c935a` (F65) → `22c66973` (F66) on main |
| 2026-05-08 | claude-code | **Task.md 新規作成** (TEAM-DEV protocol 適用) | (TEAM-DEV commit) |

> 過去履歴は `git log` 参照. 14 日経過で `docs/handoff-archive/` に自動移動 (post-task-md-auto-archive hook).

---

## 📦 詳細外出し (このファイルから参照)

| 種別 | 参照先 |
|------|--------|
| **TEAM-DEV 協業プロトコル詳細** | `~/.claude/knowledge/team-dev-protocol.md` |
| **CEP / Anti-Bloat / 永久ルール** | `~/.claude/CLAUDE.md` |
| **Sericia 実装ディテール (D2C / 訳あり日本クラフト食品 / Medusa+PayloadCMS+Crossmint+Dify+n8n)** | `~/.claude/knowledge/poss-sericia.md` |
| **業界知識・ノウハウ** | `~/.claude/knowledge/{topic}.md` |

---

## 🔧 環境情報 (毎セッション参照価値あり)

- **ドメイン**: sericia.com
- **スタック**: Medusa v2 + PayloadCMS + Crossmint + Dify + n8n + Push PWA + pSEO Engine + Referrals + Arabic RTL
- **Coolify UUID**: (CLAUDE.md s10-1 参照)
- **DigitalOcean Droplet**: `555590454` (4vCPU/8GB SGP1・appexxme/paradigm-hp と共有)
- **Supabase**: 独立 project (CLAUDE.md s8 参照)
- **Dify**: 🚨 **Cloud 版 api.dify.ai のみ** (DIFY-CLOUD-ONLY 永久ルール)
- **デプロイ**: trigger ≠ 完了 (DEPLOY-VERIFY 永久ルール) / Background poll + auto-retry max 3
