import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import FooterSubscribeForm from "./FooterSubscribeForm";

/**
 * Rich footer, Aesop-tier — five vertical bands (top → bottom):
 *
 *   1. Editorial + subscribe    — sets the mood, harvests the email
 *   2. Four-column link grid    — Shop / Tools / Company / Support
 *   3. Social + contact row     — Instagram, email, phone, studio hours
 *   4. Locale acknowledgement   — "Currently viewing: English" helper
 *   5. Legal micro-row          — copyright + legal/privacy/cookies
 *
 * Kept server-friendly: `useTranslations` and `useLocale` work in both
 * server and client trees under NextIntlClientProvider, so the existing
 * `/tools/*` client-component pages can continue to import SiteFooter
 * without hitting the "`getTranslations` is not supported in Client
 * Components" runtime error that blocked the pre-refactor version.
 *
 * The email form is the only client component here — imported via a
 * separate file so this parent stays shareable.
 */

// Native labels per locale — mirrors LocaleSwitcher so the "Currently
// viewing" hint at the bottom uses the same word the header uses.
const LOCALE_NATIVE: Record<string, string> = {
  en: "English",
  ja: "日本語",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  it: "Italiano",
  ko: "한국어",
  "zh-TW": "繁體中文",
  ru: "Русский",
};

