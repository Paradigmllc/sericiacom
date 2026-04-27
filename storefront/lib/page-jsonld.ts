/**
 * Lightweight WebPage / AboutPage / ContactPage JSON-LD helpers for static
 * pages that don't already emit a richer schema (Article, Product, FAQ).
 *
 * Why a helper instead of inline blobs in each page: the 5 legal/info
 * pages (about, shipping, refund, terms, accessibility, privacy) all want
 * the same shape with just a different name + description + URL. Centralising
 * the constant fields (publisher, sameAs, isPartOf) here avoids drift
 * between pages and makes adding the next legal page a one-line change.
 */

const SITE = "https://sericia.com";

const PUBLISHER = {
  "@type": "Organization",
  name: "Sericia",
  url: SITE,
  logo: { "@type": "ImageObject", url: `${SITE}/og-default.svg` },
} as const;

export type WebPageJsonLdInput = {
  name: string;
  description: string;
  /** Path including leading slash, e.g. "/shipping". */
  path: string;
  /** Use "AboutPage" for /about, "ContactPage" for contact-style, otherwise WebPage. */
  variant?: "WebPage" | "AboutPage" | "ContactPage";
  /** Breadcrumb chain ending at the current page. */
  breadcrumb?: { label: string; path?: string }[];
};

export function webPageJsonLd(input: WebPageJsonLdInput): Record<string, unknown> {
  const variant = input.variant ?? "WebPage";
  const url = `${SITE}${input.path}`;
  return {
    "@context": "https://schema.org",
    "@type": variant,
    name: input.name,
    description: input.description,
    url,
    isPartOf: { "@type": "WebSite", name: "Sericia", url: SITE },
    publisher: PUBLISHER,
    inLanguage: "en",
    ...(input.breadcrumb && input.breadcrumb.length > 0
      ? {
          breadcrumb: {
            "@type": "BreadcrumbList",
            itemListElement: input.breadcrumb.map((b, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: b.label,
              item: b.path ? `${SITE}${b.path}` : undefined,
            })),
          },
        }
      : {}),
  };
}
