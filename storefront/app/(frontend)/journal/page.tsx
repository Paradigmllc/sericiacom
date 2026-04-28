import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import CategoryHero, { Breadcrumb } from "@/components/CategoryHero";
import JournalTagFilter from "@/components/JournalTagFilter";
import { Container } from "@/components/ui";
import {
  listAllJournalEntries,
  countByTag,
  tagLabel,
  type JournalTag,
} from "@/lib/journal-entries";

/**
 * /journal — unified Library index.
 *
 * Pulls from three sources via lib/journal-entries (static authored, Payload
 * pSEO, country×product guides) and presents them as one filterable list.
 * Server reads `?tag=` from searchParams; chip clicks push a new URL.
 *
 * Cache window: 30 minutes. Payload-side pSEO articles can land at any time
 * (n8n cron drains nightly), so a longer ISR is unnecessary; 30 min keeps
 * the index responsive without per-request Payload load on every visit.
 */

export const revalidate = 1800; // 30 min

const VALID_TAGS: ReadonlyArray<JournalTag> = ["story", "technique", "guide", "country-guide"];

function parseTag(raw: string | undefined): JournalTag | "all" {
  if (!raw) return "all";
  return (VALID_TAGS as ReadonlyArray<string>).includes(raw)
    ? (raw as JournalTag)
    : "all";
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const sp = await searchParams;
  const tag = parseTag(typeof sp.tag === "string" ? sp.tag : undefined);
  // Don't append "| Sericia" — RootLayout's metadata template
  // (`title.template: "%s | Sericia"`) does that automatically.
  // Otherwise we get "...Japanese craft food | Sericia | Sericia".
  const baseTitle = "Journal — Writing on Japanese craft food";
  const baseDesc =
    "Stories, techniques, and country-by-country guides for buying and brewing Japanese craft food. Sencha, matcha, miso, dashi, shiitake, yuzu — written by the team who packs each drop in Kyoto.";
  if (tag === "all") {
    return {
      title: baseTitle,
      description: baseDesc,
      alternates: { canonical: "https://sericia.com/journal" },
    };
  }
  return {
    title: `${tagLabel(tag)} — Sericia Journal`,
    description: `${tagLabel(tag)} pieces from the Sericia Journal: ${baseDesc}`,
    alternates: { canonical: "https://sericia.com/journal" },
  };
}

export default async function JournalIndex({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const tPage = await getTranslations("pages.journal");
  const tag = parseTag(typeof sp.tag === "string" ? sp.tag : undefined);
  const all = await listAllJournalEntries();
  const counts = countByTag(all);
  const filtered = tag === "all" ? all : all.filter((e) => e.tag === tag);

  // Schema: a Blog with the visible (filtered) post list. Each post entry
  // gets its own URL so Google can crawl /journal?tag=guide as a distinct
  // index even though the canonical URL is the unfiltered /journal.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Sericia Journal",
    url: "https://sericia.com/journal",
    description:
      "Stories, techniques, and country-by-country guides for buying and brewing Japanese craft food.",
    publisher: {
      "@type": "Organization",
      name: "Sericia",
      url: "https://sericia.com",
    },
    blogPost: filtered.slice(0, 50).map((e) => ({
      "@type": "BlogPosting",
      headline: e.title,
      url: `https://sericia.com${e.href}`,
      datePublished: e.publishedAt ?? undefined,
      keywords: e.tag,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />
      <CategoryHero
        eyebrow={tPage("eyebrow")}
        title={tPage("title")}
        tone="paper"
      />
      <Container size="wide" className="pt-10 md:pt-14 pb-20 md:pb-28">
        <div className="mb-8">
          <Breadcrumb items={[{ label: "Home", url: "/" }, { label: "Journal" }]} />
        </div>

        <p className="mb-10 text-[16px] text-sericia-ink-soft max-w-prose leading-relaxed">
          Long-form writing about Japanese craft food in three streams. <strong>Stories</strong> are
          the brand essays. <strong>Techniques</strong> are how-to pieces — brewing, aging, pairing.{" "}
          <strong>Country guides</strong> walk through importing tea, miso, shiitake and more from
          Japan to your country specifically.
        </p>

        <div className="mb-10">
          <JournalTagFilter current={tag} counts={counts} />
        </div>

        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="label mb-3">Nothing yet</p>
            <p className="text-[15px] text-sericia-ink-soft max-w-md mx-auto">
              No pieces in this section right now. Pick another chip above, or write to{" "}
              <a href="mailto:contact@sericia.com" className="underline-link">
                contact@sericia.com
              </a>{" "}
              with a question — answered pieces become Journal entries.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-sericia-line border-y border-sericia-line">
            {filtered.map((entry) => (
              <li key={entry.href}>
                <Link
                  href={entry.href}
                  data-cursor="link"
                  className="grid grid-cols-1 md:grid-cols-[160px_1fr_auto] gap-4 md:gap-8 items-baseline py-6 group"
                >
                  <p className="text-[11px] tracking-[0.22em] uppercase text-sericia-ink-mute">
                    {tagLabel(entry.tag)}
                  </p>
                  <div className="min-w-0">
                    <p className="text-[18px] md:text-[20px] leading-snug text-sericia-ink group-hover:text-sericia-accent transition-colors">
                      {entry.title}
                    </p>
                    {entry.lede && (
                      <p className="mt-2 text-[14px] text-sericia-ink-soft leading-relaxed line-clamp-2">
                        {entry.lede}
                      </p>
                    )}
                  </div>
                  <p className="text-[12px] text-sericia-ink-mute tabular-nums whitespace-nowrap">
                    {entry.publishedAt
                      ? new Date(entry.publishedAt).toISOString().slice(0, 10)
                      : entry.eyebrow}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 border-t border-sericia-line">
          <Link
            href="/products"
            className="block py-4 border-b border-sericia-line text-[14px] text-sericia-ink hover:text-sericia-accent transition-colors"
          >
            Shop the rescued collection →
          </Link>
          <Link
            href="/tools"
            className="block py-4 border-b border-sericia-line text-[14px] text-sericia-ink hover:text-sericia-accent transition-colors"
          >
            Use the brewing & shipping tools →
          </Link>
          <Link
            href="/about"
            className="block py-4 border-b border-sericia-line text-[14px] text-sericia-ink hover:text-sericia-accent transition-colors"
          >
            Read about Sericia →
          </Link>
        </div>
      </Container>
      <SiteFooter />
    </>
  );
}
