"use client";
import { useState } from "react";
import { toast } from "sonner";

type Props = { source: string; country: string };

export default function WaitlistForm({ source, country }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          source,
          country_code: country.toUpperCase(),
          locale: navigator.language,
          utm_source: params.get("utm_source"),
          utm_medium: params.get("utm_medium"),
          utm_campaign: params.get("utm_campaign"),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error === "already_subscribed" ? "You're already on the list — see you at the next drop!" : "Could not subscribe. Please try again.");
        setLoading(false);
        return;
      }
      toast.success("You're in. We'll email 24h before the next drop.");
      setJoined(true);
    } catch (e) {
      console.error("[waitlist] error", e);
      toast.error("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  if (joined) {
    return <p className="text-sericia-accent text-center">✓ Early-access confirmed. Check your inbox.</p>;
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="flex-1 px-4 py-3 rounded-lg border border-sericia-ink/20 bg-white focus:outline-none focus:ring-2 focus:ring-sericia-accent"
        autoComplete="email"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-sericia-ink text-sericia-paper px-6 py-3 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50"
      >
        {loading ? "…" : "Join"}
      </button>
    </form>
  );
}
