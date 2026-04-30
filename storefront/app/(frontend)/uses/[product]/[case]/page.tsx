import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Container, Eyebrow, Rule, SectionHeading } from "@/components/ui";
import { PRODUCTS, USE_CASES } from "@/lib/pseo-matrix";

/**
 * /uses/[product]/[case] — "X for Y" use-case guide.
 *
 * F40 Zapier-style pSEO permutation: every product × use case combination
 * gets its own URL. 12 products × 6 use cases = 72 base URLs × hreflang
 * in 10 locales = 720 indexable surfaces.
 *
 * Search intent targeted: "matcha for morning energy", "miso for gut
 * health", "shiitake for vegetarian umami" — pure long-tail captures
 * that AI search engines rank highly because the query is specific
 * (low competition, high relevance).
 *
 * Server-rendered, no client JS required, full Article + BreadcrumbList
 * + FAQ JSON-LD.
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

// F41 hotfix: removed generateStaticParams — Hetzner CPX22 OOM-kills
// the build when 72 uses + 66 compare pages are statically generated
// alongside the existing 144 guides + Payload + Crossmint SDK. Pages
// now render dynamically on first visit and Cloudflare edge-caches
// the response per the 1h HTML cache rule. From the second visitor's
// perspective the route is indistinguishable from a static build.

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { product: rawP, case: rawC } = await params;
  const r = resolve(rawP, rawC);
  if (!r) return { title: "Guide not found — Sericia" };
  const title = `${r.product.name} for ${r.useCase.name} | Sericia`;
  const description = `Why ${r.product.name} fits ${r.useCase.name.toLowerCase()}: practical use, sourcing notes, and pairing recommendations from Sericia's curators.`;
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
          <Eyebrow>Use guide</Eyebrow>
          <h1 className="text-[36px] md:text-[52px] leading-[1.1] font-normal tracking-tight mt-4">
            {product.name} for {useCase.name}.
          </h1>

          {/* TL;DR — GEO optimisation */}
          <p className="text-[18px] md:text-[20px] mt-8 leading-relaxed text-sericia-ink-soft">
            <strong className="text-sericia-ink">TL;DR:</strong>{" "}
            {product.name} is well-suited to {useCase.name.toLowerCase()}.
            This guide covers practical preparation, sourcing notes, and
            pairing recommendations to help you get the most from each
            serving.
          </p>

          <Rule className="my-12" />

          <SectionHeading title="Why this combination works" />
          <p className="text-[16px] leading-relaxed text-sericia-ink-soft max-w-prose mt-6">
            {product.name} brings characteristics that make it a strong
            choice for {useCase.name.toLowerCase()}. See{" "}
            <Link
              href={`/products/${product.slug}`}
              className="underline-link"
            >
              the {product.name} product page
            </Link>{" "}
            for full sourcing notes, producer interviews, and current
            drop availability.
          </p>

          <Rule className="my-12" />

          <SectionHeading title={`Other uses for ${product.name}`} />
          <ul className="grid md:grid-cols-2 gap-3 text-[15px] mt-6">
            {USE_CASES.filter((u) => u.slug !== useCase.slug).map((u) => (
              <li key={u.slug}>
                <Link
                  href={`/uses/${product.slug}/${u.slug}`}
                  className="underline-link"
                >
                  {product.name} for {u.name}
                </Link>
              </li>
            ))}
          </ul>

          <Rule className="my-12" />

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
