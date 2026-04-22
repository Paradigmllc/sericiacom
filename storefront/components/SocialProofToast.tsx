"use client";

/**
 * SocialProofToast — anonymized live-order ticker via Sonner.
 *
 * Design principles:
 *   • Country + time only — no PII. Matches /api/social-proof/orders response.
 *   • Quiet cadence — first toast after 30s, subsequent every 20s, max 5/session.
 *     Aesop-restraint: a whisper of activity, not a barrage.
 *   • Respects cookie consent — if the visitor declined optional cookies (via
 *     CookieConsent), we don't show toasts. This isn't a technical requirement
 *     (no PII sent), but a posture: if they said "minimize the noise", honour it.
 *   • Paper palette Sonner toast — uses sericia-paper/ink tokens via custom
 *     `className` so it matches the brand (not Sonner default grey).
 *
 * A11y:
 *   • Sonner emits toasts with role="status" + aria-live="polite" by default,
 *     so screen readers will announce each one. Since we cap at 5/session the
 *     noise is bounded.
 */

import { useEffect, useRef } from "react";
import { toast } from "sonner";

type OrderSignal = { country_code: string; paid_at: string };

// Top 10 destination countries for Sericia — covers >95% of expected orders.
// Fallback to bare country_code if absent (e.g., "SE" for Sweden).
const COUNTRY_META: Record<string, { flag: string; name: string }> = {
  US: { flag: "🇺🇸", name: "United States" },
  GB: { flag: "🇬🇧", name: "United Kingdom" },
  DE: { flag: "🇩🇪", name: "Germany" },
  FR: { flag: "🇫🇷", name: "France" },
  JP: { flag: "🇯🇵", name: "Japan" },
  AU: { flag: "🇦🇺", name: "Australia" },
  SG: { flag: "🇸🇬", name: "Singapore" },
  CA: { flag: "🇨🇦", name: "Canada" },
  HK: { flag: "🇭🇰", name: "Hong Kong" },
  KR: { flag: "🇰🇷", name: "South Korea" },
  IT: { flag: "🇮🇹", name: "Italy" },
  ES: { flag: "🇪🇸", name: "Spain" },
  NL: { flag: "🇳🇱", name: "Netherlands" },
  SE: { flag: "🇸🇪", name: "Sweden" },
  CH: { flag: "🇨🇭", name: "Switzerland" },
  AE: { flag: "🇦🇪", name: "United Arab Emirates" },
};

function formatRelative(isoString: string): string {
  const then = new Date(isoString).getTime();
  if (Number.isNaN(then)) return "recently";
  const diffMs = Date.now() - then;
  if (diffMs < 0) return "just now"; // future timestamp guard
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return "recently";
}

const INITIAL_DELAY_MS = 30_000;
const INTERVAL_MS = 20_000;
const MAX_PER_SESSION = 5;
const COOKIE_KEY = "sericia:cookie-consent";

function readCookieConsentAccepted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(COOKIE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { decision?: string };
    return parsed?.decision === "accept";
  } catch {
    return false;
  }
}

export default function SocialProofToast() {
  // Hold mutable state in refs so React strict-mode double-invocation doesn't
  // cause the same toast to fire twice
  const shownCountRef = useRef(0);
  const firedOnceRef = useRef(false);

  useEffect(() => {
    if (firedOnceRef.current) return;
    firedOnceRef.current = true;

    // Respect cookie consent decision (paper-opt-in)
    if (!readCookieConsentAccepted()) return;

    let mounted = true;
    let initialTimer: number | null = null;
    let intervalTimer: number | null = null;
    let items: OrderSignal[] = [];
    let cursor = 0;

    async function loadAndStart() {
      try {
        const res = await fetch("/api/social-proof/orders", {
          method: "GET",
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(5_000),
        });
        if (!res.ok) return;
        const json = (await res.json()) as { items: OrderSignal[] };
        if (!mounted) return;
        items = Array.isArray(json.items) ? json.items : [];
        if (items.length === 0) return;

        initialTimer = window.setTimeout(() => {
          if (!mounted) return;
          showNext();
          intervalTimer = window.setInterval(showNext, INTERVAL_MS);
        }, INITIAL_DELAY_MS);
      } catch (err) {
        // Silent — social proof is decorative, failure = no toasts, not user-visible
        console.error("[social-proof] load failed", err);
      }
    }

    function showNext() {
      if (!mounted) return;
      if (shownCountRef.current >= MAX_PER_SESSION) {
        if (intervalTimer !== null) window.clearInterval(intervalTimer);
        return;
      }
      const item = items[cursor % items.length];
      cursor++;
      shownCountRef.current++;
      const meta = COUNTRY_META[item.country_code] ?? {
        flag: "📦",
        name: item.country_code,
      };
      toast(`Someone in ${meta.name} ordered`, {
        description: `${meta.flag} ${formatRelative(item.paid_at)}`,
        duration: 4500,
        className:
          "!bg-sericia-paper !border !border-sericia-line !text-sericia-ink !shadow-none !rounded-none",
      });
    }

    loadAndStart();

    return () => {
      mounted = false;
      if (initialTimer !== null) window.clearTimeout(initialTimer);
      if (intervalTimer !== null) window.clearInterval(intervalTimer);
    };
  }, []);

  return null;
}
