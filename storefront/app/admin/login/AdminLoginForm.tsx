"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function AdminLoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const redirect = search.get("redirect") || "/admin";
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || `Login failed (${res.status})`);
      }
      toast.success("Signed in");
      router.push(redirect);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[admin/login] failed", err);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <label className="label block mb-2">Admin password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoFocus
          autoComplete="current-password"
          className="w-full border-0 border-b border-sericia-line bg-transparent py-2 text-[15px] focus:outline-none focus:border-sericia-ink"
        />
      </div>
      <button
        type="submit"
        disabled={submitting || !password}
        className="w-full bg-sericia-ink text-sericia-paper py-3 text-[13px] tracking-wider hover:bg-sericia-accent transition disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
