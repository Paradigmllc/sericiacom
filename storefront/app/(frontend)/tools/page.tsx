import Link from "next/link";
import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Container, PageHero } from "@/components/ui";

export const metadata: Metadata = {
  title:
    "Japanese Food Tools — EMS Calculator, Matcha Grader, Dashi Ratio | Sericia",
  description:
    "Free utilities for Japanese craft food buyers: EMS shipping calculator, matcha grade decoder, miso finder, shelf-life checker, dashi ratios, tea brewing, shiitake rehydration, yuzu substitutes.",
  alternates: { canonical: "https://sericia.com/tools" },
};

const TOOLS = [
  {
    href: "/tools/ems-calculator",
    number: "One",
    title: "EMS shipping calculator",
    desc: "Estimate Japan Post EMS cost and transit times to twenty-three destinations worldwide.",
  },
  {
    href: "/tools/matcha-grade",
    number: "Two",
    title: "Matcha grade decoder",
    desc: "Ceremonial, premium, or culinary — understand which matcha grade you actually need.",
  },
  {
    href: "/tools/miso-finder",
    number: "Three",
    title: "Miso type finder",
    desc: "White, red, or awase — match the right miso to the dish you are cooking.",
  },
  {
    href: "/tools/shelf-life",
    number: "Four",
    title: "Shelf-life checker",
    desc: "How long miso, sencha, and dried shiitake actually keep once they arrive at your door.",
  },
  {
    href: "/tools/dashi-ratio",
    number: "Five",
    title: "Dashi ratio calculator",
    desc: "Ichiban, niban, kombu, iriko, shiitake — exact gram ratios for any volume of water.",
  },
  {
    href: "/tools/tea-brewer",
    number: "Six",
    title: "Japanese tea brewer",
    desc: "Temperature, steep time, and leaf weight for sencha, gyokuro, hojicha, and matcha.",
  },
  {
    href: "/tools/shiitake-rehydrate",
    number: "Seven",
    title: "Shiitake rehydration",
    desc: "Cold water overnight extracts four times the guanylate of boiling. The method matters.",
  },
  {
    href: "/tools/yuzu-substitute",
    number: "Eight",
    title: "Yuzu substitute finder",
    desc: "Build yuzu's flavour from accessible citrus when the real fruit is unavailable.",
  },
];

export default function ToolsIndex() {
  // ItemList JSON-LD for the tools collection — same schema pattern as
  // /products and /journal so Google sees Sericia's three index pages as
  // structured collections it can crawl and surface in rich results.
  const SITE = "https://sericia.com";
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Sericia Tools — Japanese craft food utilities",
    description:
      "Eight free, focused calculators and guides for Japanese craft food buyers: EMS shipping, matcha grading, miso pairing, dashi ratios, tea brewing, shelf life, shiitake rehydration, yuzu substitutes.",
    url: `${SITE}/tools`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: TOOLS.length,
      itemListElement: TOOLS.map((t, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE}${t.href}`,
        name: t.title,
        description: t.desc,
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <SiteHeader />
      <PageHero
        eyebrow="Tools"
        title="Small utilities for serious buyers."
        lede="Free, focused calculators and guides. Each tool exists because we needed it ourselves and could not find a plain, honest version online."
      />
      <Container size="wide" className="py-20 md:py-28">
        <div className="grid md:grid-cols-2 gap-px bg-sericia-line">
          {TOOLS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="bg-sericia-paper-card p-10 md:p-12 hover:bg-sericia-paper transition-colors group"
            >
              <p className="label mb-6">{t.number}</p>
              <h2 className="text-[24px] md:text-[28px] font-normal leading-snug mb-4 group-hover:text-sericia-accent transition-colors">
                {t.title}
              </h2>
              <p className="text-[15px] text-sericia-ink-soft leading-relaxed max-w-prose">
                {t.desc}
              </p>
              <p className="mt-8 text-[12px] tracking-wider uppercase text-sericia-ink-mute">
                Open tool →
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-20 md:mt-28 border-t border-sericia-line pt-12 md:pt-16">
          <p className="label mb-4">Also</p>
          <Link
            href="/journal"
            className="text-[22px] md:text-[28px] font-normal leading-tight tracking-tight hover:text-sericia-accent transition-colors"
          >
            Read the journal — long-form writing on Japanese craft food →
          </Link>
        </div>
      </Container>
      <SiteFooter />
    </>
  );
}
