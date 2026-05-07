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
| (要起票) | ⚪ AVAILABLE | - | Drop #1 ローンチ準備 | (CLAUDE.md s5 参照) | `agent/{X}/drop1-launch` |
| (要起票) | ⚪ AVAILABLE | - | pSEO Engine 量産 | (POSS Sericia 参照) | `agent/{X}/pseo-engine` |
| (要起票) | ⚪ AVAILABLE | - | Push PWA + Referrals | (POSS Sericia 参照) | `agent/{X}/push-pwa` |
| (要起票) | ⚪ AVAILABLE | - | Arabic RTL 対応 | (i18n RTL) | `agent/{X}/arabic-rtl` |

> 詳細 task は CLAUDE.md s5 (ロードマップ・PMF) + `~/.claude/knowledge/poss-sericia.md` 参照. 着手時にこの Task.md に行を移動して lock 取得.

---

## ✅ 完了 (直近 14 日)

| 完了日 | Owner | Task | Commit |
|--------|-------|------|--------|
| 2026-05-08 | claude-code | **Task.md 新規作成** (TEAM-DEV protocol 適用) | (本コミット) |

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
