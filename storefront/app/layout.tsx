import type { Metadata } from "next";
import Script from "next/script";
import { Noto_Sans, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import Analytics from "../components/Analytics";

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

const DIFY_TOKEN = process.env.NEXT_PUBLIC_DIFY_TOKEN || "WnX69EkeJYork2rTBtbB3wnY";
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
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Sericia — rescued Japanese craft food" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sericia — Rescued Japanese Craft Food",
    description: "Limited drops of surplus Japanese craft food, shipped worldwide.",
    images: ["/og-default.png"],
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
  icons: { icon: "/favicon.ico", apple: "/apple-touch-icon.png" },
  manifest: "/manifest.json",
  category: "food & beverage",
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${notoSans.variable} ${notoSansJp.variable}`}>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Toaster position="top-right" richColors />
        <Analytics />
        <Script id="dify-config" strategy="afterInteractive">
          {`window.difyChatbotConfig = { token: '${DIFY_TOKEN}' };`}
        </Script>
        <Script
          src="https://udify.app/embed.min.js"
          id={DIFY_TOKEN}
          strategy="afterInteractive"
          defer
        />
        <style>{`
          #dify-chatbot-bubble-button { background-color: #5c5d45 !important; }
          #dify-chatbot-bubble-window { width: 24rem !important; height: 40rem !important; }
        `}</style>
      </body>
    </html>
  );
}
