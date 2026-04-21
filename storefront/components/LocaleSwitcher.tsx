"use client";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { LOCALE_LABELS, type Locale } from "@/i18n/routing";

const LOCALES: Locale[] = ["en", "ja", "de", "fr", "es", "it", "ko", "zh-TW"];

function stripLocalePrefix(path: string): string {
  for (const l of LOCALES) {
    if (path === `/${l}`) return "/";
    if (path.startsWith(`/${l}/`)) return path.slice(l.length + 1);
  }
  return path;
}

export default function LocaleSwitcher() {
  const current = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  function switchTo(next: Locale) {
    setOpen(false);
    const base = stripLocalePrefix(pathname);
    const target = next === "en" ? base : `/${next}${base === "/" ? "" : base}`;
    startTransition(() => {
      router.replace(target);
      router.refresh();
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Change language"
        className="hover:text-sericia-ink transition uppercase tracking-wider"
      >
        {LOCALE_LABELS[current]}
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
          <div className="absolute right-0 top-full mt-3 w-44 border border-sericia-line bg-sericia-paper z-20">
            {LOCALES.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => switchTo(l)}
                className={`block w-full text-left px-4 py-2.5 text-[13px] transition ${
                  l === current
                    ? "bg-sericia-ink text-sericia-paper"
                    : "text-sericia-ink hover:bg-sericia-paper-card"
                }`}
              >
                {LOCALE_LABELS[l]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
