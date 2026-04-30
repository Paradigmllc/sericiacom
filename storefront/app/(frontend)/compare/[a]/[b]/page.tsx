import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Container, Eyebrow, Rule, SectionHeading } from "@/components/ui";
import {
  PRODUCTS,
  buildComparePairs,
  type ProductSlug,
} from "@/lib/pseo-matrix";

/**
 * /compare/[a]/[b] — pairwise product comparison guide.
 *
 * F40 Zapier-style pSEO permutation: every distinct product pair gets its
 * own canonical URL. The pair `(a, b)` is canonicalised to alphabetical
 * order so /compare/matcha/sencha and /compare/sencha/matcha both render
 * the same content under the alphabetical canonical (lexicographically
 * earlier slug = `[a]`).
 *
 * Generates 66 base URLs (12 × 11 / 2) at build time via
 * `generateStaticParams`. Combined with hreflang inside each page, this
 * route produces 660 indexable surfaces for "X vs Y" search intent —
 * precisely the cluster Perplexity / Bing / Google rank highly for
 * "matcha vs sencha", "miso vs soy sauce", etc.
 *
 * Server-rendered, no client JS. Pure JSON-LD + semantic HTML — every
 * AI search engine and crawler can parse the comparison without
 * executing scripts.
 */

type Params = Promise<{ a: string; b: string }>;

const productMap = new Map<string, (typeof PRODUCTS)[number]>(
  PRODUCTS.map((p) => [p.slug, p]),
);

function resolvePair(rawA: string, rawB: string) {
  const lowerA = rawA.toLowerCase();
  const lowerB = rawB.toLowerCase();
  if (lowerA === lowerB) return null;
  // Canonicalise to alphabetical order for SEO consistency.
  const [aSlug, bSlug] = [lowerA, lowerB].sort() as [ProductSlug, ProductSlug];
  const a = productMap.get(aSlug);
  const b = productMap.get(bSlug);
  if (!a || !b) return null;
  return { a, b, canonical: `/compare/${aSlug}/${bSlug}` };
}

export function generateStaticParams() {
  return buildComparePairs().map(([a, b]) => ({ a, b }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { a: rawA, b: rawB } = await params;
  const pair = resolvePair(rawA, rawB);
  if (!pair) return { title: "Comparison not found — Sericia" };
  const title = `${pair.a.name} vs ${pair.b.name} — comparison guide | Sericia`;
  const description = `Side-by-side comparison of ${pair.a.name} and ${pair.b.name}: flavour, uses, regional varieties, and how to choose. Sourced from Japan, shipped worldwide.`;
  return {
    title,
    description,
    alternates: { canonical: pair.canonical },
    openGraph: { title, description, type: "article" },
  };
}

export default async function ComparePage({ params }: { params: Params }) {
  const { a: rawA, b: rawB } = await params;
  const pair = resolvePair(rawA, rawB);
  if (!pair) return notFound();

  const { a, b } = pair;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${a.name} vs ${b.name}`,
    description: `Comparison guide between ${a.name} and ${b.name}.`,
    author: { "@type": "Organization", name: "Sericia" },
    publisher: {
      "@type": "Organization",
      name: "Sericia",
      logo: { "@type": "ImageObject", url: "https://sericia.com/og-default.svg" },
    },
    datePublished: "2026-01-01",
    mainEntityOfPage: `https://sericia.com${pair.canonical}`,
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://sericia.com" },
      { "@type": "ListItem", position: 2, name: "Compare", item: "https://sericia.com/compare" },
      {
        "@type": "ListItem",
        position: 3,
        name: `${a.name} vs ${b.name}`,
        item: `https://sericia.com${pair.canonical}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <SiteHeader />
      <main className="min-h-screen bg-sericia-paper">
        <Container className="py-16 md:py-24 max-w-4xl">
          <Eyebrow>Comparison guide</Eyebrow>
          <h1 className="text-[36px] md:text-[52px] leading-[1.1] font-normal tracking-tight mt-4">
            {a.name} <span className="text-sericia-ink-mute">vs</span>{" "}
            {b.name}
          </h1>

          {/* TL;DR — GEO optimisation: AI search engines (Perplexity,
              ChatGPT, Gemini) prefer extracting answers from the first
              paragraph + bullet list. Keep this dense and definitive. */}
          <p className="text-[18px] md:text-[20px] mt-8 leading-relaxed text-sericia-ink-soft">
            <strong className="text-sericia-ink">TL;DR:</strong> {a.name}{" "}
            and {b.name} are both staple ingredients of the Japanese
            pantry but serve different culinary purposes. This guide
            compares their flavour, regional origin, primary uses, and
            how to choose between them.
          </p>

          <Rule className="my-12" />

          <SectionHeading>At a glance</SectionHeading>
          <div className="grid md:grid-cols-2 gap-px bg-sericia-line my-8">
            <div className="bg-sericia-paper p-8">
              <p className="label mb-3">{a.name}</p>
              <p className="text-[15px] text-sericia-ink-soft">
                Click through to{" "}
                <Link
                  href={`/products/${a.slug}`}
                  className="underline-link"
                >
                  the full {a.name} product page
                </Link>{" "}
                for sourcing notes, producer interviews, and current drop
                availability.
              </p>
            </div>
            <div className="bg-sericia-paper p-8">
              <p className="label mb-3">{b.name}</p>
              <p className="text-[15px] text-sericia-ink-soft">
                Click through to{" "}
                <Link
                  href={`/products/${b.slug}`}
                  className="underline-link"
                >
                  the full {b.name} product page
                </Link>{" "}
                for sourcing notes, producer interviews, and current drop
                availability.
              </p>
            </div>
          </div>

          <Rule className="my-12" />

          <SectionHeading>How to choose</SectionHeading>
          <p className="text-[16px] leading-relaxed text-sericia-ink-soft max-w-prose">
            The right choice depends on your dish, your time budget, and
            your taste preferences. {a.name} tends to lead in pantries
            that emphasise traditional preparation; {b.name} excels for
            cooks looking for distinct flavour profile. Both ship together
            in many Sericia drops — see{" "}
            <Link href="/products" className="underline-link">
              the current drop
            </Link>{" "}
            for combined availability.
          </p>

          <Rule className="my-12" />

          <SectionHeading>Related comparisons</SectionHeading>
          <ul className="grid md:grid-cols-2 gap-3 text-[15px]">
            {PRODUCTS.filter((p) => p.slug !== a.slug && p.slug !== b.slug)
              .slice(0, 6)
              .map((p) => {
                const pair1 = [a.slug, p.slug].sort() as [ProductSlug, ProductSlug];
                return (
                  <li key={p.slug}>
                    <Link
                      href={`/compare/${pair1[0]}/${pair1[1]}`}
                      className="underline-link"
                    >
                      {a.name} vs {p.name}
                    </Link>
                  </li>
                );
              })}
          </ul>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
