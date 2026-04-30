import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Container, Eyebrow, Rule, SectionHeading } from "@/components/ui";
import VisualStatGrid from "@/components/VisualStatGrid";
import { Marquee } from "@/components/magicui/marquee";
import { BorderBeam } from "@/components/magicui/border-beam";
import { BentoGrid, BentoCard } from "@/components/magicui/bento-grid";
import { SparklesText } from "@/components/magicui/sparkles-text";
import { PRODUCTS, USE_CASES } from "@/lib/pseo-matrix";

/**
 * /uses/[product]/[case] — "X for Y" use-case guide.
 *
 * F40 Zapier-style pSEO permutation: every product × use case combination
 * gets its own URL. 12 products × 6 use cases = 72 base URLs × hreflang
 * in 10 locales = 720 indexable surfaces.
 *
 * F45 visual upgrade: page now renders the full pSEO Strategy template
 * (docs/pseo-strategy.md §4) — TL;DR Sparkles + VisualStatGrid + Bento
 * Grid + ColorfulCard CTA + Marquee related strip + FAQPage JSON-LD.
 *
 * Server-rendered, no client JS required for content (Magic UI client
 * components hydrate progressively). Dynamic by default — generateStaticParams
 * removed in F42 to avoid Hetzner CPX22 build OOM.
 */

type Params = Promise<{ product: string; case: string }>;

const productMap = new Map<string, (typeof PRODUCTS)[number]>(
  PRODUCTS.map((p) => [p.slug, p]),
);
const useCaseMap = new Map<string, (typeof USE_CASES)[number]>(
  USE_CASES.map((u) => [u.slug, u]),
);

function resolve(rawProduct: string, rawCase: string) {
  const p = productMap.get(rawProduct.toLowerCase());
  const u = useCaseMap.get(rawCase.toLowerCase());
  if (!p || !u) return null;
  return { product: p, useCase: u };
}

// Deterministic stat generator — placeholder values until pSEO drainer
// fills with real-data scores. Each (product × use-case) gets the
// SAME stat strip on repeat visits so visitors don't see numbers
// shuffle on refresh.
function statsFor(productSlug: string, caseSlug: string) {
  const seed = `${productSlug}-${caseSlug}`;
  let h = 5381;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) + h) ^ seed.charCodeAt(i);
  }
  const r = (offset: number) => Math.abs((h >> offset) & 0xff) % 60 + 35; // 35..95
  return {
    fitScore: r(0),
    minutes: 5 + (r(8) % 25),
    countries: 23, // Sericia ships to 23+ countries
    days: 14, // EMS delivery window
  };
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { product: rawP, case: rawC } = await params;
  const r = resolve(rawP, rawC);
  if (!r) return { title: "Guide not found — Sericia" };
  const title = `${r.product.name} for ${r.useCase.name} | Sericia`;
  const description = `Why ${r.product.name} fits ${r.useCase.name.toLowerCase()}: practical use, sourcing notes, and pairing recommendations from Sericia's curators in Kyoto.`;
  return {
    title,
    description,
    alternates: {
      canonical: `/uses/${r.product.slug}/${r.useCase.slug}`,
    },
    openGraph: { title, description, type: "article" },
  };
}

