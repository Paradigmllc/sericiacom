"use client";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function ResetForm() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabaseBrowser().auth.resetPasswordForEmail(
        email.toLowerCase().trim(),
        { redirectTo: `${window.location.origin}/auth/callback?next=/account/settings` },
      );
      if (error) throw error;
      setSent(true);
      toast.success("Reset email sent");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[reset] failed", err);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="border border-sericia-line bg-sericia-paper-card p-10">
        <p className="label mb-3">Check your email</p>
        <h2 className="text-[22px] font-normal mb-4 leading-snug">Reset link sent to {email}</h2>
        <p className="text-[14px] text-sericia-ink-soft leading-relaxed">
          Click the link to choose a new password. You can close this tab.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-7">
      <div>
        <label className="label block mb-2">Email address</label>
        <input type="email" required value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-0 py-3 bg-transparent border-b border-sericia-line focus:border-sericia-ink focus:outline-none text-[15px] placeholder-sericia-ink-mute transition-colors"
          autoComplete="email" />
      </div>
      <div className="pt-4">
        <button type="submit" disabled={loading}
          className="w-full bg-sericia-ink text-sericia-paper py-5 text-[14px] tracking-wider hover:bg-sericia-accent transition-colors disabled:opacity-40">
          {loading ? "Sending…" : "Send reset link"}
        </button>
        <p className="text-[12px] text-sericia-ink-mute text-center mt-5">
          <Link href="/login" className="underline-link">Back to sign in</Link>
        </p>
      </div>
    </form>
  );
}
