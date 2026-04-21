import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ja", "de", "fr", "es", "it", "ko", "zh-TW"] as const,
  defaultLocale: "en",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  ja: "日本語",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  it: "Italiano",
  ko: "한국어",
  "zh-TW": "繁體中文",
};
