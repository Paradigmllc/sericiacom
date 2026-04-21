"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { supabaseBrowser } from "@/lib/supabase-browser";

const Schema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  full_name: z.string().min(1, "Name required"),
  country_code: z.string().length(2, "Country required"),
});

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
  const router = useRouter();
  const search = useSearchParams();
  const redirect = search.get("redirect") || "/account";
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", full_name: "", country_code: "US" });

  const input = "w-full px-0 py-3 bg-transparent border-b border-sericia-line focus:border-sericia-ink focus:outline-none text-[15px] placeholder-sericia-ink-mute transition-colors";
  const label = "label block mb-2";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = Schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }
    setLoading(true);
    try {
      const supa = supabaseBrowser();
      const { data, error } = await supa.auth.signUp({
        email: parsed.data.email.toLowerCase().trim(),
        password: parsed.data.password,
        options: {
          data: {
            full_name: parsed.data.full_name.trim(),
            country_code: parsed.data.country_code,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirect)}`,
        },
      });
      if (error) throw error;
      // Fire welcome email via server route (best-effort)
      if (data.user) {
        fetch("/api/auth/welcome", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: parsed.data.email, full_name: parsed.data.full_name }),
        }).catch((err) => console.error("[signup] welcome email failed", err));
      }
      if (data.session) {
        toast.success("Account created");
        router.push(redirect);
        router.refresh();
      } else {
        toast.success("Account created — check your email to verify");
        router.push(`/login?redirect=${encodeURIComponent(redirect)}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[signup] failed", err);
      toast.error(msg);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-7">
      <div>
        <label className={label}>Full name</label>
        <input type="text" required value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          className={input} autoComplete="name" />
      </div>
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
          className={input} autoComplete="new-password" minLength={8}
          placeholder="Minimum 8 characters" />
      </div>
      <div>
        <label className={label}>Country</label>
        <select required value={form.country_code}
          onChange={(e) => setForm({ ...form, country_code: e.target.value })}
          className={`${input} cursor-pointer`}>
          {COUNTRIES.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
        </select>
      </div>
      <div className="pt-4">
        <button type="submit" disabled={loading}
          className="w-full bg-sericia-ink text-sericia-paper py-5 text-[14px] tracking-wider hover:bg-sericia-accent transition-colors disabled:opacity-40">
          {loading ? "Creating account…" : "Create account"}
        </button>
        <p className="text-[12px] text-sericia-ink-mute text-center mt-5 leading-relaxed">
          Already have an account? <Link href={`/login?redirect=${encodeURIComponent(redirect)}`} className="underline-link">Sign in</Link>
          <br />By continuing you agree to our{" "}
          <Link href="/terms" className="underline-link">Terms</Link> and{" "}
          <Link href="/privacy" className="underline-link">Privacy Policy</Link>.
        </p>
      </div>
    </form>
  );
}
