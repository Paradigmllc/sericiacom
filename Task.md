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
| **HIGH** | ⚪ AVAILABLE | - | **F70 — operator action: CF Auto Minify HTML 無効化 (sole definitive fix)**: F69 で root cause 確定済 (curl bypass-CF が proper `<!DOCTYPE html><html lang="en" dir="ltr"...>` を返す vs CF 経由は `<meta charSet>` から start). F69 で試した code workaround (`middleware.ts` で `Cache-Control` に `no-transform` append) は **実効しなかった**: Next.js 15 の page-level handler が middleware の `Cache-Control` を上書きするため. origin response の最終 `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate` には `no-transform` が含まれない (curl で 2026-05-13 確認済). 結論: コードからは fix 不可能 → **operator action only**. 手順: ① sericia.com zone への edit 権限を持つ CF API token (Zone:Settings:Edit) を発行 (`cfut_kHbGH...` は appexx.me scope のみで不可) ② dashboard or API で Auto Minify > HTML を OFF ③ Cache purge ④ `curl https://sericia.com/ \| head -c 100` で `<!DOCTYPE html><html lang=...>` 復活を確認. 完了まで Playwright headless 経由の E2E は React #418 を起こし続ける (実ブラウザは無問題のため Drop #1 ローンチ自体は blocker ではない). | 30min + token 発行 | `agent/{X}/f70-cf-auto-minify` |
| (要起票) | ⚪ AVAILABLE | - | Drop #1 ローンチ準備 | (CLAUDE.md s5 参照) | `agent/{X}/drop1-launch` |
| (要起票) | ⚪ AVAILABLE | - | pSEO Engine 量産 | (POSS Sericia 参照) | `agent/{X}/pseo-engine` |
| (要起票) | ⚪ AVAILABLE | - | Push PWA + Referrals | (POSS Sericia 参照) | `agent/{X}/push-pwa` |
| (要起票) | ⚪ AVAILABLE | - | Arabic RTL 対応 | (i18n RTL) | `agent/{X}/arabic-rtl` |

> 詳細 task は CLAUDE.md s5 (ロードマップ・PMF) + `~/.claude/knowledge/poss-sericia.md` 参照. 着手時にこの Task.md に行を移動して lock 取得.

---

## ✅ 完了 (直近 14 日)

| 完了日 | Owner | Task | Commit |
|--------|-------|------|--------|
| 2026-05-13 | claude-code | **F71b — middleware: remove no-transform cache-control (was blocking CF locale caching)**. `NextResponse.rewrite()` responses (all /ja/* /de/* etc) keep middleware headers through to CF — setting `no-transform` without max-age caused CF to mark all locale pages DYNAMIC. `NextResponse.next()` responses (/) have headers overwritten by page handler, so `no-transform` wasn't reaching CF anyway. Removed the injection entirely: locale pages can now get CF edge cache HIT on repeat visits; F70 (CF Auto Minify HTML disable) remains sole definitive fix for DOCTYPE stripping. | `24834483` (main) |
| 2026-05-13 | claude-code | **F71 — middleware: locale cookie conditional set (CF caching for /ja /de etc)**. `Set-Cookie: NEXT_LOCALE=ja` が毎リクエスト無条件に送出されていた → CF が全 locale-prefix path (/ja/* /de/* 等) を DYNAMIC 扱いしキャッシュ不能だった問題を修正. `req.cookies.get(LOCALE_COOKIE)?.value !== prefixLocale` guard を追加し cookie 値が既に正しければ Set-Cookie header を省略. 初回訪問・locale 切替時は引き続き設定 / リピート訪問は CF edge cache HIT 化 → TTFB 0.07s (vs cache miss ~0.6s). `country` cookie と default locale パスは既に同等 guard を持っていたため統一. | `e09096d1` (main) |
| 2026-05-13 | claude-code | **F69-followup — close remaining i18n gaps**. ContentSidebar.tsx (Shop the story / Drop alerts / Tools / Guides + aria-labels + subscribe toast) / AccountNav.tsx (panel title + nav items + Sign out + signed-out toast, new `common.account_nav.*` namespace with 4 keys × 9 locales via DeepSeek V4 cached batch = $0.000812) / CheckoutForm.tsx legacy (7 labels + 7 placeholders + 4 toasts via shared `cart.checkout_extras.*`). **i18n status**: 220/220 verified keys present across all 10 locales, 0 missing. Customer-facing i18n surface now complete. Remaining hardcoded EN is limited to: admin/* (intentionally English-only), Zod validation messages (low-priority, only on validation failure), `content_sidebar` heading "Reading tools & related" + `Privacy Policy`/`Terms` link text (mostly fine since `/terms` and `/privacy` are localised pages). | `ebd9a5ca` (main) |
| 2026-05-13 | claude-code | **F69 — Performance + i18n comprehensive sweep**. **Perf (4 fixes)**: ① middleware の `supabase.auth.getUser()` を `/account/*` パスに gate (ゲスト全ページ TTFB -100〜300ms) ② middleware の response に `Cache-Control: no-transform` append (F68 root-cause = CF Auto Minify が DOCTYPE+html strip と確証取得 via `curl -k -H "Host: sericia.com" https://46.62.217.172/` 直接 origin probe で proper DOCTYPE 返却を確認) ③ `<DeferredOverlays>` で DifyChat/Analytics/CookieConsent/SocialProofToastGate/ServiceWorkerRegister を `lazy()` + `requestIdleCallback` 2s post-paint mount (TTI -500〜1500ms / 14 eager client components → 5 idle-mounted) ④ Noto Sans JP `preload: false` + locale=ja 以外で CSS variable 省略 (preload signal -110kB on 90% traffic). **i18n sweep (60+ strings × 10 locales)**: 5-pattern grep で hardcoded English を機械的検出 → DeepSeek V4 cached batch で 20 namespaces 翻訳 (8064 cache-hit / 4866 miss / 17324 completion tokens / **$0.0056 total**) → 15+ components wire-up (home/products/PDP/cart/checkout/Waitlist/Footer/NotifyMe/PushOptIn/journal/compare/uses/CartDrawer/BackToTop/AddToCartButton/CartClient). 新 namespaces: `home_sections.spec` / `products.listing_extras` / `pdp.extras` / `journal.listing` / `compare.sections` / `uses.sections` / `forms.{waitlist,footer_subscribe,notify_me,push_optin}` / `cart.checkout_extras` / `common.{sidebar,a11y}`. **CLAUDE.md 圧縮 (CEP rule)**: 95KB → 24KB (75% 削減 / 60KB 目標を大幅クリア)、s14 壁打ちメモ + s15 F1-F69 実行トラッカーを `docs/knowledge/poss-sericia-implementation.md` (78KB) に外出し. **Follow-up**: F70 = CF Auto Minify HTML を dashboard で OFF にする operator action (no-transform header は belt-and-suspenders、確実な fix は zone setting 変更). | (this commit) |
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
