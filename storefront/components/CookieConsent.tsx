"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

/**
 * CookieConsent — Aesop-style bottom-fixed banner.
 *
 * Design principles (matches sericia.com brand grammar exactly):
 *   • Paper background + ink type, not a cheap dark-modal intrusion
 *   • Hairline border, no drop shadow, no rounded corners
 *   • Editorial copy in brand voice — "We store a minimum" not
 *     "We use cookies to enhance your experience ✨"
 *   • Two primary actions only: Accept / Decline. A third "Learn more"
 *     links to the privacy policy rather than an in-banner modal
 *     (simpler = more luxurious).
 *
 * Storage contract:
 *   localStorage["sericia:cookie-consent"] = JSON.stringify({
 *     decision: "accept" | "decline",
 *     decidedAt: ISO-8601 timestamp
 *   })
 *
 * Re-ask cadence: 365 days. Storing the decision timestamp (rather than a
 * boolean) lets us silently re-prompt after a year without burning the
 * visitor every session — matches GDPR / ePrivacy expectations.
 *
 * A11y:
 *   role="dialog" + aria-labelledby so screen readers announce it;
 *   focusable Decline action as the default focus target (quieter UX).
 */

type Decision = "accept" | "decline";
type Stored = { decision: Decision; decidedAt: string };

const STORAGE_KEY = "sericia:cookie-consent";
const REASK_AFTER_DAYS = 365;

function readStored(): Stored | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stored;
    if (parsed?.decision && parsed?.decidedAt) return parsed;
    return null;
  } catch {
    return null;
  }
}

function isStillValid(stored: Stored): boolean {
  const decidedAt = new Date(stored.decidedAt).getTime();
  if (Number.isNaN(decidedAt)) return false;
  const ageMs = Date.now() - decidedAt;
  const maxAgeMs = REASK_AFTER_DAYS * 24 * 60 * 60 * 1000;
  return ageMs < maxAgeMs;
}

function writeDecision(decision: Decision) {
  if (typeof window === "undefined") return;
  try {
    const payload: Stored = {
      decision,
      decidedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    // Fire a window event so any analytics component can adjust in real time
    window.dispatchEvent(
      new CustomEvent("sericia:consent-changed", { detail: payload })
    );
  } catch (e) {
    // localStorage can throw in privacy modes; non-fatal
    console.error("[CookieConsent] failed to persist decision:", e);
  }
}

export default function CookieConsent() {
  const t = useTranslations("cookie_consent");
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Initial visibility check after mount (avoids SSR hydration mismatch)
  useEffect(() => {
    const stored = readStored();
    if (!stored || !isStillValid(stored)) {
      // Slight delay so the banner doesn't slam in during route transition
      const t = window.setTimeout(() => setVisible(true), 600);
      return () => window.clearTimeout(t);
    }
  }, []);

  // Publish the banner's live height as `--cookie-consent-h` on :root so
  // bottom-fixed siblings (DifyChat, BackToTop) can lift cleanly above it
  // without hard-coding a margin. ResizeObserver tracks responsive rewraps
  // (1-line desktop vs 3-line mobile). Reset to 0 on dismount.
  useEffect(() => {
    if (!visible) {
      document.documentElement.style.setProperty("--cookie-consent-h", "0px");
      return;
    }
    const node = ref.current;
    if (!node) return;
    const apply = () => {
      const h = node.offsetHeight;
      document.documentElement.style.setProperty("--cookie-consent-h", `${h}px`);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(node);
    return () => {
      ro.disconnect();
      document.documentElement.style.setProperty("--cookie-consent-h", "0px");
    };
  }, [visible]);

  if (!visible) return null;

  const handle = (decision: Decision) => {
    writeDecision(decision);
    setVisible(false);
  };

  return (
    <div
      ref={ref}
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-body"
      className="fixed inset-x-0 bottom-0 z-[95] border-t border-sericia-line bg-sericia-paper animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-3 md:py-3.5 flex flex-col md:flex-row md:items-center gap-3 md:gap-8">
        <div className="flex-1 min-w-0">
          <p
            id="cookie-consent-title"
            className="sr-only"
          >
            {t("sr_title")}
          </p>
          <p
            id="cookie-consent-body"
            className="text-[13px] md:text-[13.5px] leading-snug text-sericia-ink-soft max-w-4xl"
          >
            {t("body_before_link")}{" "}
            <Link href="/privacy" className="underline-link">
              {t("privacy_link")}
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-row gap-2 md:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handle("decline")}
            className="inline-flex items-center justify-center px-4 md:px-5 py-2 text-[11px] tracking-[0.18em] uppercase border border-sericia-line text-sericia-ink-soft hover:border-sericia-ink hover:text-sericia-ink transition-colors"
          >
            {t("decline")}
          </button>
          <button
            type="button"
            onClick={() => handle("accept")}
            autoFocus
            className="inline-flex items-center justify-center px-4 md:px-5 py-2 text-[11px] tracking-[0.18em] uppercase bg-sericia-ink text-sericia-paper hover:bg-sericia-accent transition-colors"
          >
            {t("accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
