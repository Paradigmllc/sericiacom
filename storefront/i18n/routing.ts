import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // `ar` (Arabic) is RTL. The app's `<html dir>` attribute is derived from
  // this locale in app/layout.tsx — see RTL_LOCALES there. next-intl itself
  // has no notion of direction; we handle it at the layout edge.
  locales: ["en", "ja", "de", "fr", "es", "it", "ko", "zh-TW", "ru", "ar"] as const,
  defaultLocale: "en",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];

// Locales whose primary script is written right-to-left. Kept tiny and
// exported so consumers (layout, LocaleSwitcher, future utilities) share
// one source of truth — never sprinkle `locale === "ar"` checks around.
export const RTL_LOCALES: ReadonlyArray<Locale> = ["ar"];

export function isRtlLocale(locale: Locale): boolean {
  return (RTL_LOCALES as ReadonlyArray<string>).includes(locale);
}

// Native-name labels — avoid country-biased abbreviations (e.g. "EN" paired
// with 🇬🇧 implied UK-only and excluded US shoppers). Single `en` locale
// serves both US and UK via hreflang country-specific guide pages.
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  ja: "日本語",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  it: "Italiano",
  ko: "한국어",
  "zh-TW": "繁體中文",
  ru: "Русский",
  ar: "العربية",
};
