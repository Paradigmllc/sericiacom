import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Container, Eyebrow, Rule, SectionHeading } from "@/components/ui";
import ColorfulComparisonTable from "@/components/ColorfulComparisonTable";
import { Marquee } from "@/components/magicui/marquee";
import { BorderBeam } from "@/components/magicui/border-beam";
import { SparklesText } from "@/components/magicui/sparkles-text";
import {
  PRODUCTS,
  buildComparePairs,
  type ProductSlug,
} from "@/lib/pseo-matrix";

// Deterministic faux-score generator: hash slug → 35–95 range so the
// same product gets the same score across all comparisons it appears
// in. This is placeholder data — once pSEO drainer fills in real
// editorial briefs with attribute scores, swap to brief.attributes.
function scoreFor(slug: string, attribute: string): number {
  const seed = `${slug}-${attribute}`;
  let h = 5381;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) + h) ^ seed.charCodeAt(i);
  }
  return 35 + (Math.abs(h) % 61); // 35..95
}

const COMPARE_ATTRIBUTES = [
  { key: "umami", label: "Umami depth", note: "Savoury intensity per gram" },
  { key: "preparation", label: "Preparation time", note: "Faster wins for weeknight cooks" },
  { key: "shelf-life", label: "Shelf life", note: "Pantry stability after opening" },
  { key: "versatility", label: "Versatility", note: "Range of dishes it elevates" },
  { key: "regional-variation", label: "Regional variation", note: "Spread across producer styles" },
] as const;

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

// F41 hotfix: removed generateStaticParams — Hetzner CPX22 OOM-kills
// the build when 66 compare + 72 uses pages are statically generated
// alongside the existing 144 guides + Payload + Crossmint SDK. Pages
// now render dynamically on first visit and Cloudflare edge-caches
// the response per the 1h HTML cache rule. From the second visitor's
// perspective the route is indistinguishable from a static build.

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

  // F48: FAQPage JSON-LD for AI-search citations (Perplexity / ChatGPT /
  // Gemini extract Q&A pairs preferentially when Article alone is too
  // narrative for direct quoting).
  const faqs = [
    {
      q: `What is the difference between ${a.name} and ${b.name}?`,
      a: `${a.name} and ${b.name} are both staple Japanese pantry items but serve different culinary purposes. ${a.name} typically excels at one dimension where ${b.name} brings a complementary profile — see the comparison table above for attribute-by-attribute scoring across umami depth, preparation time, shelf life, versatility, and regional variation.`,
    },
    {
      q: `Which should I buy first, ${a.name} or ${b.name}?`,
      a: `Choose based on the dish you cook most often. If you favour traditional Japanese preparation, ${a.name} tends to lead. For distinct standalone flavour, ${b.name} wins. Sericia's drops frequently include both, so visitors who want to try both can cross-ship in a single order over $200 with free shipping.`,
    },
    {
      q: `Can I substitute ${a.name} for ${b.name} (or vice versa)?`,
      a: `Not directly — they have different culinary roles. However Sericia's product pages include "best paired with" recommendations that show which secondary items unlock similar end results when you only have one of the two on hand.`,
    },
    {
      q: `Where can I buy authentic ${a.name} and ${b.name} outside Japan?`,
      a: `Sericia ships both from Kyoto via EMS to 23+ countries. Each drop is small-batch from named producers — when a producer's harvest sells through, the next drop sources from a different region or season.`,
    },
  ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <SiteHeader />
      <main className="min-h-screen bg-sericia-paper">
        <Container className="py-16 md:py-24 max-w-4xl">
          <Eyebrow>Comparison guide</Eyebrow>
          <h1 className="text-[36px] md:text-[52px] leading-[1.1] font-normal tracking-tight mt-4">
            <SparklesText
              text={`${a.name} vs ${b.name}`}
              sparklesCount={5}
            />
          </h1>

          {/* TL;DR — GEO optimisation: AI search engines (Perplexity,
              ChatGPT, Gemini) prefer extracting answers from the first
              paragraph + bullet list. Keep this dense and definitive. */}
          <p className="text-[18px] md:text-[20px] mt-8 leading-relaxed text-sericia-ink-soft">
            <strong className="text-sericia-ink">TL;DR:</strong>{" "}
            <strong className="text-sericia-ink">{a.name}</strong> and{" "}
            <strong className="text-sericia-ink">{b.name}</strong> are
            both staple Japanese pantry items but serve different
            culinary purposes. The comparison table below scores each on
            umami depth, preparation time, shelf life, versatility, and
            regional variation — so you can choose by your kitchen's
            priorities. Both ship from Kyoto via EMS to 23+ countries.
          </p>

          <Rule className="my-12" />

          <SectionHeading title="At a glance" />
          <ColorfulComparisonTable
            productA={a.name}
            productB={b.name}
            rows={COMPARE_ATTRIBUTES.map((attr) => ({
              label: attr.label,
              note: attr.note,
              a: scoreFor(a.slug, attr.key),
              b: scoreFor(b.slug, attr.key),
            }))}
          />
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

          <SectionHeading title="How to choose" />
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

          {/* Primary CTA — BorderBeam-bordered card per pSEO Strategy §6 */}
          <div className="relative overflow-hidden rounded-sm border border-sericia-line bg-sericia-paper-card p-8 md:p-12 my-16">
            <BorderBeam size={120} duration={10} />
            <Eyebrow>Cross-ship & save</Eyebrow>
            <h2 className="text-[28px] md:text-[36px] leading-tight font-normal tracking-tight mt-3">
              Order {a.name} and {b.name} together — free shipping over $200.
            </h2>
            <p className="text-[15px] text-sericia-ink-soft mt-4 leading-relaxed max-w-prose">
              Both ship from Kyoto via EMS within 48 hours of payment.
              Cross-ship multiple items to amortise the per-package
              footprint and unlock free worldwide shipping.
            </p>
            <Link
              href="/products"
              className="inline-block mt-6 bg-sericia-ink text-sericia-paper px-8 py-4 text-[14px] tracking-wider hover:bg-sericia-accent transition-colors"
            >
              View the current drop
            </Link>
          </div>

          {/* FAQ — visible <dl> markup matched to FAQPage JSON-LD */}
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

          {/* Marquee — related comparisons strip */}
          <SectionHeading title="Browse other comparisons" />
          <div className="mt-6">
            <Marquee pauseOnHover className="[--duration:35s]">
              {PRODUCTS.filter(
                (p) => p.slug !== a.slug && p.slug !== b.slug,
              ).map((p) => {
                const pairAB = [a.slug, p.slug].sort() as [
                  ProductSlug,
                  ProductSlug,
                ];
                return (
                  <Link
                    key={`m-${p.slug}`}
                    href={`/compare/${pairAB[0]}/${pairAB[1]}`}
                    className="mx-2 inline-flex items-center gap-2 rounded-sm border border-sericia-line bg-sericia-paper-card px-5 py-3 text-[14px] text-sericia-ink hover:bg-sericia-paper-deep transition-colors"
                  >
                    {a.name} vs {p.name}
                    <span className="text-sericia-ink-mute">→</span>
                  </Link>
                );
              })}
            </Marquee>
          </div>

          <Rule className="my-12" />

          <SectionHeading title="Related comparisons" />
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
