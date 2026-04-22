"use client";

/**
 * CouponBanner — Aesop-style static launch-discount strip.
 *
 * Design principles:
 *   • NO popup, NO modal — static paper-deep bar at the top
 *   • Copy is matter-of-fact ("Ten percent off your first order") — not
 *     "🔥 LIMITED TIME 🔥" hype. Luxury brands signal value through
 *     quiet specificity
 *   • Dismissible. localStorage key so it stays dismissed per-visitor
 *   • Rendered ABOVE SiteHeader via RootLayout, so announcement sits at
 *     the very top of the page (matches Aesop/Bokksu pattern)
 *
 * Storage contract:
 *   localStorage["sericia:coupon-banner-dismissed"] = "1" (undated — dismiss is permanent
 *   until we rotate the coupon code, in which case we'll bump the storage key)
 *
 * Copy rotation: `CODE` is single source of truth. Checkout reads the same
 * constant via import so the applied discount actually matches what's shown.
 */

import { useEffect, useState } from "react";
import Link from "next/link";

export const LAUNCH_COUPON_CODE = "SERICIA10";
export const LAUNCH_COUPON_PERCENT = 10;
const STORAGE_KEY = "sericia:coupon-banner-dismissed-v1";

export default function CouponBanner() {
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
  }, []);

  function handleDismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Non-fatal: banner will just re-show next reload in privacy mode
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Launch promotion"
      className="relative border-b border-sericia-line bg-sericia-paper-deep"
    >
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-2.5 flex items-center justify-between gap-6">
        <p className="text-[11px] md:text-[12px] tracking-[0.18em] uppercase text-sericia-ink-soft text-center flex-1">
          Launch offer —{" "}
          <span className="text-sericia-ink">
            {LAUNCH_COUPON_PERCENT}% off your first order
          </span>{" "}
          with code{" "}
          <Link
            href={`/checkout?code=${LAUNCH_COUPON_CODE}`}
            className="inline-block border-b border-sericia-ink/60 hover:border-sericia-ink text-sericia-ink font-medium"
          >
            {LAUNCH_COUPON_CODE}
          </Link>
        </p>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss launch offer"
          className="text-sericia-ink-mute hover:text-sericia-ink text-[14px] leading-none shrink-0 w-6 h-6 inline-flex items-center justify-center"
        >
          ×
        </button>
      </div>
    </div>
  );
}