export default function SiteFooter() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");
  const locale = useLocale();
  const localeLabel = LOCALE_NATIVE[locale] ?? "English";

  return (
    <footer className="bg-sericia-paper-deep text-sericia-ink">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12">
        {/* Band 1 — Editorial + Subscribe */}
        <section className="py-20 md:py-28 border-b border-sericia-ink/10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            <div className="lg:col-span-7">
              <p className="text-[11px] tracking-[0.3em] uppercase text-sericia-ink-mute mb-6">
                Quietly, from Kyoto
              </p>
              <h2 className="text-[28px] md:text-[40px] leading-[1.12] font-normal tracking-tight max-w-[520px]">
                Four to six times a year, we open the door.
              </h2>
            </div>
            <div className="lg:col-span-5">
              <p className="text-[14px] md:text-[15px] text-sericia-ink-soft leading-[1.8] mb-7 max-w-md">
                Each drop is a small curated set from Japanese producers — surplus craft food
                rescued before disposal, hand-packed in our Kyoto studio, shipped via EMS
                within forty-eight hours. Subscribe to be notified a day before the next
                release, alongside the occasional essay from the producers themselves.
              </p>
              <FooterSubscribeForm />
              <p className="mt-4 text-[11px] text-sericia-ink-mute tracking-wide max-w-md leading-relaxed">
                We write sparingly — no more than once a month. One-click unsubscribe, no
                third-party sharing. See our{" "}
                <Link href="/privacy" className="underline-link">
                  privacy policy
                </Link>
                .
              </p>
            </div>
          </div>
        </section>

        {/* Band 2 — Link grid */}
        <section className="py-16 md:py-20 border-b border-sericia-ink/10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8">
            <div>
              <p className="label mb-5">{t("shop")}</p>
              <ul className="space-y-3 text-[14px] text-sericia-ink-soft">
                <li>
                  <Link href="/products" className="hover:text-sericia-ink transition-colors">
                    {tNav("shop")}
                  </Link>
                </li>
                <li>
                  <Link href="/#drop" className="hover:text-sericia-ink transition-colors">
                    {tNav("current_drop")}
                  </Link>
                </li>
                <li>
                  <Link href="/#waitlist" className="hover:text-sericia-ink transition-colors">
                    Next-drop waitlist
                  </Link>
                </li>
                <li>
                  <Link href="/guides" className="hover:text-sericia-ink transition-colors">
                    {tNav("guides")}
                  </Link>
                </li>
                <li>
                  <Link href="/journal" className="hover:text-sericia-ink transition-colors">
                    Journal
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="label mb-5">Tools</p>
              <ul className="space-y-3 text-[14px] text-sericia-ink-soft">
                <li>
                  <Link href="/tools/ems-calculator" className="hover:text-sericia-ink transition-colors">
                    EMS calculator
                  </Link>
                </li>
                <li>
                  <Link href="/tools/matcha-grade" className="hover:text-sericia-ink transition-colors">
                    Matcha grade finder
                  </Link>
                </li>
                <li>
                  <Link href="/tools/miso-finder" className="hover:text-sericia-ink transition-colors">
                    Miso style finder
                  </Link>
                </li>
                <li>
                  <Link href="/tools/shelf-life" className="hover:text-sericia-ink transition-colors">
                    Shelf-life estimator
                  </Link>
                </li>
                <li>
                  <Link href="/tools/tea-brewer" className="hover:text-sericia-ink transition-colors">
                    Japanese tea brewer
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="label mb-5">{t("company")}</p>
              <ul className="space-y-3 text-[14px] text-sericia-ink-soft">
                <li>
                  <Link href="/about" className="hover:text-sericia-ink transition-colors">
                    {tNav("our_story")}
                  </Link>
                </li>
                <li>
                  <Link href="/shipping" className="hover:text-sericia-ink transition-colors">
                    {tNav("shipping")}
                  </Link>
                </li>
                <li>
                  <Link href="/refund" className="hover:text-sericia-ink transition-colors">
                    Refunds &amp; returns
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-sericia-ink transition-colors">
                    Terms of sale
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-sericia-ink transition-colors">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/tokushoho" className="hover:text-sericia-ink transition-colors">
                    特定商取引法
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="label mb-5">{t("support")}</p>
              <ul className="space-y-3 text-[14px] text-sericia-ink-soft">
                <li>
                  <a
                    href="mailto:contact@sericia.com"
                    className="hover:text-sericia-ink transition-colors underline-offset-4 hover:underline"
                  >
                    contact@sericia.com
                  </a>
                </li>
                <li>
                  <a
                    href="tel:+81-50-3120-3706"
                    className="hover:text-sericia-ink transition-colors"
                  >
                    +81 050-3120-3706
                  </a>
                </li>
                <li className="text-sericia-ink-mute pt-1 text-[12px] leading-[1.7]">
                  Mon–Fri · 10:00–18:00 JST
                  <br />
                  Email replies within one business day.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Band 3 — Studio + Social */}
        <section className="py-14 border-b border-sericia-ink/10">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 md:gap-10 items-start md:items-center">
            <div>
              <p className="label mb-3">Studio</p>
              <p className="text-[14px] text-sericia-ink-soft leading-[1.75] max-w-xl">
                Paradigm LLC — registered in Delaware, USA. Operating brand: Sericia.
                Drops packed and dispatched from Kyoto, Japan; full corporate address
                disclosed per{" "}
                <Link href="/tokushoho" className="underline-link">
                  特定商取引法
                </Link>
                .
              </p>
            </div>
            <div className="flex items-center gap-5">
              <a
                href="https://www.instagram.com/sericia.official"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Sericia on Instagram"
                className="inline-flex h-10 w-10 items-center justify-center border border-sericia-ink/20 hover:border-sericia-ink hover:bg-sericia-ink hover:text-sericia-paper transition-colors"
              >
                {/* Instagram glyph — hand-coded to avoid pulling in an icon lib */}
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <rect x="3" y="3" width="18" height="18" rx="4" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="0.7" fill="currentColor" />
                </svg>
              </a>
              <a
                href="mailto:contact@sericia.com"
                aria-label="Email Sericia"
                className="inline-flex h-10 w-10 items-center justify-center border border-sericia-ink/20 hover:border-sericia-ink hover:bg-sericia-ink hover:text-sericia-paper transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <rect x="3" y="5" width="18" height="14" rx="1.5" />
                  <path d="M3 6l9 7 9-7" />
                </svg>
              </a>
            </div>
          </div>
        </section>

        {/* Band 4 — Legal micro-row */}
        <section className="py-8 flex flex-wrap items-center justify-between gap-x-8 gap-y-4 text-[11px] tracking-wider text-sericia-ink-mute">
          <p>{t("copyright")}</p>
          <p className="hidden md:block">{t("tagline")}</p>
          <p>
            <span className="mr-2 text-sericia-ink-mute/70">Currently viewing:</span>
            <span className="text-sericia-ink-soft">{localeLabel}</span>
          </p>
        </section>
      </div>
    </footer>
  );
}
