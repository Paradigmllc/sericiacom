import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { PPP } from "@/lib/ppp";

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: { headers: req.headers } });

  // Country cookie (PPP)
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
        res = NextResponse.next({ request: { headers: req.headers } });
        for (const { name, value, options } of cookiesToSet) {
          res.cookies.set(name, value, options as CookieOptions);
        }
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  // Guard /account/* routes
  const path = req.nextUrl.pathname;
  if (path.startsWith("/account") && !user) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirect", path);
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
