"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
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
  const search = useSearchParams();
  const redirect = search.get("redirect") || "/account";
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.toLowerCase().trim();
    if (!trimmed) {
      toast.error("Email address required");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabaseBrowser().auth.signInWithOtp({
        email: trimmed,
        options: {
          // shouldCreateUser:true collapses sign-in + sign-up into one call.
          // Supabase checks if the email already exists in auth.users and
          // either issues a login link (existing) or a confirmation link
          // that creates the user on click (new). Either path lands on
          // /auth/callback which sets the session cookie.
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirect)}`,
        },
      });
      if (error) throw error;
      setSent(true);
      toast.success("Sign-in link sent. Check your email.");
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
        <p className="label mb-3">Check your email</p>
        <h2 className="text-[22px] font-normal mb-4 leading-snug">
          We sent a sign-in link to {email}
        </h2>
        <p className="text-[14px] text-sericia-ink-soft leading-relaxed">
          Click the link in the email to finish signing in. You can close this
          tab — the link will open a new session on any device.
        </p>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setEmail("");
          }}
          className="text-[12px] text-sericia-ink-mute mt-8 underline-link"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-7">
      <div>
        <label className="label block mb-2">Email address</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-0 py-3 bg-transparent border-b border-sericia-line focus:border-sericia-ink focus:outline-none text-[15px] placeholder-sericia-ink-mute transition-colors"
          autoComplete="email"
          placeholder="you@example.com"
        />
      </div>
      <div className="pt-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-sericia-ink text-sericia-paper py-5 text-[14px] tracking-wider hover:bg-sericia-accent transition-colors disabled:opacity-40"
        >
          {loading ? "Sending…" : "Send sign-in link"}
        </button>
        <p className="text-[12px] text-sericia-ink-mute text-center mt-6 leading-relaxed">
          No password needed. We&apos;ll email you a secure one-tap sign-in link.
          <br />
          First time? Just enter your email — your account is created automatically.
        </p>
      </div>
    </form>
  );
}
