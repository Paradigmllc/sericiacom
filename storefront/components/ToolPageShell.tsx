"use client";

/**
 * ToolPageShell — wraps a /tools/* calculator with Aesop "Library"-grade
 * editorial chrome: cinematic hero, breadcrumb, ArticleBlocks before and
 * after the interactive widget, and a related-links footer.
 *
 * Why a shell instead of a 1:1 refactor: every tool page has a useState
 * calculator, so they're all already client components. Sharing the shell
 * keeps the editorial rhythm consistent across the eight tools without
 * forcing each tool to repeat 200 lines of layout boilerplate.
 *
 * Usage:
 *   <ToolPageShell slug="tea-brewer">
 *     <YourCalculator />
 *   </ToolPageShell>
 */

import Link from "next/link";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import { Container } from "./ui";
import CategoryHero, { Breadcrumb } from "./CategoryHero";
import ArticleBlocks from "./ArticleBlocks";
import SamplerBanner from "./SamplerBanner";
import { TOOLS_CONTENT, type ToolSlug } from "@/lib/tools-content";

export default function ToolPageShell({
  slug,
  children,
}: {
  slug: ToolSlug;
  children: React.ReactNode;
}) {
  const content = TOOLS_CONTENT[slug];
  if (!content) {
    // Defensive: keeps the page rendering instead of throwing if a slug ever
    // mismatches the content map. Build-time the union narrows; runtime safety
    // matters when content edits race the tool page.
    return (
      <>
        <SiteHeader />
        <Container size="default" className="py-20 md:py-28">
          <p className="text-sericia-ink-soft">Tool content missing.</p>
        </Container>
        <SiteFooter />
      </>
    );
  }

  // ── HowTo JSON-LD: maps the 3-step quickTour onto schema.org so Google's
  //    rich-result eligibility kicks in and Perplexity / ChatGPT have a
  //    structured citation source. WebPage JSON-LD covers the basic
  //    navigability schema. Both render inline as <script> — React 19
  //    + Next 15 hoist them to <head> automatically, even from a "use
  //    client" component.
  const url = `https://sericia.com/tools/${slug}`;
  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: content.hero.title.replace(/\.$/, ""),
    description: content.whatItIs,
    url,
    step: content.quickTour.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.label,
      text: s.body,
    })),
  };
  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: content.hero.title.replace(/\.$/, ""),
    description: content.whatItIs,
    url,
    isPartOf: { "@type": "WebSite", name: "Sericia", url: "https://sericia.com" },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://sericia.com" },
        { "@type": "ListItem", position: 2, name: "Tools", item: "https://sericia.com/tools" },
        { "@type": "ListItem", position: 3, name: content.breadcrumbLabel, item: url },
      ],
    },
  };
  const pageTitle = `${content.hero.title.replace(/\.$/, "")} | Sericia Tools`;

  return (
    <>
      {/* React 19 metadata hoisting — these tags render here in the JSX tree
          but get hoisted to <head> at render time. Replaces the otherwise-
          required `export const metadata` boilerplate in 8 separate page.tsx
          files. */}
      <title>{pageTitle}</title>
      <meta name="description" content={content.whatItIs} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={content.whatItIs} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      <SiteHeader />
      <CategoryHero
        eyebrow={content.hero.eyebrow}
        title={content.hero.title}
        tone={content.hero.tone}
      />
      <Container size="default" className="pt-10 md:pt-14">
        <div className="mb-8">
          <Breadcrumb
            items={[
              { label: "Home", url: "/" },
              { label: "Tools", url: "/tools" },
              { label: content.breadcrumbLabel },
            ]}
          />
        </div>

        {/* "What this tool is" — single-sentence orientation, the answer to
            "why am I on this page?". Larger type than the body for instant
            scannability; sits at the very top of the page below breadcrumb. */}
        <p className="text-[20px] md:text-[22px] leading-[1.55] text-sericia-ink max-w-prose mb-12 md:mb-14">
          {content.whatItIs}
        </p>

        {/* Quick tour — Aesop-tier "how to use" 3-step. Numbered, no fluff,
            visible BEFORE the calculator so first-time visitors aren't faced
            with a bare form. */}
        {content.quickTour && content.quickTour.length > 0 && (
          <div className="mb-12 md:mb-14 grid grid-cols-1 md:grid-cols-3 gap-px bg-sericia-line border-y border-sericia-line">
            {content.quickTour.map((step, i) => (
              <div key={i} className="bg-sericia-paper p-6 md:p-8">
                <p className="label mb-3 tabular-nums">Step {String(i + 1).padStart(2, "0")}</p>
                <p className="text-[16px] font-normal mb-3 text-sericia-ink leading-snug">
                  {step.label}
                </p>
                <p className="text-[14px] text-sericia-ink-soft leading-relaxed">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Intro context — 2-4 ArticleBlocks setting up the why before the
            calculator surface. */}
        <ArticleBlocks blocks={content.introBlocks} />
      </Container>

      {/* Calculator slot — children are the existing stateful widget. We give
          it its own paper-card section so the editorial blocks above and below
          read as a wrapping library entry. */}
      <section className="border-y border-sericia-line bg-sericia-paper-card">
        <Container size="default" className="py-16 md:py-24">
          {children}
        </Container>
      </section>

      <Container size="default" className="py-16 md:py-24">
        {/* Worked examples — input → output → why, two scenarios side-by-side.
            Sits directly after the calculator so visitors can sanity-check
            the tool's output against curated answers. */}
        {content.workedExamples && content.workedExamples.length > 0 && (
          <div className="mb-16 md:mb-20">
            <p className="label mb-3">Examples</p>
            <h2 className="text-[24px] md:text-[28px] font-normal leading-snug mb-10 text-sericia-ink">
              Two scenarios, end-to-end.
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-sericia-line">
              {content.workedExamples.map((ex, i) => (
                <div key={i} className="bg-sericia-paper p-8 md:p-10">
                  <p className="label mb-3">Input</p>
                  <p className="text-[15px] text-sericia-ink mb-6">{ex.input}</p>
                  <p className="label mb-3">Output</p>
                  <p className="text-[20px] md:text-[22px] font-normal text-sericia-ink mb-6 leading-snug">
                    {ex.output}
                  </p>
                  <p className="label mb-3">Why</p>
                  <p className="text-[14px] text-sericia-ink-soft leading-relaxed">
                    {ex.commentary}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deeper context — table, callout, technique, CTA card. */}
        <ArticleBlocks blocks={content.afterBlocks} />

        {content.related.length > 0 && (
          <div className="mt-16 pt-12 border-t border-sericia-line">
            <p className="label mb-6">Continue reading</p>
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {content.related.map((r, i) => (
                <li key={i}>
                  <Link
                    href={r.url}
                    data-cursor="link"
                    className="block py-4 border-b border-sericia-line text-[14px] text-sericia-ink hover:text-sericia-accent transition-colors"
                  >
                    {r.label}
                    <span aria-hidden className="ml-2 text-sericia-ink-mute">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Container>

      <SamplerBanner variant="compact" />
      <SiteFooter />
    </>
  );
}
