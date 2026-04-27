/**
 * Payload SiteSettings fetcher — site-wide editorial content.
 *
 * Mirrors `payload-blocks.ts`'s contract: silent-fallback so a Payload outage
 * cannot 500 the storefront. If the global is unreachable or unsaved, we
 * return `null` and consumer components fall back to their hardcoded defaults
 * — the brand still renders correctly.
 *
 * Caching: `cache()` memoises per-request so layout + hero + announcement
 * bar all share a single Payload query within the same render pass.
 */

import { cache } from "react";
import { getPayloadClient } from "./payload";
import type { SiteSetting } from "../payload-types";

/**
 * Public shape — what `useSettings()` exposes to client components.
 *
 * We deliberately expose the WHOLE settings object rather than narrow
 * sub-trees so any component can drill in via `settings.announcementBar?.items`
 * etc. Components must defensively handle null at every level (the editor
 * may not have filled every field yet).
 *
 * Source of truth: storefront/globals/SiteSettings.ts. After every schema
 * change, regenerate with `npx payload generate:types`.
 */
export type SiteSettingsValue = SiteSetting | null;

async function fetchSiteSettings(locale: string): Promise<SiteSettingsValue> {
  try {
    const payload = await getPayloadClient();
    const settings = await payload.findGlobal({
      slug: "siteSettings",
      // depth:1 resolves the optional `seoDefaults.defaultOgImage` Media
      // relationship. heroCopy / announcementBar are inline groups so
      // they don't need extra depth.
      depth: 1,
      // next-intl's locale string ("en", "ja", "zh-TW", "ar", ...) is
      // already the same shape Payload expects, since both pull from the
      // shared 10-locale list defined in payload.config.ts.
      locale: locale as never,
      fallbackLocale: "en" as never,
    });
    return settings ?? null;
  } catch (err) {
    console.error("[payload-settings] fetch failed, defaults will render", err);
    return null;
  }
}

/**
 * Per-request memoised fetcher. Pass the active next-intl locale so Payload
 * returns the correct localised group (heroCopy.headlineLine1 etc).
 */
export const getSiteSettings = cache(fetchSiteSettings);
