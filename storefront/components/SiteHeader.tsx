"use client";

import { useTranslations } from "next-intl";
import HeaderClient from "./HeaderClient";
import HeaderShell from "./HeaderShell";
import Logo from "./Logo";
import AnnouncementBar from "./AnnouncementBar";
import RegionBanner from "./RegionBanner";
import Link from "next/link";
import { useSettings } from "./SettingsProvider";

/**
 * Site header — Phase 3-D: nav items now editor-controlled.
 *
 * Reads `siteSettings.navigation.items[]` via context. If empty, falls
 * back to the coded brand-default 5-link nav (Shop / Current drop /
 * Guides / Our story / Shipping) using next-intl translation keys.
 *
 * Why "use client": uses `useSettings()` from the React-context provider.
 * The /tools/* pages already declare "use client" themselves, so no
 * server/client boundary regressions.
 */
export default function SiteHeader() {
  const t = useTranslations("nav");
  const settings = useSettings();
  const navItems = settings?.navigation?.items ?? [];

  // Build resolved nav: CMS first, hardcoded fallback second.
  type ResolvedNavItem = { label: string; url: string; highlighted?: boolean };
  let items: ResolvedNavItem[];
  if (navItems.length > 0) {
    items = navItems.map((it) => ({
      label: it.label,
      url: it.url,
      highlighted: !!it.highlighted,
    }));
  } else {
    items = [
      { label: t("shop"), url: "/products" },
      { label: t("current_drop"), url: "/#drop" },
      { label: t("guides"), url: "/guides" },
      { label: t("our_story"), url: "/about" },
      { label: t("shipping"), url: "/shipping" },
    ];
  }

  return (
    <>
      <AnnouncementBar />
      <HeaderShell>
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-5 flex items-center justify-between gap-6">
          <Logo href="/" />
          <nav className="hidden md:flex items-center gap-9 text-[13px] text-sericia-ink-soft tracking-wider">
            {items.map((it, i) => {
              const isExternal = /^https?:\/\//i.test(it.url);
              const linkClass = it.highlighted
                ? "text-sericia-ink font-medium hover:opacity-80 transition"
                : "hover:text-sericia-ink transition";
              if (isExternal) {
                return (
                  <a
                    key={`nav-${i}`}
                    href={it.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkClass}
                    data-cursor="link"
                  >
                    {it.label}
                  </a>
                );
              }
              return (
                <Link
                  key={`nav-${i}`}
                  href={it.url}
                  className={linkClass}
                  data-cursor="link"
                >
                  {it.label}
                </Link>
              );
            })}
          </nav>
          <HeaderClient />
        </div>
      </HeaderShell>
      <RegionBanner />
    </>
  );
}
