"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const redirect = search.get("redirect") || "/account";
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const input = "w-full px-0 py-3 bg-transparent border-b border-sericia-line focus:border-sericia-ink focus:outline-none text-[15px] placeholder-sericia-ink-mute transition-colors";
  const label = "label block mb-2";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error("Email and password required");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabaseBrowser().auth.signInWithPassword({
        email: form.email.toLowerCase().trim(),
        password: form.password,
      });
      if (error) throw error;
      toast.success("Signed in");
      router.push(redirect);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[login] failed", err);
      toast.error(msg);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-7">
      <div>
        <label className={label}>Email address</label>
        <input type="email" required value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className={input} autoComplete="email" />
      </div>
      <div>
        <label className={label}>Password</label>
        <input type="password" required value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className={input} autoComplete="current-password" />
      </div>
      <div className="pt-4">
        <button type="submit" disabled={loading}
          className="w-full bg-sericia-ink text-sericia-paper py-5 text-[14px] tracking-wider hover:bg-sericia-accent transition-colors disabled:opacity-40">
          {loading ? "Signing in…" : "Sign in"}
        </button>
        <div className="flex justify-between text-[12px] mt-5 text-sericia-ink-mute">
          <Link href="/reset" className="underline-link">Forgot password?</Link>
          <Link href="/login/magic" className="underline-link">Magic link</Link>
        </div>
        <p className="text-[12px] text-sericia-ink-mute text-center mt-8 leading-relaxed">
          New to Sericia? <Link href={`/signup?redirect=${encodeURIComponent(redirect)}`} className="underline-link">Create an account</Link>
        </p>
      </div>
    </form>
  );
}
