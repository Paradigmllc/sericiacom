import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { getLocale } from "next-intl/server";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import CategoryHero, { Breadcrumb } from "@/components/CategoryHero";
import { Container } from "@/components/ui";
import { getPayloadClient } from "@/lib/payload";
import type { Locale } from "@/i18n/routing";
import SamplerBanner from "@/components/SamplerBanner";

/**
 * /articles/[slug] — canonical URL for Payload-driven articles, including
 * pSEO articles emitted by /api/pseo/generate. Sister route to /journal/[slug]
 * (which serves hand-authored editorial content from lib/journal.ts).
 *
 * Why two routes:
 *   • /journal/[slug]: stable curated editorial. Bounded slug list, fully
 *     SSG (`dynamicParams = false`).
 *   • /articles/[slug]: Payload-resolved (matrix-generated). Slugs are
 *     volume-emitted by the generator; ISR-friendly, dynamic params allowed.
 *
 * Slug resolution:
 *   • The pSEO generator namespaces non-English slugs as `${locale}-${base}`
 *     (e.g. `de-aichi-aka-miso-pairings`) so global uniqueness holds in
 *     Payload's articles.slug field.
 *   • The viewer's locale comes from next-intl middleware. We try the active
 *     locale first; on miss we fall back to English so a `/articles/aichi-foo`
 *     hit on /ja still finds the German/English original instead of 404'ing.
 *
 * Rendering: Lexical body → @payloadcms/richtext-lexical/react RichText
 * (matches StoryBlockRenderer pattern). Highlights / FAQ / TLDR are array
 * fields rendered separately above and below the body.
 */

export const revalidate = 3600; // 1h ISR — cheap to refresh as drops change.

const SITE_URL = "https://sericia.com";

