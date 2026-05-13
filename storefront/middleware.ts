import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { PPP } from "@/lib/ppp";

const ADMIN_COOKIE = "sericia_admin";

// Locales supported. Keep in sync with i18n/routing.ts.
const LOCALES = ["en", "ja", "de", "fr", "es", "it", "ko", "zh-TW", "ru", "ar"] as const;
const DEFAULT_LOCALE = "en";
const LOCALE_COOKIE = "NEXT_LOCALE";

// Country-code → locale compatibility map.
// Users (and bots) frequently type country codes expecting them to work
// as locale prefixes: /jp/products → 404 was breaking the "I'm in Japan"
// mental model. Next-intl uses ISO 639-1 language codes (ja, en, de...)
// but we map common country codes so /jp/... → /ja/..., /us/... → /...,
// etc. 308 (Permanent Redirect) preserves the request method and signals
// to search engines that the locale-prefixed form is canonical.
//
// Arabic coverage (ar): GCC + Levant + North Africa. UAE/SA are the priority
// markets for Sericia (high-income Japan-food demand); the rest are included
// so a pasted `/eg/...` or `/ma/...` URL doesn't 404.
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
  sa: "ar", ae: "ar", eg: "ar", ma: "ar", qa: "ar", kw: "ar",
  bh: "ar", om: "ar", jo: "ar", lb: "ar",
  arab: "ar", ara: "ar",
};

// Paths that are NOT covered by i18n (flat, always English).
//
// Originally this list also included /guides /tools /privacy /terms /refund
// /shipping — historical because those page bodies were English-only at
// the time. F19+F24 localized all those heros via getTranslations() and
// added /ja/refund/request which depends on the locale segment surviving
// the middleware.
//
// Now only **infrastructure routes** are non-i18n:
//   /admin  — internal admin UI
//   /api    — JSON endpoints (locale provided via header / cookie if needed)
//   /cms    — Payload admin + REST/GraphQL (Payload handles its own routing)
//   /pay    — single-purpose Crossmint redirect target; no locale-specific UI
//   /auth   — Supabase OAuth callbacks
const NON_I18N_PREFIXES = [
  "/admin",
  "/api",
  "/cms",
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

// ── F16 rate limiter (in-memory, per-instance) ───────────────────────────
// Sliding window: N requests per window per IP, scoped to /api/*. The
// objective is NOT distributed-DDoS protection (Cloudflare WAF is the
// right layer for that) — it's stopping a single client from hammering
// /api/dify-chat or /api/orders/create-cart in a script and exhausting
// the storefront's CPU. Map is per-process so a redeploy resets the
// counters; that's acceptable for the threat model.
const RATE_LIMIT_BUCKETS = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 60_000; // 60s window
const RATE_MAX_API = 60; // /api/* — 1 req/sec sustained per IP
const RATE_MAX_DIFY = 20; // /api/dify-chat — chat is more expensive
const RATE_MAX_ORDER = 30; // /api/orders/* — protect cart create
const PROTECTED_PREFIXES = ["/api/"] as const;

function clientIp(req: NextRequest): string {
  // Cloudflare → CF-Connecting-IP, fallback to x-forwarded-for first hop,
  // fallback to remoteAddress (always present in Next.js)
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

function rateLimit(req: NextRequest, path: string): NextResponse | null {
  if (!PROTECTED_PREFIXES.some((p) => path.startsWith(p))) return null;
  // Skip the auth callback / health-style endpoints that take real bursts
  // during legitimate flows (multiple OAuth callbacks land in <1s).
  if (path.startsWith("/api/auth/")) return null;

  const ip = clientIp(req);
  const max = path.startsWith("/api/dify-chat")
    ? RATE_MAX_DIFY
    : path.startsWith("/api/orders/")
      ? RATE_MAX_ORDER
      : RATE_MAX_API;
  const key = `${ip}|${path.split("/").slice(0, 3).join("/")}`; // group by /api/<route>
  const now = Date.now();
  const cur = RATE_LIMIT_BUCKETS.get(key);
  if (!cur || cur.resetAt < now) {
    RATE_LIMIT_BUCKETS.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return null;
  }
  cur.count += 1;
  if (cur.count > max) {
    const retryAfter = Math.max(1, Math.ceil((cur.resetAt - now) / 1000));
    return new NextResponse(
      JSON.stringify({ error: "rate_limited", retryAfter }),
      {
        status: 429,
        headers: {
          "content-type": "application/json",
          "retry-after": String(retryAfter),
          "x-ratelimit-limit": String(max),
          "x-ratelimit-remaining": "0",
          "x-ratelimit-reset": String(Math.ceil(cur.resetAt / 1000)),
        },
      },
    );
  }
  return null;
}

// Periodic cleanup so the Map doesn't leak forever. Runs lazily —
// every 1000th request triggers a sweep of expired buckets.
let _cleanupTick = 0;
function maybeCleanup() {
  _cleanupTick = (_cleanupTick + 1) % 1000;
  if (_cleanupTick !== 0) return;
  const now = Date.now();
  for (const [k, v] of RATE_LIMIT_BUCKETS) {
    if (v.resetAt < now) RATE_LIMIT_BUCKETS.delete(k);
  }
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Rate limit gate (runs first so we never spend CPU on rejected reqs).
  const limited = rateLimit(req, path);
  if (limited) return limited;
  maybeCleanup();

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

  // --- F68 — disable Cloudflare HTML transformations (Auto Minify) ---
  // Cloudflare's Auto Minify HTML feature was stripping `<!DOCTYPE html>`
  // and the opening `<html>` tag from cached responses (confirmed by
  // bypassing CF with `curl https://46.62.217.172/` -H "Host: sericia.com"
  // which returned proper `<!DOCTYPE html><html lang="en" dir="ltr" ...>`).
  // The HTTP-standard signal to tell intermediaries "do not transform this
  // payload" is `Cache-Control: no-transform`. CF docs explicitly honour it
  // for Auto Minify and Polish.
  //
  // We APPEND no-transform without overwriting the page-level cache-control
  // because pages set their own `revalidate` (private, max-age=N) values.
  // If the page didn't set anything, default to a safe `no-store` for
  // dynamic surfaces (signal NOT to cache + NOT to transform).
  const existing = res.headers.get("cache-control");
  if (existing) {
    if (!existing.includes("no-transform")) {
      res.headers.set("cache-control", `${existing}, no-transform`);
    }
  } else {
    res.headers.set("cache-control", "no-transform");
  }

  // --- Supabase SSR session refresh (GATED) ---
  // PERF: pre-F69 every page request hit Supabase auth REST to call
  // `getUser()`, even for guests who never need an auth check. That cost
  // 100–300ms on every TTFB across the site. F69 gates the auth check so
  // it ONLY runs when the request actually targets a protected surface
  // (/account/*). Guests on /, /products, /journal, /guides, /tools, etc.
  // skip the round-trip entirely → TTFB -100~300ms site-wide.
  //
  // We still need Supabase cookies set by the auth callback to flow through
  // so the account pages, when finally hit, recognize the session. Those
  // cookies live on the request already; we just don't *validate* them on
  // every page unless we'll actually use them.
  const accountGuard = /^\/(en|ja|de|fr|es|it|ko|zh-TW|ru|ar)?\/?account(\/|$)/;
  if (!accountGuard.test(path)) return res;

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

  if (!user) {
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
