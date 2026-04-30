import type { Metadata, Viewport } from "next";
import { Noto_Sans, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import LuxuryToaster from "@/components/LuxuryToaster";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { isRtlLocale, type Locale } from "@/i18n/routing";
import Analytics from "@/components/Analytics";
import DifyChat from "@/components/DifyChat";
import GlobalOverlay from "@/components/GlobalOverlay";
import RouteProgress from "@/components/RouteProgress";
import ScrollProgress from "@/components/ScrollProgress";
import LuxuryLoader from "@/components/LuxuryLoader";
import RegionModal from "@/components/RegionModal";
import CookieConsent from "@/components/CookieConsent";
import CouponBanner from "@/components/CouponBanner";
import SocialProofToastGate from "@/components/SocialProofToastGate";
import ReferralCookieSetter from "@/components/ReferralCookieSetter";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import SettingsProvider from "@/components/SettingsProvider";
import ThemeProvider, { NoFlashThemeScript } from "@/components/ThemeProvider";
import { getSiteSettings } from "@/lib/payload-settings";
import { Suspense } from "react";

const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-noto-sans",
  display: "swap",
});
const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-noto-sans-jp",
  display: "swap",
});

const SITE_URL = "https://sericia.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Sericia — Rescued Japanese Craft Food, Shipped Worldwide",
    template: "%s | Sericia",
  },
  description:
    "Drop-by-drop limited releases of rescued Japanese craft food: single-origin sencha, barrel-aged miso, hand-dried shiitake. Ships from Japan via EMS to 23+ countries.",
  keywords: [
    "Japanese craft food",
    "sencha tea",
    "aged miso",
    "dried shiitake",
    "matcha",
    "yuzu kosho",
    "Japanese food delivery worldwide",
    "EMS Japan",
    "food rescue",
    "surplus food Japan",
  ],
  authors: [{ name: "Paradigm LLC" }],
  creator: "Sericia",
  publisher: "Paradigm LLC",
  alternates: {
    canonical: SITE_URL,
    languages: {
      "en-US": `${SITE_URL}/guides/us`,
      "en-GB": `${SITE_URL}/guides/uk`,
      "de-DE": `${SITE_URL}/guides/de`,
      "fr-FR": `${SITE_URL}/guides/fr`,
      "en-AU": `${SITE_URL}/guides/au`,
      "en-SG": `${SITE_URL}/guides/sg`,
      "en-CA": `${SITE_URL}/guides/ca`,
      "en-HK": `${SITE_URL}/guides/hk`,
      "ja-JP": `${SITE_URL}/ja`,
      "ko-KR": `${SITE_URL}/ko`,
      "zh-TW": `${SITE_URL}/zh-TW`,
      "es-ES": `${SITE_URL}/es`,
      "it-IT": `${SITE_URL}/it`,
      "ru-RU": `${SITE_URL}/ru`,
      // Arabic is emitted without a country tag so a single page serves the
      // whole MSA-reading MENA region. When/if we add market-specific shipping
      // pages, switch to `ar-AE`, `ar-SA`, etc. with distinct URLs.
      "ar": `${SITE_URL}/ar`,
      "x-default": SITE_URL,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Sericia",
    title: "Sericia — Rescued Japanese Craft Food",
    description:
      "Limited drops of surplus Japanese craft food. Tea, miso, shiitake — rescued before disposal, shipped worldwide.",
    images: [{ url: "/og-default.svg", width: 1200, height: 630, alt: "Sericia — rescued Japanese craft food" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sericia — Rescued Japanese Craft Food",
    description: "Limited drops of surplus Japanese craft food, shipped worldwide.",
    images: ["/og-default.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
    // iOS Safari uses apple-touch-icon when adding to home screen.
    apple: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Sericia",
    statusBarStyle: "black-translucent",
  },
  category: "food & beverage",
  // F40: Search-engine ownership verification meta tags. Operator pastes
  // the actual codes into Coolify env (NEXT_PUBLIC_GSC_VERIFICATION,
  // NEXT_PUBLIC_BING_VERIFICATION, NEXT_PUBLIC_YANDEX_VERIFICATION) once
  // they generate them in the respective consoles. Empty values render
  // as empty meta tags which the consoles still accept; populated values
  // unlock indexing in 24–48h.
  verification: {
    google: process.env.NEXT_PUBLIC_GSC_VERIFICATION ?? undefined,
    other: {
      "msvalidate.01": process.env.NEXT_PUBLIC_BING_VERIFICATION ?? "",
      "yandex-verification": process.env.NEXT_PUBLIC_YANDEX_VERIFICATION ?? "",
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f1e8" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Sericia",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  sameAs: ["https://github.com/Paradigmllc"],
  contactPoint: {
    "@type": "ContactPoint",
    email: "contact@sericia.com",
    contactType: "customer service",
    availableLanguage: ["en", "ja"],
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Sericia",
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/search?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = (await getLocale()) as Locale;
  const messages = await getMessages();
  // Server-side fetch SiteSettings ONCE per request. Hands the resolved
  // localised content to <SettingsProvider> so client-tree components
  // (AnnouncementBar, CinematicHero, footer, etc.) can `useSettings()`
  // without re-querying. Silent-falls back to null on Payload outage —
  // consumers render hardcoded defaults in that case.
  const siteSettings = await getSiteSettings(locale);
  // `dir` on <html> is the idiomatic way to flip document directionality. The
  // browser then mirrors scroll gutters, form UI, and most positional CSS
  // automatically. Tailwind classes that use physical axes (ml-/mr-/left-/right-)
  // are NOT flipped — a full pass to logical counterparts (ms-/me-/start-/end-)
  // is tracked as a follow-up (T3-A-RTL-audit). Until then, Arabic renders
  // functionally readable; minor asymmetries in margins are acceptable for
  // launch against the MENA market.
  const dir = isRtlLocale(locale) ? "rtl" : "ltr";
  return (
    <html lang={locale} dir={dir} className={`${notoSans.variable} ${notoSansJp.variable}`}>
      <head>
        {/* No-flash theme script — must be FIRST in <head> so it runs before
            any paint. Reads localStorage and sets data-theme synchronously. */}
        <NoFlashThemeScript />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      </head>
      <body className="font-sans antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
         <SettingsProvider settings={siteSettings}>
          <ThemeProvider />
          <LuxuryLoader />
          <Suspense fallback={null}>
            <RouteProgress />
          </Suspense>
          <ScrollProgress />
          <Suspense fallback={null}>
            <ReferralCookieSetter />
          </Suspense>
          <CouponBanner />
          {children}
          <GlobalOverlay />
          <RegionModal />
          <CookieConsent />
          <SocialProofToastGate />
          <LuxuryToaster />
          <Analytics />
          <DifyChat />
          <ServiceWorkerRegister />
         </SettingsProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
