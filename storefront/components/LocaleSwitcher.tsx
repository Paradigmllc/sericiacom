"use client";
import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LOCALE_LABELS, type Locale } from "@/i18n/routing";

const LOCALES: Locale[] = ["en", "ja", "de", "fr", "es", "it", "ko", "zh-TW", "ru", "ar"];

// Flag rationale: `en` is a single locale serving US + UK + CA + AU + SG + HK
// via hreflang country-specific guides (see app/layout.tsx alternates.languages).
// `us` is chosen over `gb` because (1) the US is the largest English e-commerce
// market, (2) Japan→US is Sericia's primary EMS export route, (3) the
// previous 🇬🇧 visually excluded US shoppers.
//
// We use `flag-icons` CSS (SVG sprite) instead of Unicode emoji flags because
// Windows refuses to render emoji flags and shows 2-letter regional indicator
// text ("US"/"JP"/"GB") instead. SVG sprites render identically on every OS.
// To go fully country-neutral (Aesop / Le Labo style), remove FLAG_CODES and
// drop the <span class="fi fi-*" /> render below.
const FLAG_CODES: Record<Locale, string> = {
  en: "us",
  ja: "jp",
  de: "de",
  fr: "fr",
  es: "es",
  it: "it",
  ko: "kr",
  "zh-TW": "tw",
  ru: "ru",
  // Arabic is a cross-border language; picking one country flag for a lang
  // imposes a political framing. UAE is chosen because it's the priority
  // GCC market for Sericia's Japan-origin D2C and has the clearest Japan
  // food import channel — aligned with our EMS routing economics.
  ar: "ae",
};

function stripLocalePrefix(path: string): string {
  for (const l of LOCALES) {
    if (path === `/${l}`) return "/";
    if (path.startsWith(`/${l}/`)) return path.slice(l.length + 1);
  }
  return path;
}

export default function LocaleSwitcher() {
  const current = useLocale() as Locale;
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState<Locale | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function switchTo(next: Locale) {
    if (next === current) {
      setOpen(false);
      return;
    }
    setSwitching(next);
    setOpen(false);

    // 1. Set NEXT_LOCALE cookie client-side (1 year).
    //    The middleware's rewrite branch only sets the cookie when a locale
    //    prefix is present. Without this line, navigating from /fr/... to /
    //    would leave NEXT_LOCALE=fr and server components keep rendering French.
    const maxAge = 60 * 60 * 24 * 365;
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=${maxAge}; samesite=lax`;

    // 2. Compute target URL (default locale `en` is unprefixed).
    const base = stripLocalePrefix(pathname);
    const target = next === "en" ? base : `/${next}${base === "/" ? "" : base}`;

    // 3. Hard navigation forces the middleware to re-run with the fresh
    //    cookie, re-imports the correct message bundle, and guarantees
    //    every server component re-renders with the new locale. Soft
    //    (router.replace) was the source of the "stuck on French" bug:
    //    middleware doesn't rewrite on client-side transitions, so the
    //    old cookie persisted and the messages never reloaded.
    window.location.assign(target || "/");
  }

  return (
    <div className="relative">
      {/*
        Button label: flag + chevron only (no visible text locale label).
        The selected language is still communicated via the flag (visual) and
        the `aria-label` (screen readers). The dropdown list below renders
        `LOCALE_LABELS[l]` next to each flag so users always know what they
        are picking — we just drop the redundant "English" text from the
        collapsed button to free up header width on mobile.
      */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Change language (current: ${LOCALE_LABELS[current]})`}
        className="inline-flex items-center gap-1.5 p-1.5 hover:text-sericia-ink transition"
      >
        <span
          aria-hidden
          className={`fi fi-${FLAG_CODES[current]} inline-block`}
          style={{ width: "20px", height: "15px", borderRadius: "1.5px", boxShadow: "0 0 0 0.5px rgba(33,35,29,0.15)" }}
        />
        <svg
          aria-hidden
          viewBox="0 0 10 6"
          className={`w-[10px] h-[6px] transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M1 1l4 4 4-4" stroke="currentColor" fill="none" strokeWidth="1.2" />
        </svg>
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div
            role="listbox"
            aria-label="Languages"
            className="absolute right-0 top-full mt-3 w-52 border border-sericia-line bg-sericia-paper z-20 shadow-[0_10px_40px_-20px_rgba(33,35,29,0.25)]"
          >
            {LOCALES.map((l) => (
              <button
                key={l}
                type="button"
                role="option"
                aria-selected={l === current}
                onClick={() => switchTo(l)}
                disabled={switching !== null}
                className={`flex w-full items-center gap-3 text-left px-4 py-2.5 text-[13px] transition ${
                  l === current
                    ? "bg-sericia-ink text-sericia-paper"
                    : "text-sericia-ink hover:bg-sericia-paper-card"
                } ${switching === l ? "opacity-60" : ""}`}
              >
                <span
                  aria-hidden
                  className={`fi fi-${FLAG_CODES[l]} inline-block shrink-0`}
                  style={{ width: "22px", height: "16px", borderRadius: "2px", boxShadow: "0 0 0 0.5px rgba(33,35,29,0.18)" }}
                />
                <span className="flex-1">{LOCALE_LABELS[l]}</span>
                {l === current && (
                  <span aria-hidden className="text-[11px] tracking-[0.18em]">•</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
