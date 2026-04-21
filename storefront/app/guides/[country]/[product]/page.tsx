import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { supabase, type PseoArticle } from "@/lib/supabase";
import { COUNTRIES, PRODUCTS } from "@/lib/pseo-matrix";
import { formatPricePPP } from "@/lib/ppp";
import SiteHeader from "../../../../components/SiteHeader";
import SiteFooter from "../../../../components/SiteFooter";
import { Container, Eyebrow, Rule, Button } from "../../../../components/ui";

export const revalidate = 86400;
export const dynamicParams = true;

type Params = { country: string; product: string };

export async function generateStaticParams() {
  return COUNTRIES.flatMap((c) =>
    PRODUCTS.map((p) => ({ country: c.code, product: p.slug }))
  );
}

async function getArticle(country: string, product: string): Promise<PseoArticle | null> {
  const { data, error } = await supabase
    .from("sericia_pseo")
    .select("*")
    .eq("country_code", country)
    .eq("product_slug", product)
    .maybeSingle();
  if (error) {
    console.error("[pseo] supabase error", error);
    return null;
  }
  return data as PseoArticle | null;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { country, product } = await params;
  const article = await getArticle(country, product);
  if (!article) return { title: "Not found — Sericia" };
  const canonical = `https://sericia.com/guides/${country}/${product}`;
  const languages = Object.fromEntries(
    COUNTRIES.map((c) => [c.locale, `https://sericia.com/guides/${c.code}/${product}`])
  );
  return {
    title: article.title,
    description: article.meta_description,
    alternates: { canonical, languages: { ...languages, "x-default": `https://sericia.com/guides/us/${product}` } },
    openGraph: {
      title: article.title,
      description: article.meta_description,
      url: canonical,
      type: "article",
      images: article.ogp_url ? [{ url: article.ogp_url, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.meta_description,
      images: article.ogp_url ? [article.ogp_url] : undefined,
    },
  };
}

function mdToHtml(md: string): string {
  return md
    .split(/\n{2,}/)
    .map((p) => `<p>${p.trim().replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

export default async function GuidePage({ params }: { params: Promise<Params> }) {
  const { country, product } = await params;
  const article = await getArticle(country, product);
  if (!article) notFound();

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
      { "@type": "ListItem", position: 1, name: "Sericia", item: "https://sericia.com" },
      { "@type": "ListItem", position: 2, name: "Guides", item: "https://sericia.com/guides" },
      { "@type": "ListItem", position: 3, name: article.country_name, item: `https://sericia.com/guides/${country}` },
      { "@type": "ListItem", position: 4, name: article.product_name },
    ],
  };
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.meta_description,
    image: article.ogp_url,
    author: { "@type": "Organization", name: "Sericia" },
    publisher: { "@type": "Organization", name: "Sericia", logo: { "@type": "ImageObject", url: "https://sericia.com/logo.png" } },
    mainEntityOfPage: `https://sericia.com/guides/${country}/${product}`,
  };

  return (
    <>
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <section className="border-b border-sericia-line bg-sericia-paper-card">
        <Container size="wide" className="py-20 md:py-28">
          <nav className="text-[12px] tracking-[0.18em] uppercase text-sericia-ink-mute mb-6">
            <Link href="/" className="hover:text-sericia-ink">Sericia</Link>
            <span className="mx-3">·</span>
            <Link href="/guides" className="hover:text-sericia-ink">Guides</Link>
            <span className="mx-3">·</span>
            <span>{article.country_name}</span>
            <span className="mx-3">·</span>
            <span>{article.product_name}</span>
          </nav>
          <Eyebrow>{article.country_name} — {article.product_name}</Eyebrow>
          <h1 className="text-[40px] md:text-[56px] leading-[1.08] font-normal tracking-tight max-w-4xl">
            {article.title}
          </h1>
          <p className="mt-8 text-[18px] md:text-[19px] text-sericia-ink-soft max-w-prose leading-relaxed">
            {article.meta_description}
          </p>
        </Container>
      </section>

      <Container size="narrow" className="py-20 md:py-28 prose-aesop">
        <div dangerouslySetInnerHTML={{ __html: mdToHtml(article.intro_md) }} />

        <Rule className="my-16" />
        <p className="label mb-4">Why Japanese</p>
        <h2>Why Japanese {article.product_name}?</h2>
        <div dangerouslySetInnerHTML={{ __html: mdToHtml(article.why_japanese_md) }} />

        <Rule className="my-16" />
        <p className="label mb-4">Shipping</p>
        <h2>Shipping to {article.country_name}</h2>
        <div dangerouslySetInnerHTML={{ __html: mdToHtml(article.shipping_info_md) }} />

        <Rule className="my-16" />
        <p className="label mb-4">Frequently asked</p>
        <h2>Frequently asked questions.</h2>
        <div className="not-prose space-y-px bg-sericia-line mt-6">
          {article.faq.map((f, i) => (
            <details key={i} className="bg-sericia-paper group">
              <summary className="cursor-pointer py-6 flex items-baseline justify-between gap-6 list-none">
                <span className="text-[17px] font-normal">{f.q}</span>
                <span className="text-[24px] text-sericia-ink-mute group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="text-[15px] text-sericia-ink-soft pb-6 leading-relaxed max-w-prose">{f.a}</p>
            </details>
          ))}
        </div>
      </Container>

      <section className="border-t border-sericia-line bg-sericia-paper-card">
        <Container size="narrow" className="py-20 md:py-28 text-center">
          <Eyebrow>Current drop</Eyebrow>
          <h2 className="text-[28px] md:text-[36px] font-normal tracking-tight leading-tight mb-6">
            Next drop every two weeks. Limited, one-time releases.
          </h2>
          <p className="text-[15px] text-sericia-ink-soft mb-10">
            {formatPricePPP(95, country)}
            <span className="text-sericia-ink-mute ml-3">— approximately $95, billed in USD, EMS worldwide included.</span>
          </p>
          <Button
            href={article.related_drop_handle ? `/drops/${article.related_drop_handle}` : "/"}
            variant="solid"
            size="large"
          >
            See the current drop
          </Button>
        </Container>
      </section>
      <SiteFooter />
    </>
  );
}
