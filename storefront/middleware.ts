import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { PPP } from "@/lib/ppp";

const ADMIN_COOKIE = "sericia_admin";

// Locales supported. Keep in sync with i18n/routing.ts.
const LOCALES = ["en", "ja", "de", "fr", "es", "it", "ko", "zh-TW", "ru"] as const;
const DEFAULT_LOCALE = "en";
const LOCALE_COOKIE = "NEXT_LOCALE";

// Country-code → locale compatibility map.
// Users (and bots) frequently type country codes expecting them to work
// as locale prefixes: /jp/products → 404 was breaking the "I'm in Japan"
// mental model. Next-intl uses ISO 639-1 language codes (ja, en, de...)
// but we map common country codes so /jp/... → /ja/..., /us/... → /...,
// etc. 308 (Permanent Redirect) preserves the request method and signals
// to search engines that the locale-prefixed form is canonical.
const COUNTRY_TO_LOCALE: Record<string, string> = {
  jp: "ja", jpn: "ja", japan: "ja",
  us: "en", usa: "en", gb: "en", uk: "en",
  ger: "de", deu: "de",
  fra: "fr",
  esp: "es",
  ita: "it",
  kr: "ko", kor: "ko",
  cn: "zh-TW", tw: "zh-TW", hk: "zh-TW", zh: "zh-TW", "zh-cn": "zh-TW",
  rus: "ru",
};

// Paths that are NOT covered by i18n (flat, always English).
// Admin + API + legal + utility pages do not get locale prefixes.
// `/cms` is Payload admin + REST/GraphQL — Payload handles its own routing.
const NON_I18N_PREFIXES = [
  "/admin",
  "/api",
  "/cms",
  "/guides",
  "/tools",
  "/privacy",
  "/terms",
  "/refund",
  "/shipping",
  "/pay",
  "/auth",
];

function stripLocalePrefix(path: string): { locale: string | null; pathWithoutLocale: string } {
  for (const l of LOCALES) {
    if (l === DEFAULT_LOCALE) continue; // default locale has no prefix
    if (path === `/${l}`) return { locale: l, pathWithoutLocale: "/" };
    if (path.startsWith(`/${l}/`)) return { locale: l, pathWithoutLocale: path.slice(l.length + 1) };
  }
  return { locale: null, pathWithoutLocale: path };
}

function isNonI18nPath(path: string): boolean {
  return NON_I18N_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // --- Payload CMS bypass: /cms/admin + /cms/api + any future /cms/* ---
  // Payload handles its own auth, API, and rendering. Skip i18n, admin gate,
  // country cookie, and supabase session refresh entirely.
  if (path.startsWith("/cms")) {
    return NextResponse.next({ request: { headers: req.headers } });
  }

  // --- Redirect /en or /en/* to unprefixed canonical (default locale has no prefix) ---
  if (path === "/en" || path.startsWith("/en/")) {
    const url = req.nextUrl.clone();
    url.pathname = path === "/en" ? "/" : path.slice(3);
    return NextResponse.redirect(url);
  }

  // --- Country-code → locale compatibility redirect ---
  // /jp/products → /ja/products, /us/products → /products, etc.
  // Only the first path segment is inspected; case-insensitive.
  // Skip non-i18n paths (/api, /admin, /cms, /auth) — those are already
  // handled above or further down.
  const firstSeg = path.slice(1).split("/")[0]?.toLowerCase();
  if (firstSeg && firstSeg in COUNTRY_TO_LOCALE) {
    const mappedLocale = COUNTRY_TO_LOCALE[firstSeg];
    const rest = path.slice(firstSeg.length + 1); // keep leading slash or ""
    const url = req.nextUrl.clone();
    if (mappedLocale === DEFAULT_LOCALE) {
      // /us/products → /products (default locale, no prefix)
      url.pathname = rest || "/";
    } else {
      // /jp/products → /ja/products
      url.pathname = `/${mappedLocale}${rest}`;
    }
    return NextResponse.redirect(url, 308);
  }

  // --- Admin gate (runs before everything else) ---
  if (path.startsWith("/admin") && path !== "/admin/login") {
    const secret = process.env.SERICIA_ADMIN_SECRET;
    const provided = req.cookies.get(ADMIN_COOKIE)?.value ?? "";
    if (!secret || provided !== secret) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("redirect", path);
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request: { headers: req.headers } });
  }

  // --- Skip i18n + country cookie + supabase for admin/login, API ---
  if (path.startsWith("/admin/login") || path.startsWith("/api")) {
    return NextResponse.next({ request: { headers: req.headers } });
  }

  // --- i18n: strip locale prefix via rewrite so flat app routes resolve ---
  // For default locale (en) paths are already bare — no rewrite needed.
  // For other locales, we rewrite `/ja/products` -> `/products` while
  // keeping the browser URL at `/ja/products`, and set NEXT_LOCALE cookie
  // so getRequestConfig can pick it up.
  const { locale: prefixLocale, pathWithoutLocale } = stripLocalePrefix(path);

  let res: NextResponse;
  if (prefixLocale && !isNonI18nPath(pathWithoutLocale)) {
    const url = req.nextUrl.clone();
    url.pathname = pathWithoutLocale;
    res = NextResponse.rewrite(url);
    res.cookies.set(LOCALE_COOKIE, prefixLocale, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
  } else if (prefixLocale && isNonI18nPath(pathWithoutLocale)) {
    // e.g. /ja/guides/... — redirect to the unlocalized canonical.
    const url = req.nextUrl.clone();
    url.pathname = pathWithoutLocale;
    return NextResponse.redirect(url);
  } else {
    res = NextResponse.next({ request: { headers: req.headers } });
    // For unprefixed (default locale) paths, we trust the NEXT_LOCALE cookie
    // if already set by the locale switcher client-side. If no cookie at all,
    // default to `en`. If the switcher wrote a non-en cookie without a prefix
    // (shouldn't happen in normal flow) we still respect it so users aren't
    // re-flipped to English unintentionally. Never overwrite a valid cookie.
    const existing = req.cookies.get(LOCALE_COOKIE)?.value;
    if (!existing) {
      res.cookies.set(LOCALE_COOKIE, DEFAULT_LOCALE, {
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
      });
    }
  }

  // --- Country cookie (PPP) ---
  if (!req.cookies.get("country")) {
    const cf = req.headers.get("cf-ipcountry")?.toLowerCase() ?? "";
    const al = req.headers.get("accept-language") ?? "";
    let country = "us";
    if (cf && PPP[cf]) country = cf;
    else if (al.includes("ja")) country = "jp";
    else if (al.includes("de")) country = "de";
    else if (al.includes("fr")) country = "fr";
    else if (al.includes("zh")) country = "hk";
    else if (al.includes("en-GB")) country = "uk";
    else if (al.includes("en-AU")) country = "au";
    res.cookies.set("country", country, { maxAge: 60 * 60 * 24 * 30, path: "/" });
  }

  // --- Supabase SSR session refresh ---
  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supaKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supaUrl || !supaKey) return res;

  const supabase = createServerClient(supaUrl, supaKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          req.cookies.set(name, value);
        }
        for (const { name, value, options } of cookiesToSet) {
          res.cookies.set(name, value, options as CookieOptions);
        }
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  // Guard /account/* (and localized /<locale>/account/*)
  const accountGuard = /^\/(en|ja|de|fr|es|it|ko|zh-TW|ru)?\/?account(\/|$)/;
  if (accountGuard.test(path) && !user) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirect", path);
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)"],
};
