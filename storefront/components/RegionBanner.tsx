"use client";

/**
 * RegionBanner — Phase 3-E.
 *
 * Renders a region-specific banner directly under the SiteHeader. The
 * editor configures a list in `siteSettings.regionBanners[]`. Each entry
 * declares a region code (matches Sericia's 9 region slugs:
 * jp/us/eu/gb/ca/au/sg/hk/me) and localised text.
 *
 * Region resolution:
 *   1. Read `country` cookie set by the country-redirect middleware
 *      (P0-D feature — already in production).
 *   2. Map the cookie's lowercase ISO code to a region slug.
 *   3. First matching enabled banner wins; later matches are ignored.
 *
 * Renders nothing if:
 *   • settings is null (Payload outage)
 *   • regionBanners array is empty
 *   • no banner matches the user's country
 *   • the matching banner has enabled=false
 *
 * Style: thin paper-card stripe under the header. Quiet by design — meant
 * to communicate region-specific facts (free shipping thresholds, local
 * compliance notes) not promotions (those go in CouponBanner).
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSettings } from "./SettingsProvider";

// ISO country code → Sericia region slug. Mirrors the storefront's
// `lib/medusa.ts` region resolution table.
const COUNTRY_TO_REGION: Record<string, string> = {
  // Japan
  jp: "jp",
  // United States
  us: "us",
  // EU members (subset — extend as needed)
  de: "eu", fr: "eu", es: "eu", it: "eu", nl: "eu", be: "eu",
  at: "eu", pt: "eu", ie: "eu", fi: "eu", dk: "eu",
  // United Kingdom
  gb: "gb", uk: "gb",
  // Canada
  ca: "ca",
  // Australia
  au: "au", nz: "au",
  // Singapore
  sg: "sg",
  // Hong Kong
  hk: "hk",
  // Middle East
  ae: "me", sa: "me", qa: "me", kw: "me", bh: "me", om: "me",
};

function readCountryCookie(): string {
  if (typeof document === "undefined") return "us";
  const match = document.cookie.match(/(?:^|;\s*)country=([^;]+)/);
  return (match?.[1] ?? "us").toLowerCase();
}

export default function RegionBanner() {
  const settings = useSettings();
  const [country, setCountry] = useState<string>("us");

  useEffect(() => {
    setCountry(readCountryCookie());
  }, []);

  const banners = settings?.regionBanners ?? [];
  const region = COUNTRY_TO_REGION[country] ?? "us";

  // Find the first enabled banner matching the resolved region.
  const match = useMemo(
    () =>
      banners.find(
        (b) => (b.enabled ?? true) && b.regionCode === region && b.text?.trim().length > 0,
      ),
    [banners, region],
  );

  if (!match) return null;

  const text = match.text;
  const url = match.url?.trim();
  const isExternal = url && /^https?:\/\//i.test(url);

  return (
    <div
      role="region"
      aria-label="Region notice"
      className="border-b border-sericia-line bg-sericia-paper-card"
    >
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-2.5 flex items-center justify-center gap-6">
        <p className="text-[11px] md:text-[12px] tracking-[0.18em] uppercase text-sericia-ink-soft text-center">
          {url ? (
            isExternal ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-sericia-ink transition-colors underline-offset-4 hover:underline"
              >
                {text}
              </a>
            ) : (
              <Link href={url} className="hover:text-sericia-ink transition-colors underline-offset-4 hover:underline">
                {text}
              </Link>
            )
          ) : (
            <span>{text}</span>
          )}
        </p>
      </div>
    </div>
  );
}
