"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import FooterSubscribeForm from "./FooterSubscribeForm";
import { useSettings } from "./SettingsProvider";

/**
 * Rich Aesop-tier footer — five vertical bands:
 *
 *   1. Editorial + subscribe    — sets the mood, harvests the email
 *   2. N-column link grid       — fully editor-controlled (Phase 2-A)
 *   3. Studio + social row
 *   4. Locale acknowledgement
 *   5. Legal micro-row
 *
 * Phase 2 evolution: every visible string is now CMS-backed via
 * `useSettings()`. Empty CMS fields fall through to hardcoded brand
 * defaults so the footer renders correctly even with zero editorial.
 *
 * Why "use client": we read `useSettings()` (React context) here. The
 * subscribe form was already a client component, so this rendering tree
 * doesn't lose any server-only capabilities.
 */

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
  ar: "العربية",
};

// Brand defaults — used when CMS `settings.footerCopy.*` is empty AND
// then resolved through next-intl messages (locale-aware). The actual
// strings live in messages/{locale}.json under namespace `footer`. Each
// fallback below cites the message key it pulls.
//
// Why this refactor: in pre-i18n iterations the inline literal `"Tools"`
// would ship to /ja viewers when CMS was empty. Now the locale tier of
// the resolution chain (CMS → next-intl → emergency literal) actually
// flips. Emergency literals remain only for next-intl outage scenarios.
const EMERGENCY_TOOLS_TITLE = "Tools";

