"use client";

/**
 * Footer-resident email subscribe form.
 *
 * Separate from the hero-level `WaitlistForm` because the footer needs a
 * quieter, darker-mode presentation (sits on bg-sericia-paper-deep) whereas
 * WaitlistForm targets bright paper backgrounds. Posts to the same
 * `/api/waitlist` endpoint so we have one funnel, one list, one de-dup
 * policy. Source is tagged `footer` so we can distinguish subscriber
 * acquisition surfaces in the dashboard.
 *
 * Behaviour:
 * - Client-side email presence check (belt) before POST
 * - Server returns 409 `already_subscribed` → friendly "you're already in"
 *   message rather than an error toast
 * - UTM params captured from window.location so campaign attribution works
 *   even when the footer is the first CTA someone clicks
 * - AbortSignal.timeout(10_000) bounds the request (per global rule U)
 */

import { useState } from "react";
import { toast } from "sonner";

export default function FooterSubscribeForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed.includes("@") || trimmed.length < 5) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setStatus("sending");
    try {
      const params = new URLSearchParams(window.location.search);
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(10_000),
        body: JSON.stringify({
          email: trimmed,
          source: "footer",
          locale: navigator.language,
          utm_source: params.get("utm_source"),
          utm_medium: params.get("utm_medium"),
          utm_campaign: params.get("utm_campaign"),
        }),
      });
      if (res.ok) {
        toast.success("You're on the list. See you at the next drop.");
        setStatus("done");
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (data?.error === "already_subscribed") {
        toast.success("You're already subscribed — see you at the next drop.");
        setStatus("done");
        return;
      }
      toast.error("Could not subscribe. Please try again.");
      setStatus("idle");
    } catch (err) {
      console.error("[footer-subscribe] error", err);
      toast.error("Network error. Please try again.");
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <p className="text-[13px] text-sericia-ink-soft leading-relaxed">
        <span className="inline-block mr-2 text-sericia-ink">✓</span>
        Confirmed. We write four to six times a year — no more.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-0 max-w-md">
      <label className="flex-1 sm:min-w-0">
        <span className="sr-only">Email address</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          className="w-full h-12 px-0 py-3 bg-transparent border-b border-sericia-ink/30 focus:border-sericia-ink focus:outline-none text-[14px] text-sericia-ink placeholder:text-sericia-ink-mute"
        />
      </label>
      <button
        type="submit"
        disabled={status === "sending"}
        className="h-12 px-6 border-b border-sericia-ink text-[12px] tracking-[0.22em] uppercase text-sericia-ink hover:text-sericia-ink-mute transition-colors disabled:opacity-50 whitespace-nowrap"
      >
        {status === "sending" ? "…" : "Notify me"}
      </button>
    </form>
  );
}
