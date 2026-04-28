import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ContentSidebar from "@/components/ContentSidebar";
import { Container, Eyebrow, Rule } from "@/components/ui";
import { JOURNAL, getArticle } from "@/lib/journal";

// Locales that have journal translations (en default). URL pattern stays the
// same per-locale since the middleware rewrites /ja/journal/... → /journal/...
// and NextIntl reads copy via the cookie. Editorial copy is English-first;
// hreflang points to the same slug for every locale.
const LOCALES = ["en", "ja", "de", "fr", "es", "it", "ko", "zh-TW", "ru"] as const;

export const revalidate = 86400; // 24h
export const dynamicParams = false;

export async function generateStaticParams() {
  return JOURNAL.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return { title: "Not found" };
  const canonical = `https://sericia.com/journal/${slug}`;
  const languages = Object.fromEntries(
    LOCALES.map((l) => [l, canonical])
  );
  return {
    // Don't append "| Sericia" — RootLayout template does it.
    // We append "Journal" so the tab signal includes the section.
    title: `${article.title} — Journal`,
    description: article.lede,
    alternates: {
      canonical,
      languages: { ...languages, "x-default": canonical },
    },
    openGraph: {
      title: article.title,
      description: article.lede,
      url: canonical,
      type: "article",
      publishedTime: article.published,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.lede,
    },
  };
}

export default async function JournalArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const url = `https://sericia.com/journal/${slug}`;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.lede,
    datePublished: article.published,
    dateModified: article.published,
    author: { "@type": "Organization", name: "Sericia" },
    publisher: {
      "@type": "Organization",
      name: "Sericia",
      logo: {
        "@type": "ImageObject",
        url: "https://sericia.com/icon.svg",
      },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    inLanguage: "en",
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: article.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Sericia",
        item: "https://sericia.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Journal",
        item: "https://sericia.com/journal",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.title,
        item: url,
      },
    ],
  };

  const sidebarSections = [
    { href: "#tldr", label: "TL;DR" },
    ...article.sections.map((s) => ({ href: `#${s.id}`, label: s.heading })),
    { href: "#faq", label: "FAQ" },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([articleJsonLd, faqJsonLd, breadcrumbJsonLd]),
        }}
      />
      <SiteHeader />

      <section className="border-b border-sericia-line bg-sericia-paper-card">
        <Container size="wide" className="py-20 md:py-28">
          <nav className="text-[12px] tracking-[0.18em] uppercase text-sericia-ink-mute mb-6">
            <Link href="/" className="hover:text-sericia-ink">
              Sericia
            </Link>
            <span className="mx-3">·</span>
            <Link href="/journal" className="hover:text-sericia-ink">
              Journal
            </Link>
            <span className="mx-3">·</span>
            <span>{article.eyebrow}</span>
          </nav>
          <Eyebrow>{article.eyebrow}</Eyebrow>
          <h1 className="text-[40px] md:text-[56px] leading-[1.08] font-normal tracking-tight max-w-4xl">
            {article.title}
          </h1>
          <p className="mt-8 text-[18px] text-sericia-ink-soft max-w-prose leading-relaxed">
            {article.lede}
          </p>
          <p className="mt-8 text-[12px] tracking-[0.18em] uppercase text-sericia-ink-mute">
            {new Date(article.published).toLocaleDateString("en-GB", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}{" "}
            · {article.readingMinutes} min read
          </p>
        </Container>
      </section>

      <Container size="wide" className="py-16 md:py-20">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          <article className="flex-1 min-w-0 max-w-prose">
            {/* TL;DR — GEO-friendly answer block at the top */}
            <section
              id="tldr"
              className="border border-sericia-line bg-sericia-paper-card p-8 md:p-10 mb-12 scroll-mt-28"
            >
              <p className="label mb-3">TL;DR</p>
              <p className="text-[16px] text-sericia-ink leading-relaxed">
                {article.tldr}
              </p>
            </section>

            {/* Self-citable stats */}
            {article.stats.length > 0 && (
              <>
                <div className="grid grid-cols-3 gap-8 mb-14">
                  {article.stats.map((s) => (
                    <div key={s.label}>
                      <div className="text-[28px] md:text-[36px] font-normal leading-none mb-2 tabular-nums">
                        {s.value}
                      </div>
                      <div className="label">{s.label}</div>
                    </div>
                  ))}
                </div>
                <Rule className="mb-14" />
              </>
            )}

            {/* Body sections */}
            <div className="space-y-14">
              {article.sections.map((sec) => (
                <section
                  key={sec.id}
                  id={sec.id}
                  className="scroll-mt-28"
                >
                  <h2 className="text-[26px] md:text-[32px] font-normal leading-tight tracking-tight mb-5">
                    {sec.heading}
                  </h2>
                  <p className="text-[16px] text-sericia-ink-soft leading-relaxed">
                    {sec.body}
                  </p>
                </section>
              ))}
            </div>

            <Rule className="my-16" />

            {/* FAQ */}
            <section id="faq" className="scroll-mt-28">
              <Eyebrow>Frequently asked</Eyebrow>
              <h2 className="text-[26px] md:text-[32px] font-normal leading-tight tracking-tight mb-10">
                Questions, answered.
              </h2>
              <dl className="space-y-8">
                {article.faq.map((f, i) => (
                  <div
                    key={i}
                    className="border-t border-sericia-line pt-8 first:border-0 first:pt-0"
                  >
                    <dt className="text-[18px] md:text-[20px] font-normal leading-snug tracking-tight mb-3">
                      {f.q}
                    </dt>
                    <dd className="text-[15px] text-sericia-ink-soft leading-relaxed">
                      {f.a}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            {article.relatedArticles && article.relatedArticles.length > 0 && (
              <>
                <Rule className="my-16" />
                <section>
                  <Eyebrow>Keep reading</Eyebrow>
                  <ul className="space-y-4">
                    {article.relatedArticles.map((r) => (
                      <li key={r.href}>
                        <Link
                          href={r.href}
                          className="text-[17px] text-sericia-ink hover:text-sericia-accent transition-colors border-b border-sericia-line hover:border-sericia-accent pb-1"
                        >
                          {r.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              </>
            )}
          </article>

          <ContentSidebar
            sectionTitle="In this article"
            sections={sidebarSections}
            relatedTools={
              article.relatedTools && article.relatedTools.length > 0
                ? article.relatedTools
                : undefined
            }
            relatedGuides={
              article.relatedArticles && article.relatedArticles.length > 0
                ? article.relatedArticles
                : undefined
            }
          />
        </div>
      </Container>
      <SiteFooter />
    </>
  );
}
