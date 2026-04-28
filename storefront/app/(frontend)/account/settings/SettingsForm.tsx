"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { supabaseBrowser } from "@/lib/supabase-browser";

/**
 * Account settings — profile (name + language), email change, payment info
 * disclosure, account deletion.
 *
 * Why payment info has no edit form here:
 *   Sericia delegates the entire PCI scope to Crossmint's hosted iframe
 *   (see CrossmintPayment.tsx). We never receive, see, or store card numbers
 *   or PANs — the card form lives on a Crossmint-controlled origin and only
 *   the resulting USDC settlement hits our backend. There is therefore no
 *   "saved cards" object on our side to edit. We surface this truthfully
 *   instead of pretending the user has nothing to manage, which both sets
 *   accurate expectations and signals security maturity.
 *
 * Password management was removed alongside the switch to passwordless
 * Magic Link auth (LoginForm.tsx). Existing auth.users rows that still
 * carry a password_hash are harmless — the field is simply never read by
 * the UI. To rotate, users delete + re-create via magic link.
 */

// Mirrors the next-intl LOCALES list (storefront/i18n/routing.ts) plus what
// sericia_profiles.locale stores. Kept in sync manually because we don't want
// to import server-only routing config into a client component.
const LOCALE_OPTIONS: [string, string][] = [
  ["en", "English"],
  ["ja", "日本語"],
  ["de", "Deutsch"],
  ["fr", "Français"],
  ["es", "Español"],
  ["it", "Italiano"],
  ["ko", "한국어"],
  ["zh-TW", "繁體中文"],
  ["ru", "Русский"],
  ["ar", "العربية"],
];

type Profile = {
  full_name: string | null;
  locale: string | null;
};

type Props = {
  initialEmail: string;
  initialProfile: Profile;
};