async function fetchArticle(slug: string, locale: Locale) {
  try {
    const payload = await getPayloadClient();
    const { docs } = await payload.find({
      collection: "articles",
      where: { slug: { equals: slug } },
      locale: locale as never,
      fallbackLocale: "en" as never,
      depth: 1,
      limit: 1,
      pagination: false,
    });
    return docs[0] ?? null;
  } catch (e) {
    // Payload outage shouldn't 500 the storefront — surface as not-found so
    // CDN serves a 404 cache rather than a 500. Live verifier picks this up.
    console.error("[articles/[slug]] Payload fetch failed:", e);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = (await getLocale()) as Locale;
  const article = await fetchArticle(slug, locale);
  if (!article) return { title: "Not found — Sericia", robots: { index: false } };

  const canonical = `${SITE_URL}/articles/${slug}`;
  const seo = (article.seo ?? {}) as { metaTitle?: string | null; metaDescription?: string | null };
  return {
    title: seo.metaTitle ?? `${article.title} | Sericia`,
    description: seo.metaDescription ?? undefined,
    alternates: { canonical },
    openGraph: {
      title: seo.metaTitle ?? article.title,
      description: seo.metaDescription ?? undefined,
      url: canonical,
      type: "article",
      publishedTime: article.publishedAt ?? undefined,
    },
    twitter: { card: "summary_large_image" },
  };
}

type Highlight = { text: string };
type FAQ = { q: string; a: string };

export default async function PayloadArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = (await getLocale()) as Locale;
  const article = await fetchArticle(slug, locale);
  if (!article) notFound();

  const url = `${SITE_URL}/articles/${slug}`;
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    datePublished: article.publishedAt ?? undefined,
    dateModified: article.updatedAt ?? article.publishedAt ?? undefined,
    author: { "@type": "Organization", name: "Sericia" },
    publisher: {
      "@type": "Organization",
      name: "Sericia",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/og-default.svg` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };

  // Pull category-tagged eyebrow + headline. Cluster tags such as
  // "gtm-de-miso" tell us this is a pSEO article so the breadcrumb can read
  // accordingly; otherwise we treat it as Journal.
  const tags = (article.tags ?? []) as Array<{ tag?: string | null } | null>;
  const isPseo = tags.some((t) => t?.tag?.startsWith?.("gtm-"));
  const eyebrow = isPseo ? "Country guide" : "Journal";

  const highlights = (article.highlights ?? []) as Highlight[];
  const faq = (article.faq ?? []) as FAQ[];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <SiteHeader />
      <CategoryHero eyebrow={eyebrow} title={article.title} tone="paper" />
      <Container size="default" className="py-16 md:py-24">
        <div className="mb-10">
          <Breadcrumb
            items={[
              { label: "Home", url: "/" },
              { label: isPseo ? "Guides" : "Journal", url: isPseo ? "/guides" : "/journal" },
              { label: article.title },
            ]}
          />
        </div>

        {/* TLDR (lead) — only when the article has one */}
        {article.tldr ? (
          <section className="mb-12 max-w-prose border-l-2 border-sericia-accent pl-6">
            <p className="label mb-3">Summary</p>
            <div className="prose-aesop text-[18px] md:text-[19px] text-sericia-ink leading-[1.7]">
              <RichText data={article.tldr} />
            </div>
          </section>
        ) : null}

        {/* Body — Lexical → JSX. Default converters cover headings, lists,
            inline marks, links. Custom blocks (image, table, callout) are
            not yet emitted by the pSEO generator; we'll add a converter when
            it learns to. */}
        <article className="prose-aesop max-w-prose text-sericia-ink-soft text-[16px] md:text-[17px] leading-[1.85]">
          <RichText data={article.body} />
        </article>

        {/* Highlights — sidebar-style bullets shown after the body for
            Aesop-tier "key takeaways" repetition (helps GEO/AI parsing too). */}
        {highlights.length > 0 && (
          <aside className="mt-16 border-y border-sericia-line py-10 max-w-prose">
            <p className="label mb-5">Key takeaways</p>
            <ul className="space-y-3">
              {highlights.map((h, i) => (
                <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-sericia-ink">
                  <span aria-hidden className="text-sericia-accent">·</span>
                  <span>{h.text}</span>
                </li>
              ))}
            </ul>
          </aside>
        )}

        {/* FAQ — uses native <details> so the page is keyboard + reader friendly
            without JS, and FAQPage JSON-LD (added below) gives Perplexity /
            ChatGPT a clean parse target. */}
        {faq.length > 0 && (
          <>
            <section className="mt-16 max-w-prose">
              <p className="label mb-6">Frequently asked</p>
              <dl className="divide-y divide-sericia-line">
                {faq.map((item, i) => (
                  <details key={i} className="group py-5">
                    <summary className="flex items-start justify-between cursor-pointer list-none">
                      <dt className="text-[16px] pr-8 text-sericia-ink">{item.q}</dt>
                      <span
                        aria-hidden
                        className="text-sericia-ink-mute text-[20px] leading-none group-open:rotate-45 transition-transform"
                      >
                        +
                      </span>
                    </summary>
                    <dd className="mt-3 text-[15px] text-sericia-ink-soft leading-relaxed">
                      {item.a}
                    </dd>
                  </details>
                ))}
              </dl>
            </section>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  mainEntity: faq.map((it) => ({
                    "@type": "Question",
                    name: it.q,
                    acceptedAnswer: { "@type": "Answer", text: it.a },
                  })),
                }),
              }}
            />
          </>
        )}

        {/* Cross-link back to the shop and journal so search-driven landings
            don't dead-end. */}
        <div className="mt-20 flex flex-wrap gap-4 text-[12px] tracking-[0.18em] uppercase">
          <Link href="/products" className="border-b border-sericia-ink pb-0.5 hover:opacity-70 transition">
            Browse the collection →
          </Link>
          <Link href="/journal" className="text-sericia-ink-mute hover:text-sericia-ink transition">
            More journal pieces
          </Link>
        </div>
      </Container>

      <SamplerBanner variant="compact" />
      <SiteFooter />
    </>
  );
}
