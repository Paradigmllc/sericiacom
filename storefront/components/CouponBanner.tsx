"use client";

/**
 * CouponBanner — Aesop-style static launch-discount strip.
 *
 * Phase 2-C: every visible string + the coupon code itself comes from
 * `siteSettings.couponBanner`. Editor toggles enabled / changes copy /
 * rotates the code without a deploy. The `storageKeyVersion` field gives
 * editors a "force re-show" lever — bumping `v1` → `v2` makes every
 * visitor see the bar again even if they previously dismissed it.
 *
 * Hardcoded fallbacks preserved: when CMS is null/empty, the bar still
 * renders the original "10% off — SERICIA10" launch offer copy.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useSettings } from "./SettingsProvider";

// Default coupon — exported so the checkout page can import the same source.
// When CMS overrides, the storefront uses the CMS value but legacy callsites
// importing this constant continue to compile.
export const LAUNCH_COUPON_CODE = "SERICIA10";
export const LAUNCH_COUPON_PERCENT = 10;

function dismissKey(version: string) {
  return `sericia:coupon-banner-dismissed-${version}`;
}

export default function CouponBanner() {
  const settings = useSettings();
  const cb = settings?.couponBanner;
  const t = useTranslations("coupon_banner");

  // Three-tier resolution: CMS (editor) → next-intl (locale) → emergency literal.
  const enabled = cb?.enabled ?? true;
  const code = (cb?.code?.trim() || LAUNCH_COUPON_CODE).toUpperCase();
  // `prefix` already contains the trailing em-dash in messages files,
  // so we strip it to keep the rendered "{headline} —" pattern symmetric.
  const headlineRaw = cb?.headline?.trim() || t("prefix");
  const headline = headlineRaw.replace(/[\s—-]+$/, "");
  const offerText =
    cb?.offerText?.trim() || t("discount_fmt", { percent: LAUNCH_COUPON_PERCENT });
  const withCodePrefix = cb?.withCodePrefix?.trim() || t("with_code");
  const storageKeyVersion = cb?.storageKeyVersion?.trim() || "v1";
  const STORAGE_KEY = dismissKey(storageKeyVersion);

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const dismissed = window.localStorage.getItem(STORAGE_KEY);
      if (!dismissed) setVisible(true);
    } catch {
      // localStorage can throw in privacy modes — surface banner anyway
      setVisible(true);
    }
  }, [STORAGE_KEY]);

  function handleDismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Non-fatal: banner will just re-show next reload in privacy mode
    }
    setVisible(false);
  }

  if (!enabled) return null;
  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label={t("region_label")}
      className="relative border-b border-sericia-line bg-sericia-paper-deep"
    >
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-2.5 flex items-center justify-between gap-6">
        <p className="text-[11px] md:text-[12px] tracking-[0.18em] uppercase text-sericia-ink-soft text-center flex-1">
          {headline} —{" "}
          <span className="text-sericia-ink">{offerText}</span>{" "}
          {withCodePrefix}{" "}
          <Link
            href={`/checkout?code=${code}`}
            className="inline-block border-b border-sericia-ink/60 hover:border-sericia-ink text-sericia-ink font-medium"
          >
            {code}
          </Link>
        </p>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label={t("dismiss_label")}
          className="text-sericia-ink-mute hover:text-sericia-ink text-[14px] leading-none shrink-0 w-6 h-6 inline-flex items-center justify-center"
        >
          ×
        </button>
      </div>
    </div>
  );
}