export default function SettingsForm({ initialEmail, initialProfile }: Props) {
  const router = useRouter();

  // Profile section state — name + preferred locale. Default locale falls
  // back to "en" (matches the DB default and the ja-rich Sericia footer copy
  // already covering JP-leaning users via locale switcher).
  const [fullName, setFullName] = useState(initialProfile.full_name ?? "");
  const [locale, setLocale] = useState(initialProfile.locale ?? "en");
  const [loadingProfile, setLoadingProfile] = useState(false);

  const [email, setEmail] = useState(initialEmail);
  const [loadingEmail, setLoadingEmail] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState("");
  const [loadingDelete, setLoadingDelete] = useState(false);

  const input =
    "w-full px-0 py-3 bg-transparent border-b border-sericia-line focus:border-sericia-ink focus:outline-none text-[15px] placeholder-sericia-ink-mute transition-colors";
  const label = "label block mb-2";

  async function updateProfile(e: React.FormEvent) {
    e.preventDefault();
    setLoadingProfile(true);
    try {
      const supa = supabaseBrowser();
      const {
        data: { user },
      } = await supa.auth.getUser();
      if (!user) throw new Error("Not signed in");
      // RLS: profiles_self_update policy lets the row owner update directly
      // without going through a server route. We trim to avoid invisible
      // whitespace differences masquerading as edits.
      const { error } = await supa
        .from("sericia_profiles")
        .update({
          full_name: fullName.trim(),
          locale,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
      if (error) throw error;
      toast.success("Profile updated");
      // Refresh the route so the account overview header (which reads
      // profile.full_name as the H1) reflects the new name on next render.
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[settings] profile", err);
      toast.error(msg);
    } finally {
      setLoadingProfile(false);
    }
  }

  async function updateEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoadingEmail(true);
    try {
      const { error } = await supabaseBrowser().auth.updateUser({
        email: email.toLowerCase().trim(),
      });
      if (error) throw error;
      toast.success("Email change requested. Check both inboxes to confirm.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[settings] email", err);
      toast.error(msg);
    } finally {
      setLoadingEmail(false);
    }
  }

  async function deleteAccount(e: React.FormEvent) {
    e.preventDefault();
    if (confirmDelete !== "DELETE") {
      toast.error("Type DELETE to confirm");
      return;
    }
    setLoadingDelete(true);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error || "delete_failed");
      }
      await supabaseBrowser().auth.signOut();
      toast.success("Account deleted");
      router.push("/");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[settings] delete", err);
      toast.error(msg);
      setLoadingDelete(false);
    }
  }

  return (
    <div className="space-y-16 max-w-xl">
      {/* ── Profile ───────────────────────────────────────────────── */}
      <form onSubmit={updateProfile} className="space-y-5">
        <h2 className="text-[22px] font-normal">Profile</h2>
        <p className="text-[13px] text-sericia-ink-soft leading-relaxed">
          The name we use on order receipts and customs declarations. Pick the
          language we should email you in.
        </p>
        <div>
          <label className={label}>Full name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={input}
            autoComplete="name"
            placeholder="e.g. Hana Sato"
          />
        </div>
        <div>
          <label className={label}>Preferred language</label>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            className={`${input} cursor-pointer`}
          >
            {LOCALE_OPTIONS.map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={loadingProfile}
          className="bg-sericia-ink text-sericia-paper py-4 px-10 text-[14px] tracking-wider hover:bg-sericia-accent transition-colors disabled:opacity-40"
        >
          {loadingProfile ? "Saving…" : "Save profile"}
        </button>
      </form>

      {/* ── Email ─────────────────────────────────────────────────── */}
      <form onSubmit={updateEmail} className="space-y-5">
        <h2 className="text-[22px] font-normal">Email</h2>
        <p className="text-[13px] text-sericia-ink-soft leading-relaxed">
          Sign-in uses passwordless email links — no password to manage.
          Changing your email sends a confirmation to both addresses.
        </p>
        <div>
          <label className={label}>Email address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={input}
            autoComplete="email"
          />
        </div>
        <button
          type="submit"
          disabled={loadingEmail}
          className="bg-sericia-ink text-sericia-paper py-4 px-10 text-[14px] tracking-wider hover:bg-sericia-accent transition-colors disabled:opacity-40"
        >
          {loadingEmail ? "Sending…" : "Update email"}
        </button>
      </form>

      {/* ── Shipping address shortcut ─────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="text-[22px] font-normal">Shipping address &amp; phone</h2>
        <p className="text-[13px] text-sericia-ink-soft leading-relaxed">
          Edit your default shipping address and customs phone number on the
          dedicated addresses page.
        </p>
        <Link
          href="/account/addresses"
          className="inline-flex items-center gap-2 text-[13px] tracking-wider uppercase text-sericia-ink underline-link"
        >
          Manage addresses →
        </Link>
      </div>

      {/* ── Payment information disclosure ────────────────────────── */}
      <div className="space-y-3 border border-sericia-line p-8 bg-sericia-paper-card">
        <h2 className="text-[22px] font-normal">Payment information</h2>
        <p className="text-[14px] text-sericia-ink-soft leading-relaxed">
          We do not store your card. Card details are entered each time at
          checkout on a secure, PCI-compliant iframe hosted by our payment
          partner — Sericia&apos;s servers never see the full card number,
          expiry or CVC. There is nothing to manage here.
        </p>
        <p className="text-[12px] text-sericia-ink-mute leading-relaxed">
          If you spot an unrecognised charge, write to{" "}
          <a href="mailto:contact@sericia.com" className="underline-link">
            contact@sericia.com
          </a>{" "}
          and we&apos;ll investigate the same day.
        </p>
      </div>

      {/* ── Delete account ────────────────────────────────────────── */}
      <form onSubmit={deleteAccount} className="space-y-5 border border-sericia-line p-8">
        <h2 className="text-[22px] font-normal">Delete account</h2>
        <p className="text-[14px] text-sericia-ink-soft leading-relaxed">
          Permanently delete your profile and addresses. Orders are retained
          for legal and tax reasons. This cannot be undone.
        </p>
        <div>
          <label className={label}>Type DELETE to confirm</label>
          <input
            type="text"
            value={confirmDelete}
            onChange={(e) => setConfirmDelete(e.target.value)}
            className={input}
          />
        </div>
        <button
          type="submit"
          disabled={loadingDelete || confirmDelete !== "DELETE"}
          className="border border-sericia-ink py-4 px-10 text-[14px] tracking-wider hover:bg-sericia-ink hover:text-sericia-paper transition-colors disabled:opacity-40"
        >
          {loadingDelete ? "Deleting…" : "Delete account"}
        </button>
      </form>
    </div>
  );
}
