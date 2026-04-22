import type { Metadata, Viewport } from "next";
import { Noto_Sans, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import Analytics from "../components/Analytics";
import DifyChat from "../components/DifyChat";
import GlobalOverlay from "../components/GlobalOverlay";
import RouteProgress from "../components/RouteProgress";
import LuxuryLoader from "../components/LuxuryLoader";
import RegionModal from "../components/RegionModal";
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
  },
  manifest: "/manifest.json",
  category: "food & beverage",
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
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html lang={locale} className={`${notoSans.variable} ${notoSansJp.variable}`}>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      </head>
      <body className="font-sans antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <LuxuryLoader />
          <Suspense fallback={null}>
            <RouteProgress />
          </Suspense>
          {children}
          <GlobalOverlay />
          <RegionModal />
          <Toaster position="top-right" richColors />
          <Analytics />
          <DifyChat />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
