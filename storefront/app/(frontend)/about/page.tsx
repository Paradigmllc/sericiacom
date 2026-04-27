import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Container } from "@/components/ui";
import CategoryHero from "@/components/CategoryHero";
import ArticleBlocks from "@/components/ArticleBlocks";
import type { ArticleBlock } from "@/lib/article-blocks";
import { webPageJsonLd } from "@/lib/page-jsonld";

/**
 * /about — Aesop-tier brand narrative.
 *
 * Refactored from the previous flat prose-aesop layout to the shared
 * ArticleBlocks renderer so the brand voice composes the same way as
 * journal articles, pSEO pages, and PDP rich content. This is the
 * canonical demo of:
 *   • CategoryHero (cinematic banner)
 *   • imageText sections (Aesop "Fragrance Armoire" pattern)
 *   • statRow (animated numbers)
 *   • pullQuote (large editorial italic)
 *   • highlightBanner (key takeaway)
 *   • cta cards
 *   • marquee (rotating producer / region tags)
 *   • table (producer-share comparison)
 *
 * Editor experience: in a follow-up, this page will be backed by Payload
 * `pages.bodyBlocks` so editors can author the same kit visually. For now
 * the blocks are co-located here for SSR speed and predictability.
 */

export const metadata: Metadata = {
  title: "About Sericia | 会社情報",
  description:
    "Sericia is a Kyoto-rooted, globally shipped curation of rescued Japanese craft food — near-expiry surplus sourced directly from small producers and bundled into limited drops.",
  alternates: { canonical: "https://sericia.com/about" },
};

