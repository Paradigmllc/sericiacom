"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { supabaseBrowser } from "@/lib/supabase-browser";

/**
 * Passwordless sign-in via Supabase Magic Link (Email OTP).
 *
 * Why no Google OAuth / no password here:
 *  - Google OAuth consent screen exposed `<project-ref>.supabase.co` — looked
 *    phishy for a premium D2C brand. Removing it until a custom auth domain
 *    (auth.sericia.com) is provisioned on Supabase Pro+.
 *  - Password auth was dropped alongside to shrink the attack surface
 *    (no reset flow / no brute-force / no pwned-password checks required).
 *    This form doubles as sign-up: `shouldCreateUser: true` creates the
 *    auth.users row on first link click, and the sericia_handle_new_user
 *    trigger auto-creates the sericia_profiles row. Name/country/address
 *    are collected at Medusa checkout — no duplicate capture.
 *
 * Link delivery uses the existing /auth/callback route that already runs
 * `exchangeCodeForSession(code)` for both OAuth and OTP flows (same handler).
 */
export default function LoginForm() {
  const t = useTranslations("auth");
  const search = useSearchParams();
  const redirect = search.get("redirect") || "/account";
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.toLowerCase().trim();
    if (!trimmed) {
      toast.error(t("email_required_toast"));
      return;
    }
    setLoading(true);
    try {
      // Defensive: use the canonical production origin in production builds
      // regardless of `window.location.origin`. Prevents dev/preview deploys
      // from leaking localhost or staging URLs into magic-link emails the
      // user might click on a different device. Falls back to runtime origin
      // only in non-production (local dev) where localhost IS correct.
      const origin =
        process.env.NODE_ENV === "production"
          ? "https://sericia.com"
          : window.location.origin;
      const { error } = await supabaseBrowser().auth.signInWithOtp({
        email: trimmed,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirect)}`,
        },
      });
      if (error) throw error;
      setSent(true);
      toast.success(t("link_sent_toast"), {
        description: t("link_sent_toast_desc"),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[login] failed", err);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="border border-sericia-line bg-sericia-paper-card p-10">
        <p className="label mb-3">{t("check_email_eyebrow")}</p>
        <h2 className="text-[22px] font-normal mb-4 leading-snug">
          {t("we_sent_link_to", { email })}
        </h2>
        <p className="text-[14px] text-sericia-ink-soft leading-relaxed">
          {t("click_link_explainer")}
        </p>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setEmail("");
          }}
          className="text-[12px] text-sericia-ink-mute mt-8 underline-link"
        >
          {t("use_different_email")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-7">
      <div>
        <label className="label block mb-2">{t("email_address_label")}</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-0 py-3 bg-transparent border-b border-sericia-line focus:border-sericia-ink focus:outline-none text-[15px] placeholder-sericia-ink-mute transition-colors"
          autoComplete="email"
          placeholder={t("email_placeholder")}
        />
      </div>
      <div className="pt-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-sericia-ink text-sericia-paper py-5 text-[14px] tracking-wider hover:bg-sericia-accent transition-colors disabled:opacity-40"
        >
          {loading ? t("sending") : t("send_link")}
        </button>
        <p className="text-[12px] text-sericia-ink-mute text-center mt-6 leading-relaxed">
          {t("no_password_explainer_line1")}
          <br />
          {t("no_password_explainer_line2")}
        </p>
      </div>
    </form>
  );
}
