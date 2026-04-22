"use client";

/**
 * Region / language suggestion modal — first-visit only.
 *
 * On mount, infers the visitor's preferred UI language from `navigator.language`
 * and — if it differs from the currently-served locale AND they haven't
 * dismissed within the last 30 days — surfaces a centered Aesop-style card
 * offering a one-click switch. Dismiss/accept both set a localStorage
 * timestamp so the prompt doesn't nag returning visitors.
 *
 * Why a timestamp rather than a boolean flag: a returning visitor after a
 * long hiatus might have moved country; re-showing the prompt is actually
 * the right UX. `DISMISS_DAYS` controls that window (30 days feels like
 * the sweet spot between "didn't miss it" and "didn't feel pestered").
 *
 * Mount point: app/layout.tsx, inside the NextIntlClientProvider + Suspense
 * boundary (needs access to useLocale and runs only on the client).
 */

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";

const SUPPORTED = ["en", "ja", "de", "fr", "es", "it", "ko", "zh-TW", "ru"] as const;
const STORAGE_KEY = "sericia:region-modal-seen";
const DISMISS_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Native name, English name, and flag emoji for each supported locale.
// English isn't in the suggestion map because it's the default — we only
// suggest switching AWAY from English or another non-default locale, never
// to English (/ route is always reachable via LocaleSwitcher).
const LOCALE_LABELS: Record<string, { native: string; english: string; flag: string }> = {
  ja: { native: "日本語", english: "Japanese", flag: "🇯🇵" },
  de: { native: "Deutsch", english: "German", flag: "🇩🇪" },
  fr: { native: "Français", english: "French", flag: "🇫🇷" },
  es: { native: "Español", english: "Spanish", flag: "🇪🇸" },
  it: { native: "Italiano", english: "Italian", flag: "🇮🇹" },
  ko: { native: "한국어", english: "Korean", flag: "🇰🇷" },
  "zh-TW": { native: "繁體中文", english: "Traditional Chinese", flag: "🇹🇼" },
  ru: { native: "Русский", english: "Russian", flag: "🇷🇺" },
  en: { native: "English", english: "English", flag: "🇬🇧" },
};

function inferBrowserLocale(): string | null {
  if (typeof navigator === "undefined") return null;
  const raw = navigator.language || (navigator.languages && navigator.languages[0]);
  if (!raw) return null;
  const lower = raw.toLowerCase();
  // Chinese: map all zh-* variants to zh-TW (our only Chinese locale).
  // This is a deliberate simplification — a Mainland China visitor will
  // see Traditional, but the UI still works and the locale switcher is
  // one click away.
  if (lower.startsWith("zh")) return "zh-TW";
  const short = lower.slice(0, 2);
  if ((SUPPORTED as readonly string[]).includes(short)) return short;
  return null;
}

export default function RegionModal() {
  const [open, setOpen] = useState(false);
  const [suggest, setSuggest] = useState<string | null>(null);
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    try {
      const seenAt = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (seenAt) {
        const ts = Number(seenAt);
        if (Number.isFinite(ts) && Date.now() - ts < DISMISS_MS) return;
      }
    } catch {
      // localStorage unavailable (private mode / SSR race) — proceed silently.
    }
    const browser = inferBrowserLocale();
    if (!browser) return;
    if (browser === currentLocale) return;
    // Don't suggest a locale we don't actually ship copy for.
    if (!LOCALE_LABELS[browser]) return;
    setSuggest(browser);
    setOpen(true);
  }, [currentLocale]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") dismiss();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function dismiss() {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
      }
    } catch {
      // Ignore — modal still closes.
    }
    setOpen(false);
  }

  function acceptSuggestion() {
    if (!suggest) return;
    // Rewrite the current pathname's locale prefix (if any) to the suggested one.
    const segs = pathname.split("/").filter(Boolean);
    const hasLocalePrefix = segs[0] && (SUPPORTED as readonly string[]).includes(segs[0]);
    const rest = hasLocalePrefix ? segs.slice(1).join("/") : segs.join("/");
    const dest =
      suggest === "en"
        ? `/${rest}`.replace(/\/$/, "") || "/"
        : `/${suggest}${rest ? `/${rest}` : ""}`;
    dismiss();
    router.push(dest);
  }

  if (!open || !suggest) return null;
  const suggestLabel = LOCALE_LABELS[suggest];
  const currentLabel = LOCALE_LABELS[currentLocale] ?? LOCALE_LABELS.en;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="region-modal-title"
      className="fixed inset-0 z-[80] flex items-center justify-center px-4 animate-in fade-in duration-300"
    >
      {/* Scrim — clicking it dismisses. Rendered as a <button> for a11y
          but styled invisibly so it reads as a backdrop. */}
      <button
        type="button"
        aria-label="Dismiss region suggestion"
        onClick={dismiss}
        className="absolute inset-0 bg-sericia-ink/25 backdrop-blur-[2px] cursor-default"
      />
      <div className="relative w-full max-w-md border border-sericia-line bg-sericia-paper shadow-[0_40px_120px_-40px_rgba(33,35,29,0.45)]">
        <div className="px-10 py-11 md:px-12 md:py-14">
          <p className="label mb-5 text-[10px] tracking-[0.3em]">Language</p>
          <h2
            id="region-modal-title"
            className="text-[24px] md:text-[28px] font-normal tracking-tight leading-[1.22] mb-5 text-sericia-ink"
          >
            It appears you prefer {suggestLabel.native}.
          </h2>
          <p className="text-[14px] text-sericia-ink-soft leading-[1.75] mb-9 max-w-sm">
            Sericia is available in {suggestLabel.native} —{" "}
            the same drops, the same producers, localised for you. You can switch anytime
            from the header.
          </p>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={acceptSuggestion}
              className="w-full bg-sericia-ink text-sericia-paper px-6 py-4 text-[12px] tracking-[0.22em] uppercase hover:opacity-90 transition-opacity"
            >
              <span className="mr-2">{suggestLabel.flag}</span>
              View in {suggestLabel.native}
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="w-full border border-sericia-line px-6 py-4 text-[12px] tracking-[0.22em] uppercase text-sericia-ink hover:bg-sericia-paper-card transition-colors"
            >
              Continue in {currentLabel.native}
            </button>
          </div>
        </div>
        {/* Close (×) — top-right corner, visible but restrained */}
        <button
          type="button"
          aria-label="Close"
          onClick={dismiss}
          className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center text-sericia-ink-mute hover:text-sericia-ink transition-colors"
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 3 L13 13 M13 3 L3 13" />
          </svg>
        </button>
      </div>
    </div>
  );
}