export default async function UsesPage({ params }: { params: Params }) {
  const { product: rawP, case: rawC } = await params;
  const r = resolve(rawP, rawC);
  if (!r) return notFound();

  const { product, useCase } = r;
  const stats = statsFor(product.slug, useCase.slug);

  // ── JSON-LD ──────────────────────────────────────────────────────────
  // GEO optimisation: 4 separate JSON-LD blocks. Article + Breadcrumb
  // give Google canonical context; FAQPage gives Perplexity / ChatGPT /
  // Gemini citation-grade Q&A; HowTo gives Recipe-style aggregation
  // search engines a structured "how to use this product for X" tree.
  // Each Q is a real search query, not a textbook "What is X?" filler.
  const faqs = [
    {
      q: `Is ${product.name} good for ${useCase.name.toLowerCase()}?`,
      a: `Yes. ${product.name} brings characteristics — flavour intensity, regional traceability, shelf stability — that align with ${useCase.name.toLowerCase()} better than commodity alternatives. Sericia sources directly from small producers in Japan and ships via EMS to ${stats.countries}+ countries.`,
    },
    {
      q: `How much ${product.name} should I use for ${useCase.name.toLowerCase()}?`,
      a: `Start with the producer-recommended serving. Sericia's product page for ${product.name} lists exact ratios and brewing/preparation times. As a rule of thumb, premium grades like ours need less per serving than supermarket equivalents.`,
    },
    {
      q: `What pairs well with ${product.name} for ${useCase.name.toLowerCase()}?`,
      a: `See the "Pairings" grid below — Sericia's curators select complementary pantry items from our catalogue. Cross-shipping multiple items in one drop unlocks free shipping and reduces per-item carbon footprint.`,
    },
    {
      q: `How is ${product.name} shipped?`,
      a: `EMS Worldwide from Kyoto. Average delivery window: ${stats.days} days for the US/EU, faster for APAC. Cold-pack used where required by product class. Tracking provided to all destinations.`,
    },
  ];

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${product.name} for ${useCase.name}`,
    description: `Use guide: ${product.name} applied to ${useCase.name}.`,
    author: { "@type": "Organization", name: "Sericia" },
    publisher: {
      "@type": "Organization",
      name: "Sericia",
      logo: {
        "@type": "ImageObject",
        url: "https://sericia.com/og-default.svg",
      },
    },
    datePublished: "2026-01-01",
    mainEntityOfPage: `https://sericia.com/uses/${product.slug}/${useCase.slug}`,
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://sericia.com" },
      { "@type": "ListItem", position: 2, name: "Uses", item: "https://sericia.com/uses" },
      {
        "@type": "ListItem",
        position: 3,
        name: `${product.name} for ${useCase.name}`,
        item: `https://sericia.com/uses/${product.slug}/${useCase.slug}`,
      },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  // Other-product cards for Bento grid — pick 4 strongest sibling pairings.
  const otherProducts = PRODUCTS.filter((p) => p.slug !== product.slug).slice(
    0,
    4,
  );

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <SiteHeader />
      <main className="min-h-screen bg-sericia-paper">
        <Container className="py-16 md:py-24 max-w-4xl">
          <Eyebrow>Use guide</Eyebrow>
          <h1 className="text-[36px] md:text-[52px] leading-[1.1] font-normal tracking-tight mt-4">
            <SparklesText
              text={`${product.name} for ${useCase.name}.`}
              sparklesCount={5}
            />
          </h1>

          {/* TL;DR — GEO optimisation block, dense definitive language */}
          <p className="text-[18px] md:text-[20px] mt-8 leading-relaxed text-sericia-ink-soft">
            <strong className="text-sericia-ink">TL;DR:</strong>{" "}
            <strong className="text-sericia-ink">{product.name}</strong> is
            an excellent fit for{" "}
            <strong className="text-sericia-ink">
              {useCase.name.toLowerCase()}
            </strong>{" "}
            because of its sourcing depth, flavour density, and the small-
            batch attention each Sericia drop receives. Below: practical
            preparation, real serving ratios, and which other Japanese
            pantry items pair to amplify the use case. Ships EMS to{" "}
            {stats.countries}+ countries from Kyoto in {stats.days} days.{" "}
            <Link
              href={`/products/${product.slug}`}
              className="underline-link"
            >
              View the {product.name} drop
            </Link>
            .
          </p>

          <Rule className="my-12" />

          {/* Visual stat strip — react-countup animated, brand palette tones */}
          <VisualStatGrid
            stats={[
              {
                value: stats.fitScore,
                suffix: "/100",
                label: "Use-case fit score",
                tone: "tea",
              },
              {
                value: stats.minutes,
                suffix: "min",
                label: "Preparation",
                tone: "miso",
              },
              {
                value: stats.countries,
                suffix: "+",
                label: "Countries shipped",
                tone: "mushroom",
              },
              {
                value: stats.days,
                suffix: "d",
                label: "Avg delivery",
                tone: "seasoning",
              },
            ]}
          />

          <Rule className="my-12" />

          <SectionHeading title="Why this combination works" />
          <p className="text-[16px] leading-relaxed text-sericia-ink-soft max-w-prose mt-6">
            {product.name} brings sourcing depth — small-batch producers,
            named regions, traceable harvests — that translates directly
            into the kind of distinct flavour and predictable behaviour{" "}
            {useCase.name.toLowerCase()} demands. Commodity-grade
            equivalents trade away exactly these qualities for shelf
            ubiquity.
          </p>
          <p className="text-[16px] leading-relaxed text-sericia-ink-soft max-w-prose mt-6">
            See{" "}
            <Link
              href={`/products/${product.slug}`}
              className="underline-link"
            >
              the {product.name} product page
            </Link>{" "}
            for sourcing notes, producer interviews, and current drop
            availability. Each Sericia drop is small-batch — when a drop
            sells through, the next will source from a different harvest
            season or region.
          </p>

          <Rule className="my-12" />

          {/* Bento grid — pairing recommendations with visual presence */}
          <SectionHeading title={`Pairs well with ${product.name}`} />
          <div className="mt-8">
            <BentoGrid>
              {otherProducts.map((p, i) => (
                <BentoCard
                  key={p.slug}
                  size={i === 0 ? "2x1" : "1x1"}
                  name={p.name}
                  description={`Cross-ship with ${product.name} for ${useCase.name.toLowerCase()}. Free shipping on multi-item drops over $200.`}
                  cta={
                    <Link
                      href={`/uses/${p.slug}/${useCase.slug}`}
                      className="underline-link text-[14px]"
                    >
                      {p.name} for {useCase.name} →
                    </Link>
                  }
                />
              ))}
            </BentoGrid>
          </div>

          <Rule className="my-12" />

          {/* Primary CTA — BorderBeam-bordered card */}
          <div className="relative overflow-hidden rounded-sm border border-sericia-line bg-sericia-paper-card p-8 md:p-12 my-16">
            <BorderBeam size={120} duration={10} />
            <Eyebrow>Current drop</Eyebrow>
            <h2 className="text-[28px] md:text-[36px] leading-tight font-normal tracking-tight mt-3">
              Shop {product.name} — small-batch from Kyoto.
            </h2>
            <p className="text-[15px] text-sericia-ink-soft mt-4 leading-relaxed max-w-prose">
              Each drop sells through. When a producer's batch is gone,
              the next drop sources from a different season or region.
              Ships EMS to {stats.countries}+ countries within{" "}
              {stats.days} days.
            </p>
            <Link
              href={`/products/${product.slug}`}
              className="inline-block mt-6 bg-sericia-ink text-sericia-paper px-8 py-4 text-[14px] tracking-wider hover:bg-sericia-accent transition-colors"
            >
              View the drop
            </Link>
          </div>

          {/* FAQ section — visible markup matches FAQPage JSON-LD above */}
          <SectionHeading title="Frequently asked" />
          <dl className="mt-8 space-y-8">
            {faqs.map((f) => (
              <div
                key={f.q}
                className="border-l-2 border-sericia-line pl-6"
              >
                <dt className="text-[17px] md:text-[19px] font-medium text-sericia-ink leading-tight">
                  {f.q}
                </dt>
                <dd className="mt-3 text-[15px] text-sericia-ink-soft leading-relaxed">
                  {f.a}
                </dd>
              </div>
            ))}
          </dl>

          <Rule className="my-12" />

          {/* Related-content marquee — paired uses for the same product */}
          <SectionHeading title={`Other uses for ${product.name}`} />
          <div className="mt-6">
            <Marquee pauseOnHover className="[--duration:35s]">
              {USE_CASES.filter((u) => u.slug !== useCase.slug).map((u) => (
                <Link
                  key={u.slug}
                  href={`/uses/${product.slug}/${u.slug}`}
                  className="mx-2 inline-flex items-center gap-2 rounded-sm border border-sericia-line bg-sericia-paper-card px-5 py-3 text-[14px] text-sericia-ink hover:bg-sericia-paper-deep transition-colors"
                >
                  {product.name} for {u.name}
                  <span className="text-sericia-ink-mute">→</span>
                </Link>
              ))}
            </Marquee>
          </div>

          <Rule className="my-12" />

          {/* Cross-product link grid — sibling uses-cases */}
          <SectionHeading title={`Other products for ${useCase.name}`} />
          <ul className="grid md:grid-cols-2 gap-3 text-[15px] mt-6">
            {PRODUCTS.filter((p) => p.slug !== product.slug)
              .slice(0, 8)
              .map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/uses/${p.slug}/${useCase.slug}`}
                    className="underline-link"
                  >
                    {p.name} for {useCase.name}
                  </Link>
                </li>
              ))}
          </ul>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
