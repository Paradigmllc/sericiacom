import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

export default getRequestConfig(async () => {
  // The app does not use a [locale] segment — the middleware strips the
  // locale prefix via rewrite and sets NEXT_LOCALE cookie. Read the cookie
  // here so server components pick up the correct translations.
  const store = await cookies();
  const fromCookie = store.get("NEXT_LOCALE")?.value;
  const locale = hasLocale(routing.locales, fromCookie) ? fromCookie : routing.defaultLocale;
  const messages = (await import(`../messages/${locale}.json`)).default;
  return { locale, messages };
});
