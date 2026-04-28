"use client";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod";
import { supabaseBrowser } from "@/lib/supabase-browser";

/**
 * Passwordless sign-up via Supabase Magic Link with user metadata.
 *
 * Differences vs LoginForm:
 *  - Captures full_name + country_code up front (seeds sericia_profiles via
 *    the sericia_handle_new_user trigger that reads raw_user_meta_data).
 *  - Fires a best-effort welcome email through /api/auth/welcome after the
 *    magic link is sent (not after click — we want the welcome to arrive
 *    close in time to the sign-in link, before the user opens it).
 *
 * Why keep /signup at all if /login also creates users?
 *  - `/signup` is the marketing-intent landing (targeted by "create account"
 *    CTAs and any future paid search for "sericia sign up"). Dropping the
 *    route would break intent-matched flows even though the auth mechanic is
 *    the same. We keep the form but strip password entirely.
 */
const COUNTRIES: [string, string][] = [
  ["US", "United States"], ["GB", "United Kingdom"], ["DE", "Germany"],
  ["FR", "France"], ["AU", "Australia"], ["SG", "Singapore"],
  ["CA", "Canada"], ["HK", "Hong Kong"], ["JP", "Japan"],
  ["NL", "Netherlands"], ["SE", "Sweden"], ["NO", "Norway"],
  ["DK", "Denmark"], ["CH", "Switzerland"], ["IE", "Ireland"],
  ["NZ", "New Zealand"], ["IT", "Italy"], ["ES", "Spain"],
  ["BE", "Belgium"], ["AT", "Austria"], ["FI", "Finland"],
  ["TW", "Taiwan"], ["KR", "South Korea"],
];

export default function SignupForm() {
  const t = useTranslations("signup");
  const tAuth = useTranslations("auth");
  const search = useSearchParams();
  const redirect = search.get("redirect") || "/account";
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ email: "", full_name: "", country_code: "US" });

  const Schema = z.object({
    email: z.string().email(tAuth("email_required_toast")),
    full_name: z.string().min(1, t("name_required_toast")),
    country_code: z.string().length(2, t("country_required_toast")),
  });

  const input = "w-full px-0 py-3 bg-transparent border-b border-sericia-line focus:border-sericia-ink focus:outline-none text-[15px] placeholder-sericia-ink-mute transition-colors";
  const label = "label block mb-2";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = Schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? t("name_required_toast"));
      return;
    }
    setLoading(true);
    try {
      const email = parsed.data.email.toLowerCase().trim();
      const { error } = await supabaseBrowser().auth.signInWithOtp({
        email,
        options: {
          // `data` lands in auth.users.raw_user_meta_data which the
          // sericia_handle_new_user trigger reads on INSERT to seed
          // sericia_profiles (same contract as the old Google OAuth
          // flow — no backend changes needed).
          data: {
            full_name: parsed.data.full_name.trim(),
            country_code: parsed.data.country_code,
          },
          shouldCreateUser: true,
          // Defensive: pin to production origin in prod builds (see LoginForm).
          emailRedirectTo: `${
            process.env.NODE_ENV === "production"
              ? "https://sericia.com"
              : window.location.origin
          }/auth/callback?next=${encodeURIComponent(redirect)}`,
        },
      });
      if (error) throw error;
      // Fire welcome email via Resend (best-effort — we don't await).
      // Arrives alongside the magic link so the brand message lands
      // before the user completes auth, not after.
      fetch("/api/auth/welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, full_name: parsed.data.full_name }),
      }).catch((err) => console.error("[signup] welcome email failed", err));
      setSent(true);
      toast.success(tAuth("link_sent_toast"), {
        description: tAuth("link_sent_toast_desc"),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[signup] failed", err);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="border border-sericia-line bg-sericia-paper-card p-10">
        <p className="label mb-3">{t("sent_eyebrow")}</p>
        <h2 className="text-[22px] font-normal mb-4 leading-snug">
          {t("sent_title", { email: form.email })}
        </h2>
        <p className="text-[14px] text-sericia-ink-soft leading-relaxed">
          {t("sent_explainer")}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-7">
      <div>
        <label className={label}>{t("full_name_label")}</label>
        <input type="text" required value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          className={input} autoComplete="name" />
      </div>
      <div>
        <label className={label}>{t("email_address_label")}</label>
        <input type="email" required value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className={input} autoComplete="email" />
      </div>
      <div>
        <label className={label}>{t("country_label")}</label>
        <select required value={form.country_code}
          onChange={(e) => setForm({ ...form, country_code: e.target.value })}
          className={`${input} cursor-pointer`}>
          {COUNTRIES.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
        </select>
      </div>
      <div className="pt-4">
        <button type="submit" disabled={loading}
          className="w-full bg-sericia-ink text-sericia-paper py-5 text-[14px] tracking-wider hover:bg-sericia-accent transition-colors disabled:opacity-40">
          {loading ? t("submit_sending") : t("submit_create")}
        </button>
        <p className="text-[12px] text-sericia-ink-mute text-center mt-5 leading-relaxed">
          {t("fine_already_have")}{" "}
          <Link href={`/login?redirect=${encodeURIComponent(redirect)}`} className="underline-link">
            {t("fine_sign_in_link")}
          </Link>
          <br />
          {t("fine_no_password")}
          <br />
          {t("fine_terms_prefix")}{" "}
          <Link href="/terms" className="underline-link">{t("fine_terms")}</Link>{" "}
          {t("fine_and")}{" "}
          <Link href="/privacy" className="underline-link">{t("fine_privacy")}</Link>.
        </p>
      </div>
    </form>
  );
}
