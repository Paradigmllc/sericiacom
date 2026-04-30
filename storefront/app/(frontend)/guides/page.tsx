import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { COUNTRIES, PRODUCTS } from "@/lib/pseo-matrix";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Container, PageHero, Rule } from "@/components/ui";

// 1-hour ISR — page is mostly static editorial / brand copy.
export const revalidate = 3600;
export const metadata: Metadata = {
  title: "Japanese Craft Food Guides by Country — Sericia",
  description:
    "Country-by-country guides to buying authentic Japanese craft food: sencha, matcha, miso, shiitake, yuzu. Shipped worldwide from Japan.",
  alternates: { canonical: "https://sericia.com/guides" },
};

export default async function GuidesIndex() {
  const tPage = await getTranslations("pages.guides");
  // CollectionPage + ItemList JSON-LD across all 64 country×product combos.
  // Each guide is its own URL and Google should treat /guides as the index
  // for the cluster.
  const SITE = "https://sericia.com";
  const items: { country: string; productName: string; productSlug: string; countryCode: string }[] = [];
  for (const c of COUNTRIES) {
    for (const p of PRODUCTS) {
      items.push({
        country: c.name,
        countryCode: c.code,
        productName: p.name,
        productSlug: p.slug,
      });
    }
  }
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Japanese craft food guides by country",
    description:
      "Country-by-country guides to importing authentic Japanese sencha, matcha, miso, shiitake, dashi, yuzu, shichimi, and furikake.",
    url: `${SITE}/guides`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items.slice(0, 50).map((it, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE}/guides/${it.countryCode}/${it.productSlug}`,
        name: `Buying ${it.productName} in ${it.country}`,
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <SiteHeader />
      <PageHero
        eyebrow={tPage("eyebrow")}
        title={tPage("title")}
        lede="Curated guides for buying authentic sencha, matcha, miso, shiitake, and yuzu — shipped directly from Japan. Read the destination notes before you order."
      />
      <Container size="wide" className="py-20 md:py-28">
        {COUNTRIES.map((c, idx) => (
          <section key={c.code} className={idx > 0 ? "mt-20" : ""}>
            <div className="flex items-baseline justify-between mb-8">
              <div>
                <p className="label mb-3">Destination</p>
                <h2 className="text-[28px] md:text-[32px] font-normal tracking-tight">
                  <span className="mr-3">{c.flag}</span>{c.name}
                </h2>
              </div>
              <p className="text-[12px] text-sericia-ink-mute tracking-wider uppercase hidden md:block">
                {PRODUCTS.length} guides
              </p>
            </div>
            <Rule className="mb-8" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-px bg-sericia-line">
              {PRODUCTS.map((p) => (
                <Link
                  key={p.slug}
                  href={`/guides/${c.code}/${p.slug}`}
                  className="bg-sericia-paper-card p-6 hover:bg-sericia-paper transition-colors group"
                >
                  <p className="text-[11px] tracking-[0.22em] uppercase text-sericia-ink-mute mb-3">
                    {c.code.toUpperCase()} · {p.slug}
                  </p>
                  <p className="text-[17px] leading-snug group-hover:text-sericia-accent transition-colors">
                    {p.name}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </Container>
      <SiteFooter />
    </>
  );
}
