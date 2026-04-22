"use client";

/**
 * ReferralCookieSetter
 *
 * Client-side sniffer for the `?ref=CODE` query param on any landing page.
 * When present, stores the code in a 60-day cookie so that:
 *   • The checkout page can pre-fill the referral field.
 *   • The order-create API can read it on submit (cookies are available via
 *     next/headers#cookies in server-side route handlers).
 *
 * Why cookie over localStorage:
 *   localStorage is client-only. The order-create API needs server-side
 *   access to issue the redemption log row — cookies give us both.
 *
 * Why client-side over middleware:
 *   middleware.ts runs on every request and would re-set the cookie on every
 *   navigation. Client-only runs once on landing, which is cheaper and makes
 *   the cookie TTL honest (set on first touch, not on every click).
 *
 * Security notes:
 *   • Code is sanitized to /^[A-Z0-9-]{3,32}$/ before writing.
 *   • SameSite=Lax so the cookie survives top-level navigations from referrer
 *     links (Twitter, email) but doesn't leak cross-site.
 *   • No httpOnly because we need JS access to pre-fill the checkout field.
 *     The value is non-sensitive (a referral code, not a token).
 */

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export const REFERRAL_COOKIE_NAME = "sericia_ref";
export const REFERRAL_COOKIE_TTL_SECONDS = 60 * 60 * 24 * 60; // 60 days

export default function ReferralCookieSetter() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof document === "undefined") return;
    const raw = searchParams.get("ref");
    if (!raw) return;

    const code = raw.trim().toUpperCase();
    // Sanity check — mirrors the server-side validator's accepted charset.
    if (!/^[A-Z0-9-]{3,32}$/.test(code)) return;

    // Don't overwrite a live code with the same value — avoids TTL reset spam
    // on users who bookmark the ?ref= URL.
    const existing = readCookie(REFERRAL_COOKIE_NAME);
    if (existing === code) return;

    document.cookie = [
      `${REFERRAL_COOKIE_NAME}=${code}`,
      `Max-Age=${REFERRAL_COOKIE_TTL_SECONDS}`,
      "Path=/",
      "SameSite=Lax",
      typeof location !== "undefined" && location.protocol === "https:" ? "Secure" : "",
    ].filter(Boolean).join("; ");
  }, [pathname, searchParams]);

  return null;
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}