const blocks: ArticleBlock[] = [
  {
    type: "paragraph",
    size: "lead",
    body: [
      { mark: "text", text: "Sericia is a limited-drop storefront for near-expiry surplus from small Japanese producers — " },
      { mark: "highlight", text: "tea, miso, shiitake, and other craft foods" },
      { mark: "text", text: " that would otherwise be discarded despite being in peak condition." },
    ],
  },
  {
    type: "marquee",
    items: [
      "Uji, Kyoto",
      "Aichi cedar sheds",
      "Yamagata bamboo racks",
      "Kagoshima volcanic soil",
      "Hokkaido cold seas",
      "Tokushima yuzu",
      "Wakayama ume",
      "Tamba heirloom",
    ],
    durationSeconds: 60,
  },

  // ── One — Why this exists (image+text) ──
  {
    type: "imageText",
    imagePosition: "right",
    eyebrow: "One",
    heading: "Why this exists",
    body: "Japan's craft food makers produce exceptional goods on small margins. A 120-year-old miso shed, a single-origin sencha farmer, a family drying shiitake on bamboo racks — each produces limited volume on long timelines. A missed wholesale order, a printing error on a label, a slightly-too-short remaining best-before window: any of these can push weeks of work into disposal. Not because the food is less good, but because the distribution system was never built for small batches and international eaters.",
    ctaLabel: "See the current drop",
    ctaUrl: "/products",
    imageSrc: "",
    imageAlt: "Cedar miso shed in Aichi",
    tone: "miso",
    ratio: "4/5",
  },

  // ── Producer-share principle as a highlight banner ──
  {
    type: "highlightBanner",
    text: "When a producer is about to lose stock to expiry, the conventional discount channel pays them cents on the yen. Sericia pays the producer their full wholesale price.",
    tone: "ink",
  },

  // ── Two — How a drop comes together (image+text) ──
  {
    type: "imageText",
    imagePosition: "left",
    eyebrow: "Two",
    heading: "How a drop comes together",
    body: "We work with a rotating set of small producers across Kyoto, Uji, Nagano, and Oita. Each drop pulls stock from three to five of them. Every piece is tasted, weighed, and approved before it enters the bundle. If it wouldn't arrive on our own dinner table, it doesn't ship. Hand-packed in Kyoto within 48 hours of the drop going live, EMS worldwide with tracking, customs paperwork pre-filled on our side.",
    imageSrc: "",
    imageAlt: "Hands packing a drop in Kyoto",
    tone: "tea",
    ratio: "4/5",
  },

  // ── Stats ──
  {
    type: "statRow",
    items: [
      { value: 23, suffix: "+", label: "Countries shipped" },
      { value: 48, suffix: "h", label: "Dispatch from Kyoto" },
      { value: 100, suffix: "%", label: "Producers paid full price" },
    ],
  },

  // ── Producer-share table ──
  {
    type: "heading",
    level: 2,
    eyebrow: "Three",
    text: "The producer-share principle",
  },
  {
    type: "paragraph",
    body: "Conventional surplus channels pay producers a fraction of wholesale. Sericia inverts that contract — the producer earns full wholesale, and our margin comes from the international retail uplift we add for curation, packing, and EMS paperwork. Numbers below per ¥1,000 retail unit:",
  },
  {
    type: "table",
    rowHeaders: true,
    headers: ["Channel", "Producer paid", "Producer share"],
    rows: [
      ["Conventional surplus discounter", "¥200–¥280", "20–28%"],
      ["Wholesale retailer (full price)", "¥400", "40%"],
      ["Sericia (rescued bundle)", "¥400", "40%"],
      ["Direct relationship (Phase 2)", "¥350+", "35%+"],
    ],
    caption: "Per ¥1,000 retail unit. Sericia matches wholesale even on rescued stock.",
  },
  {
    type: "callout",
    variant: "tip",
    title: "Non-negotiable",
    body: "If we can't land a bundle at full producer-share, the bundle doesn't ship. Our economics, not theirs.",
  },

  // ── Pull quote ──
  {
    type: "pullQuote",
    quote:
      "Rescued doesn't mean lesser. It means the same craft, two weeks earlier than the supermarket would otherwise discard it.",
    attribution: "Sericia editorial",
  },

  // ── Four — Limited drops ──
  {
    type: "imageText",
    imagePosition: "right",
    eyebrow: "Four",
    heading: "Why limited drops",
    body: "Rescued stock is, by definition, finite. Limited-drop scheduling lets us move exactly the volume a producer has available, without creating evergreen demand we can't meet. It also keeps freight efficient — one concentrated shipping window per drop means tighter EMS rates and fresher arrival. Subscribers to the next-drop waitlist receive the release 24 hours before public sale.",
    ctaLabel: "Join the waitlist",
    ctaUrl: "/#waitlist",
    imageSrc: "",
    imageAlt: "Drop bundle on washi paper",
    tone: "drop",
    ratio: "4/5",
  },

  { type: "divider", style: "asterism" },

  // ── Five — Who's behind ──
  {
    type: "heading",
    level: 2,
    eyebrow: "Five",
    text: "Who's behind Sericia",
  },
  {
    type: "paragraph",
    body: [
      { mark: "text", text: "Sericia is operated by " },
      { mark: "bold", text: "Paradigm LLC" },
      {
        mark: "text",
        text: ", a Delaware-registered company running small Japan-to-world craft commerce brands. Our Japan operations are headquartered in Tokyo with a dispatch node in Kyoto. Contact us at ",
      },
      { mark: "link", text: "contact@sericia.com", url: "mailto:contact@sericia.com" },
      { mark: "text", text: "." },
    ],
  },

  // ── Closing CTA card ──
  {
    type: "cta",
    variant: "card",
    label: "Browse the collection",
    url: "/products",
    caption: "Drop No. 01 is live. Forty-eight units remaining.",
  },

  { type: "divider", style: "wide" },

  // ── FAQ ──
  {
    type: "faq",
    items: [
      {
        q: "Is rescued stock expired or substandard?",
        a: "No. Every product is well within its best-before window and from the same lots producers sell at full retail. 'Rescued' refers only to stock we source ahead of release-window cutoffs.",
      },
      {
        q: "Why a single curated bundle instead of a marketplace?",
        a: "Rescued stock is finite and unpredictable. A curated drop matches what's actually available; a marketplace would create demand we couldn't fulfil cleanly.",
      },
      {
        q: "Where does Sericia ship to?",
        a: "Most of North America, the EU, UK, Australia, Singapore, Hong Kong, Canada and Japan. Full list and transit times on /shipping.",
      },
    ],
  },
];

export default function AboutPage() {
  const jsonLd = webPageJsonLd({
    variant: "AboutPage",
    name: "About Sericia",
    description:
      "Sericia is a Kyoto-rooted, globally shipped curation of rescued Japanese craft food — near-expiry surplus sourced directly from small producers and bundled into limited drops.",
    path: "/about",
    breadcrumb: [{ label: "Home", path: "/" }, { label: "About", path: "/about" }],
  });
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />
      <CategoryHero
        eyebrow="About"
        title="Rescued Japanese craft, curated in Kyoto."
        tone="ink"
      />
      <Container size="default" className="py-20 md:py-28">
        <ArticleBlocks blocks={blocks} />
      </Container>
      <SiteFooter />
    </>
  );
}
