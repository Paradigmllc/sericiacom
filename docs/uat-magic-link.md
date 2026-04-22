#### 📋 目次

| # | セクション |
|---|-----------|
| 1 | [<a id="uat-1"></a>目的](#uat-1) |
| 2 | [<a id="uat-2"></a>前提条件](#uat-2) |
| 3 | [<a id="uat-3"></a>実行方法](#uat-3) |
| 4 | [<a id="uat-4"></a>チェック項目（9点）](#uat-4) |
| 5 | [<a id="uat-5"></a>失敗時の調査手順](#uat-5) |
| 6 | [<a id="uat-6"></a>CI統合ガイド](#uat-6) |

---

## <a id="uat-1"></a>1. 目的

`/login` の Magic Link（Email OTP）認証フローを **メール配信を介さず** end-to-end で検証するための UAT スクリプト。`storefront/scripts/uat-magic-link.ts` を参照。

Supabase の `admin.generateLink({ type: 'magiclink' })` がメールで送られるはずの action_link をそのまま返してくれる特性を利用し、Resend の遅延・到達率に依存せず CI でも回せる E2E テストになっている。

**テスト対象**:
- `signInWithOtp({ shouldCreateUser: true })` 相当の Magic Link 生成
- Supabase `/auth/v1/verify` → storefront `/auth/callback?code=XXX` のリダイレクト
- `/auth/callback` の `exchangeCodeForSession()` と `sb-*-auth-token` cookie 発行
- `next` パラメータを尊重した `/account` への最終リダイレクト
- `sericia_handle_new_user` トリガーによる `sericia_profiles` 行の自動作成

**テスト対象外**（意図的にスコープ外）:
- Resend 配信成功率（別SLAの別サービス）
- `/api/auth/welcome` のウェルカムメール送信（fire-and-forget、クリティカルパスではない）
- `/login` ページの実UI（Playwrightの仕事）

---

## <a id="uat-2"></a>2. 前提条件

**環境変数**（shell 環境にセット）:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...              # admin API 必須
STOREFRONT_URL=https://sericia.com            # デフォルト http://localhost:8000
```

**Supabase 側の設定**:
- `Auth → URL Configuration → Redirect URLs` に `STOREFRONT_URL/auth/callback` を登録済みであること
- `Auth → Providers → Email` で Magic Link が有効化されていること
- `sericia_handle_new_user` トリガー（`supabase/migrations/20260422_products.sql`）が本番DBに適用済みであること

**ローカル実行時のみ**:
- storefront を `npm run dev` で起動 (`http://localhost:8000`)

---

## <a id="uat-3"></a>3. 実行方法

```bash
cd storefront
# 本番環境スモークテスト
STOREFRONT_URL=https://sericia.com npm run uat:magic-link

# ローカル開発時
STOREFRONT_URL=http://localhost:8000 npm run uat:magic-link
```

成功時:
```
=== UAT: Magic Link E2E ===
   storefront: https://sericia.com
   test email: uat-magiclink-1735123456789@sericia-test.invalid

  ✅ Magic link generated  — action_link ok
  ✅ Supabase verify redirects to callback  — status=302 location=https://sericia.com/auth/callback?code=…
  ✅ Callback URL points to our storefront  — host=sericia.com expected=sericia.com
  ✅ Callback URL carries ?code  — code=abc12345…
  ✅ /auth/callback returns redirect  — status=307
  ✅ /auth/callback redirects to /account (next param honoured)  — location=https://sericia.com/account
  ✅ Session cookie (sb-*-auth-token) set  — cookie present
  ✅ auth.users row exists  — id=xxxxxxxx…
  ✅ sericia_profiles row created by trigger  — email=uat-magiclink-…@sericia-test.invalid locale=en
  ✅ Test user cleaned up  — deleted uat-magiclink-…@sericia-test.invalid

=== Result: 10 passed / 0 failed ===
```

Exit code: 0 = 全通過 / 1 = 1件以上失敗

---

## <a id="uat-4"></a>4. チェック項目（9点）

| # | 項目 | 失敗時の意味 |
|---|------|-------------|
| 1 | Magic link generated | Service role key が不正、または Supabase admin API が応答なし |
| 2 | Supabase verify redirects to callback | Supabase側で `redirect_to` がallow-listに入っていない |
| 3 | Callback URL points to our storefront | Supabase Auth URL configuration の Site URL 設定ミス |
| 4 | Callback URL carries `?code` | Supabaseの verify エンドポイントが code を発行していない（token 期限切れ等） |
| 5 | /auth/callback returns redirect | `app/auth/callback/route.ts` が 500 を返している（`NEXT_PUBLIC_SUPABASE_ANON_KEY` 未設定等） |
| 6 | /auth/callback redirects to /account | `next` パラメータが無視されている |
| 7 | Session cookie (sb-*-auth-token) set | `exchangeCodeForSession()` が失敗 — code と anon key の不整合 |
| 8 | auth.users row exists | Supabase Auth がユーザーを作成していない（`shouldCreateUser:false` デフォルトに戻った等） |
| 9 | sericia_profiles row created by trigger | `sericia_handle_new_user` トリガーが本番DBに未適用、または `security definer` 実行権限が剥奪されている |

---

## <a id="uat-5"></a>5. 失敗時の調査手順

### 9番（profile trigger 未発火）が失敗する場合

→ 最も頻出の失敗パターン。以下をこの順で確認:

1. 本番DBで直接トリガーの有無を確認:
   ```sql
   select tgname from pg_trigger where tgrelid = 'auth.users'::regclass;
   -- → sericia_on_auth_user_created が返ってくるか
   ```
2. トリガー関数が存在するか:
   ```sql
   select proname, prosecdef from pg_proc where proname = 'sericia_handle_new_user';
   -- → prosecdef=true (security definer) であること
   ```
3. migration `supabase/migrations/20260422_products.sql` が apply 済みか `supabase migration list` で確認

### 5-7番（cookie / redirect 系）が失敗する場合

→ デプロイ直後に出やすい。以下を確認:
- Coolify storefront の `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` が本番プロジェクトのものか（staging キーが混入していると code 交換で失敗）
- Supabase Console → Auth → URL Configuration の Site URL が `https://sericia.com` に設定されているか

### テストユーザーがDBに残ってしまった場合

スクリプトは**失敗時は意図的にクリーンアップしない**（状態検査のため）。手動削除:
```sql
delete from auth.users where email like 'uat-magiclink-%@sericia-test.invalid';
-- sericia_profiles は cascade で自動削除される
```

---

## <a id="uat-6"></a>6. CI統合ガイド

将来 GitHub Actions / n8n cron でデイリー実行する場合:

```yaml
# .github/workflows/uat.yml (参考)
- name: UAT Magic Link E2E
  env:
    NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
    STOREFRONT_URL: https://sericia.com
  run: |
    cd storefront
    npm ci
    npm run uat:magic-link
```

**n8n 版**（既存の `order.succeeded` ワークフロー隣に同居）:
- Cron trigger（毎朝9時JST）→ Execute Command `npm run uat:magic-link`
- 失敗時は Slack `#all-paradigm` に通知（Rule N 準拠）

⚠️ 本番の `SUPABASE_SERVICE_ROLE_KEY` を CI から使うため、secrets 保管は必須。GitHub Secrets / Coolify env / 1Password などから注入し、レポジトリに commit 禁止。
