"use client";

import { useTranslations } from "next-intl";
import HeaderClient from "./HeaderClient";
import HeaderShell from "./HeaderShell";
import Logo from "./Logo";
import AnnouncementBar from "./AnnouncementBar";
import RegionBanner from "./RegionBanner";
import { useSettings } from "./SettingsProvider";
import MegaMenuController, { type MegaMenuItem } from "./MegaMenu";

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
  // Each item carries an optional `mega` group; when enabled, the controller
  // renders an Aesop-style hover panel below the nav row instead of a flat link.
  let items: MegaMenuItem[];
  if (navItems.length > 0) {
    items = navItems.map((it) => ({
      label: it.label,
      url: it.url,
      highlighted: !!it.highlighted,
      mega: it.mega ?? null,
    }));
  } else {
    items = [
      {
        label: t("shop"),
        url: "/products",
        // Coded fallback mega for "Shop" — when editor hasn't filled CMS,
        // we still want category discovery on hover. Empty CMS = brand
        // baseline; CMS edits override entirely.
        mega: {
          enabled: true,
          columns: [
            {
              title: "Categories",
              links: [
                { label: "All teas", url: "/products?category=tea" },
                { label: "Miso", url: "/products?category=miso" },
                { label: "Mushrooms", url: "/products?category=mushroom" },
                { label: "Seasonings", url: "/products?category=seasoning" },
                { label: "View all", url: "/products" },
              ],
            },
            {
              title: "Notable",
              links: [
                { label: "Drop No. 01", url: "/products/drop-001-tea-miso-shiitake" },
                { label: "Uji Sencha", url: "/products/uji-sencha-50g" },
                { label: "Aichi Mame-Miso", url: "/products/aichi-mame-miso-500g" },
                { label: "Oita Donko Shiitake", url: "/products/oita-donko-shiitake-50g" },
              ],
            },
          ],
          featuredCards: [
            {
              title: "Discover the current drop",
              caption: "50 units, single curated bundle.",
              url: "/#drop",
              tone: "drop",
            },
            {
              title: "Browse by region",
              caption: "From Uji to Hokkaido.",
              url: "/guides",
              tone: "tea",
            },
          ],
        },
      },
      { label: t("current_drop"), url: "/#drop" },
      {
        label: t("guides"),
        url: "/guides",
        mega: {
          enabled: true,
          columns: [
            {
              title: "Country guides",
              links: [
                { label: "United States", url: "/guides/us" },
                { label: "United Kingdom", url: "/guides/gb" },
                { label: "Germany", url: "/guides/de" },
                { label: "France", url: "/guides/fr" },
                { label: "Australia", url: "/guides/au" },
              ],
            },
            {
              title: "Tools",
              links: [
                { label: "Tea brewer", url: "/tools/tea-brewer" },
                { label: "Matcha grade", url: "/tools/matcha-grade" },
                { label: "Miso finder", url: "/tools/miso-finder" },
                { label: "EMS calculator", url: "/tools/ems-calculator" },
              ],
            },
          ],
          featuredCards: [
            {
              title: "Journal",
              caption: "Stories from the producers.",
              url: "/journal",
              tone: "paper",
            },
          ],
        },
      },
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
          <nav className="hidden md:block text-[13px] text-sericia-ink-soft tracking-wider">
            <MegaMenuController items={items} />
          </nav>
          <HeaderClient />
        </div>
      </HeaderShell>
      <RegionBanner />
    </>
  );
}