export default function SiteFooter() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");
  const locale = useLocale();
  const localeLabel = LOCALE_NATIVE[locale] ?? "English";
  const settings = useSettings();
  const fc = settings?.footerCopy;

  // Three-tier resolution: CMS (editor) → next-intl (locale) → emergency literal.
  const editorialEyebrow = fc?.editorialEyebrow?.trim() || t("editorial_eyebrow");
  const editorialHeading = fc?.editorialHeading?.trim() || t("editorial_title");
  const editorialBody = fc?.editorialBody?.trim() || t("editorial_body");
  // Privacy note translation has the link suffix as a separate key —
  // we render `<note> <Link>privacy policy</Link>.` to keep the link
  // localised independently of the surrounding sentence.
  const privacyNoteBefore =
    fc?.subscribePrivacyNote?.trim() || t("subscribe_note_before_link");
  const studioBodyBefore =
    fc?.studioCopy?.trim() || t("studio_body_before_link");
  const viewingLabel = fc?.currentlyViewingLabel?.trim() || t("currently_viewing");

  // Resolve columns: CMS array if non-empty, else fallback uses next-intl
  // translation keys (for backward compatibility with existing translations).
  type ResolvedLink = { label: string; url: string; external?: boolean };
  type ResolvedColumn = { title: string; links: ResolvedLink[] };

  let columns: ResolvedColumn[];
  if (fc?.columns && fc.columns.length > 0) {
    columns = fc.columns.map<ResolvedColumn>((col) => ({
      title: typeof col.title === "string" ? col.title : "",
      links:
        col.links?.map<ResolvedLink>((l) => ({
          label: l.label,
          url: l.url,
          external: l.external ?? false,
        })) ?? [],
    }));
  } else {
    // 4 brand-default columns — every label resolved through next-intl
    // namespaces (footer / nav). This is the layer that fixes the bug
    // where /ja showed English column titles when CMS was empty.
    columns = [
      {
        title: t("shop"),
        links: [
          { label: tNav("shop"), url: "/products" },
          { label: tNav("current_drop"), url: "/#drop" },
          { label: t("nav_waitlist"), url: "/#waitlist" },
          { label: tNav("guides"), url: "/guides" },
          { label: t("nav_journal"), url: "/journal" },
        ],
      },
      {
        title: t("tools_label"),
        links: [
          { label: t("tool_ems"), url: "/tools/ems-calculator" },
          { label: t("tool_matcha"), url: "/tools/matcha-grade" },
          { label: t("tool_miso"), url: "/tools/miso-finder" },
          { label: t("tool_shelf"), url: "/tools/shelf-life" },
          { label: t("tool_brewer"), url: "/tools/tea-brewer" },
        ],
      },
      {
        title: t("company"),
        links: [
          { label: tNav("our_story"), url: "/about" },
          { label: tNav("shipping"), url: "/shipping" },
          { label: t("company_refund"), url: "/refund" },
          { label: t("company_terms"), url: "/terms" },
          { label: t("company_privacy"), url: "/privacy" },
          { label: t("tokushoho_label"), url: "/tokushoho" },
        ],
      },
      {
        title: t("support"),
        links: [
          { label: "contact@sericia.com", url: "mailto:contact@sericia.com" },
          { label: "+81 050-3120-3706", url: "tel:+81-50-3120-3706" },
        ],
      },
    ];
  }
  // Emergency-literal escape valve: if next-intl somehow fails entirely,
  // the columns array would have empty titles. Fall back to one English
  // 'Tools'-only column to avoid an entirely blank footer.
  if (columns.every((c) => !c.title)) {
    columns = [{ title: EMERGENCY_TOOLS_TITLE, links: [] }];
  }

  // Resolve social links: CMS if present, else hardcoded Instagram + email.
  const socials = settings?.socialLinks ?? [];
  const hasSocials = socials.length > 0;

  // Resolve legal links: CMS if present, else fallback empty (Band 4 hides).
  const legalLinks = fc?.legalLinks ?? [];

  return (
    <footer className="bg-sericia-paper-deep text-sericia-ink">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12">
        {/* Band 1 — Editorial + Subscribe */}
        <section className="py-20 md:py-28 border-b border-sericia-ink/10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            <div className="lg:col-span-7">
              <p className="text-[11px] tracking-[0.3em] uppercase text-sericia-ink-mute mb-6">
                {editorialEyebrow}
              </p>
              <h2 className="text-[28px] md:text-[40px] leading-[1.12] font-normal tracking-tight max-w-[520px]">
                {editorialHeading}
              </h2>
            </div>
            <div className="lg:col-span-5">
              <p className="text-[14px] md:text-[15px] text-sericia-ink-soft leading-[1.8] mb-7 max-w-md">
                {editorialBody}
              </p>
              <FooterSubscribeForm />
              <p className="mt-4 text-[11px] text-sericia-ink-mute tracking-wide max-w-md leading-relaxed">
                {privacyNoteBefore}{" "}
                <Link href="/privacy" className="underline-link">{t("company_privacy").toLowerCase()}</Link>.
              </p>
            </div>
          </div>
        </section>

        {/* Band 2 — Link grid (editor-controlled columns) */}
        <section className="py-16 md:py-20 border-b border-sericia-ink/10">
          <div
            className="grid gap-10 md:gap-8 grid-cols-2"
            style={{
              // Auto-fit so editor adding 5+ columns doesn't break layout.
              gridTemplateColumns: `repeat(auto-fit, minmax(180px, 1fr))`,
            }}
          >
            {columns.map((col, i) => (
              <div key={`col-${i}`}>
                <p className="label mb-5">{col.title}</p>
                <ul className="space-y-3 text-[14px] text-sericia-ink-soft">
                  {col.links.map((l, j) => {
                    const isMailto = l.url.startsWith("mailto:");
                    const isTel = l.url.startsWith("tel:");
                    const isExternal =
                      l.external || /^https?:\/\//i.test(l.url);

                    if (isMailto || isTel) {
                      return (
                        <li key={`l-${j}`}>
                          <a
                            href={l.url}
                            className="hover:text-sericia-ink transition-colors underline-offset-4 hover:underline"
                          >
                            {l.label}
                          </a>
                        </li>
                      );
                    }
                    if (isExternal) {
                      return (
                        <li key={`l-${j}`}>
                          <a
                            href={l.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-sericia-ink transition-colors"
                          >
                            {l.label}
                          </a>
                        </li>
                      );
                    }
                    return (
                      <li key={`l-${j}`}>
                        <Link
                          href={l.url}
                          className="hover:text-sericia-ink transition-colors"
                        >
                          {l.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Band 3 — Studio + Social */}
        <section className="py-14 border-b border-sericia-ink/10">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 md:gap-10 items-start md:items-center">
            <div>
              <p className="label mb-3">{t("studio_label")}</p>
              <p className="text-[14px] text-sericia-ink-soft leading-[1.75] max-w-xl">
                {studioBodyBefore}{" "}
                <Link href="/tokushoho" className="underline-link">
                  {t("tokushoho_label")}
                </Link>
                .
              </p>
            </div>
            <div className="flex items-center gap-5">
              {hasSocials ? (
                socials.map((s, i) => (
                  <a
                    key={`s-${i}`}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Sericia on ${s.platform}`}
                    className="inline-flex h-10 w-10 items-center justify-center border border-sericia-ink/20 hover:border-sericia-ink hover:bg-sericia-ink hover:text-sericia-paper transition-colors text-[10px] tracking-[0.2em] uppercase"
                  >
                    {s.platform.slice(0, 2)}
                  </a>
                ))
              ) : (
                <>
                  <a
                    href="https://www.instagram.com/sericia.official"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t("instagram_label")}
                    className="inline-flex h-10 w-10 items-center justify-center border border-sericia-ink/20 hover:border-sericia-ink hover:bg-sericia-ink hover:text-sericia-paper transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <rect x="3" y="3" width="18" height="18" rx="4" />
                      <circle cx="12" cy="12" r="4" />
                      <circle cx="17.5" cy="6.5" r="0.7" fill="currentColor" />
                    </svg>
                  </a>
                  <a
                    href="mailto:contact@sericia.com"
                    aria-label={t("email_label")}
                    className="inline-flex h-10 w-10 items-center justify-center border border-sericia-ink/20 hover:border-sericia-ink hover:bg-sericia-ink hover:text-sericia-paper transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <rect x="3" y="5" width="18" height="14" rx="1.5" />
                      <path d="M3 6l9 7 9-7" />
                    </svg>
                  </a>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Band 4 — Legal micro-row */}
        <section className="py-8 flex flex-wrap items-center justify-between gap-x-8 gap-y-4 text-[11px] tracking-wider text-sericia-ink-mute">
          <p>{fc?.copyrightText?.trim() || t("copyright")}</p>
          {legalLinks.length > 0 ? (
            <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {legalLinks.map((l, i) => (
                <li key={`leg-${i}`}>
                  <Link href={l.url} className="hover:text-sericia-ink transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="hidden md:block">{fc?.tagline?.trim() || t("tagline")}</p>
          )}
          <p>
            <span className="mr-2 text-sericia-ink-mute/70">{viewingLabel}</span>
            <span className="text-sericia-ink-soft">{localeLabel}</span>
          </p>
        </section>
      </div>
    </footer>
  );
}
