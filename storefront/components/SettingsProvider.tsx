"use client";

/**
 * SettingsProvider — bridges server-fetched Payload SiteSettings into the
 * client component tree.
 *
 * Why a client provider:
 *   The storefront has many client components (CinematicHero needs
 *   framer-motion; AnnouncementBar runs CSS animations; client tools/* pages
 *   transitively render SiteHeader + AnnouncementBar). They cannot await
 *   server-only fetchers, but they all need the same SiteSettings object.
 *
 *   Layout (RSC) fetches once via `getSiteSettings(locale)`, hands the
 *   resolved value to this provider, which exposes it through React Context.
 *   Client components consume via `useSettings()` — zero extra fetches,
 *   zero waterfall.
 *
 * Null-safe by design:
 *   `value` is `SiteSettingsValue` (= `SiteSetting | null`). Consumers MUST
 *   handle null at every drill (`settings?.announcementBar?.items`). When
 *   null, components render their hardcoded defaults — the brand still ships.
 */

import { createContext, useContext, type ReactNode } from "react";
import type { SiteSettingsValue } from "@/lib/payload-settings";

const SettingsContext = createContext<SiteSettingsValue>(null);

type Props = {
  settings: SiteSettingsValue;
  children: ReactNode;
};

export default function SettingsProvider({ settings, children }: Props) {
  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
}

/**
 * Read SiteSettings from anywhere in the client tree.
 *
 * Returns `null` when the layout was unable to fetch (Payload outage,
 * empty global, etc) — consumers should treat null as "use defaults".
 */
export function useSettings(): SiteSettingsValue {
  return useContext(SettingsContext);
}
