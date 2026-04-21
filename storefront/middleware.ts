import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import createIntlMiddleware from "next-intl/middleware";
import { PPP } from "@/lib/ppp";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

const ADMIN_COOKIE = "sericia_admin";

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // --- Admin gate (runs before i18n) ---
  if (path.startsWith("/admin") && path !== "/admin/login") {
    const secret = process.env.SERICIA_ADMIN_SECRET;
    const provided = req.cookies.get(ADMIN_COOKIE)?.value ?? "";
    if (!secret || provided !== secret) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("redirect", path);
      return NextResponse.redirect(url);
    }
    // admin ok — skip i18n/supabase middleware
    return NextResponse.next({ request: { headers: req.headers } });
  }

  // --- Skip i18n/supabase for /admin/login, /api, static ---
  if (path.startsWith("/admin/login") || path.startsWith("/api")) {
    return NextResponse.next({ request: { headers: req.headers } });
  }

  // --- i18n routing (locale prefix handling) ---
  // Returns a response with locale prefix or rewrites for default locale
  const intlResponse = intlMiddleware(req);

  // intlResponse is a NextResponse; we treat it as our base response
  let res = intlResponse;

  // Country cookie (PPP) — attach to intl response
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

  // Supabase SSR session refresh
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
        // preserve intl rewrites/headers by copying headers from intl response onto fresh response
        const fresh = NextResponse.next({ request: { headers: req.headers } });
        res.headers.forEach((v, k) => {
          if (!fresh.headers.has(k)) fresh.headers.set(k, v);
        });
        res = fresh;
        for (const { name, value, options } of cookiesToSet) {
          res.cookies.set(name, value, options as CookieOptions);
        }
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  // Guard /account/* (and localized /<locale>/account/*)
  const accountGuard = /^\/(en|ja|de|fr|es|it|ko|zh-TW)?\/?account(\/|$)/;
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
