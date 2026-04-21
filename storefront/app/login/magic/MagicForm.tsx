"use client";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function MagicForm() {
  const search = useSearchParams();
  const redirect = search.get("redirect") || "/account";
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const { error } = await supabaseBrowser().auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirect)}`,
        },
      });
      if (error) throw error;
      setSent(true);
      toast.success("Sign-in link sent. Check your email.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[magic] failed", err);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="border border-sericia-line bg-sericia-paper-card p-10">
        <p className="label mb-3">Check your email</p>
        <h2 className="text-[22px] font-normal mb-4 leading-snug">We sent a sign-in link to {email}</h2>
        <p className="text-[14px] text-sericia-ink-soft leading-relaxed">
          Click the link in the email to finish signing in. You can close this tab.
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
          {loading ? "Sending…" : "Send sign-in link"}
        </button>
        <p className="text-[12px] text-sericia-ink-mute text-center mt-5">
          <Link href="/login" className="underline-link">Use password instead</Link>
        </p>
      </div>
    </form>
  );
}
