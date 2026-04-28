#!/usr/bin/env node
/**
 * One-shot script: rewrite Supabase auth email templates to remove 鮮 hanko
 * (per F22 brand rule — no CJK characters in brand assets) and replace with
 * the canonical SERICIA wordmark.
 *
 * Affected templates:
 *   - mailer_templates_magic_link_content
 *   - mailer_templates_recovery_content
 *   - mailer_templates_invite_content
 *   - mailer_templates_confirmation_content
 *   - mailer_templates_email_change_content
 *
 * Bilingual content (English primary, Japanese subtitle) is preserved
 * because Sericia's user base is JP-leaning early on but global by design,
 * and Supabase only allows ONE template per email type. Most magic-link
 * customers can read either language; rendering both is safer than picking.
 *
 * Usage:
 *   node scripts/update-supabase-auth-emails.mjs
 */

const PAT = "sbp_e0face68cf51626c08017435248be75d83c591e5";
const REF = "yihdmgtxiqfdgdueolub";
const API = `https://api.supabase.com/v1/projects/${REF}/config/auth`;

// ─── Shared layout ────────────────────────────────────────────────────────
// No 鮮 hanko, no kanji in chrome (per F22 ブランドアセット厳守ルール).
// SERICIA wordmark in Helvetica letter-spaced caps + bilingual body.
function wrap({ heading, body, ctaUrl, ctaLabel, preheader }) {
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>Sericia</title>
</head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:'Noto Sans','Noto Sans JP',Helvetica,Arial,sans-serif;color:#21231d;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#f5f0e8;">${preheader}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f0e8;">
  <tr><td align="center" style="padding:48px 16px;">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border:1px solid #d4cfc4;">
      <tr><td style="padding:40px 40px 24px 40px;border-bottom:1px solid #d4cfc4;text-align:center;">
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:14px;letter-spacing:0.3em;font-weight:300;color:#21231d;">SERICIA</div>
      </td></tr>
      <tr><td style="padding:48px 40px 16px 40px;">
        <h1 style="margin:0 0 24px 0;font-family:'Noto Sans','Noto Sans JP',Helvetica,Arial,sans-serif;font-size:24px;font-weight:400;letter-spacing:-0.005em;line-height:1.25;color:#21231d;">${heading}</h1>
        ${body}
      </td></tr>
      <tr><td style="padding:8px 40px 48px 40px;text-align:center;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
          <tr><td style="background:#21231d;border-radius:0;">
            <a href="${ctaUrl}" target="_blank" style="display:inline-block;padding:16px 44px;color:#f5f0e8;font-family:Helvetica,Arial,sans-serif;font-size:12px;font-weight:400;letter-spacing:0.24em;text-transform:uppercase;text-decoration:none;">${ctaLabel}</a>
          </td></tr>
        </table>
        <p style="margin:20px 0 0;font-family:'Courier New',Courier,monospace;font-size:11px;line-height:1.5;color:#7b7d73;word-break:break-all;text-align:center;"><a href="${ctaUrl}" target="_blank" style="color:#7b7d73;text-decoration:underline;">${ctaUrl}</a></p>
      </td></tr>
      <tr><td style="padding:24px 40px 32px 40px;border-top:1px solid #d4cfc4;text-align:center;">
        <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#7b7d73;">
          <a href="https://sericia.com" target="_blank" style="color:#7b7d73;text-decoration:none;">sericia.com</a> &middot; Kyoto, Japan &middot; EMS Worldwide
        </p>
        <p style="margin:10px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:10px;color:#7b7d73;">&copy; 2026 Sericia. All rights reserved.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ─── Magic link / sign-in ────────────────────────────────────────────────
const MAGIC_LINK = wrap({
  preheader: "Sign in to Sericia — link valid for one hour.",
  heading: "Sign in to Sericia",
  body: `
    <p style="margin:0 0 16px 0;font-size:15px;line-height:1.65;color:#4a4c44;">Click the button below to complete your sign-in. This link is valid for one hour and can only be used once.</p>
    <p style="margin:0 0 0;font-size:14px;line-height:1.65;color:#7b7d73;">下のボタンをクリックしてサインインを完了してください。このリンクは1時間有効で、1回限り使用できます。</p>`,
  ctaUrl: "{{ .ConfirmationURL }}",
  ctaLabel: "Sign in &middot; サインイン",
});

// ─── Account creation confirmation ──────────────────────────────────────
const CONFIRMATION = wrap({
  preheader: "Confirm your Sericia account.",
  heading: "Confirm your account",
  body: `
    <p style="margin:0 0 16px 0;font-size:15px;line-height:1.65;color:#4a4c44;">Welcome to Sericia. Click the button below to confirm your email and activate your account.</p>
    <p style="margin:0 0 0;font-size:14px;line-height:1.65;color:#7b7d73;">Sericia へようこそ。下のボタンをクリックしてメールアドレスを確認し、アカウントを有効化してください。</p>`,
  ctaUrl: "{{ .ConfirmationURL }}",
  ctaLabel: "Confirm &middot; 確認",
});

// ─── Password reset / recovery ───────────────────────────────────────────
const RECOVERY = wrap({
  preheader: "Reset your Sericia password.",
  heading: "Reset your password",
  body: `
    <p style="margin:0 0 16px 0;font-size:15px;line-height:1.65;color:#4a4c44;">Click the button below to set a new password for your Sericia account. This link is valid for one hour.</p>
    <p style="margin:0 0 0;font-size:14px;line-height:1.65;color:#7b7d73;">下のボタンをクリックして、新しいパスワードを設定してください。このリンクは1時間有効です。</p>`,
  ctaUrl: "{{ .ConfirmationURL }}",
  ctaLabel: "Reset password &middot; パスワードを再設定",
});

// ─── Email-change confirmation ───────────────────────────────────────────
const EMAIL_CHANGE = wrap({
  preheader: "Confirm your new email address.",
  heading: "Confirm new email",
  body: `
    <p style="margin:0 0 16px 0;font-size:15px;line-height:1.65;color:#4a4c44;">Confirm this email address to start using it for Sericia sign-in and order receipts.</p>
    <p style="margin:0 0 0;font-size:14px;line-height:1.65;color:#7b7d73;">このメールアドレスで Sericia へのサインインと注文確認メールを受け取れるよう、確認してください。</p>`,
  ctaUrl: "{{ .ConfirmationURL }}",
  ctaLabel: "Confirm email &middot; 確認",
});

// ─── Invite (admin-issued) ───────────────────────────────────────────────
const INVITE = wrap({
  preheader: "You're invited to Sericia.",
  heading: "You're invited",
  body: `
    <p style="margin:0 0 16px 0;font-size:15px;line-height:1.65;color:#4a4c44;">Click the button below to accept the invitation and create your Sericia account.</p>
    <p style="margin:0 0 0;font-size:14px;line-height:1.65;color:#7b7d73;">下のボタンをクリックして招待を受け、Sericia アカウントを作成してください。</p>`,
  ctaUrl: "{{ .ConfirmationURL }}",
  ctaLabel: "Accept invite &middot; 招待を受ける",
});

// ─── PATCH ────────────────────────────────────────────────────────────────
const payload = {
  // Subject lines (also bilingual)
  mailer_subjects_magic_link: "Sign in to Sericia · サインイン",
  mailer_subjects_confirmation: "Confirm your Sericia account · アカウント確認",
  mailer_subjects_recovery: "Reset your Sericia password · パスワード再設定",
  mailer_subjects_email_change: "Confirm new email · 新しいメールアドレスの確認",
  mailer_subjects_invite: "You're invited to Sericia · 招待",

  // HTML templates
  mailer_templates_magic_link_content: MAGIC_LINK,
  mailer_templates_confirmation_content: CONFIRMATION,
  mailer_templates_recovery_content: RECOVERY,
  mailer_templates_email_change_content: EMAIL_CHANGE,
  mailer_templates_invite_content: INVITE,
};

console.log("[supabase-auth-emails] PATCH /config/auth …");
const res = await fetch(API, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${PAT}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});
const text = await res.text();
if (!res.ok) {
  console.error(`[supabase-auth-emails] HTTP ${res.status}: ${text.slice(0, 500)}`);
  process.exit(1);
}
console.log(`[supabase-auth-emails] ✅ updated 5 templates + 5 subjects`);
console.log(`   • magic_link / confirmation / recovery / email_change / invite`);
console.log(`   • removed 鮮 hanko (per F22 brand rule)`);
console.log(`   • SERICIA wordmark only, paper/ink palette, bilingual EN+JP body`);
