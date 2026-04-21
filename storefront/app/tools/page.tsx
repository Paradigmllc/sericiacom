import Link from "next/link";
import type { Metadata } from "next";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import { Container, PageHero } from "../../components/ui";

export const metadata: Metadata = {
  title: "Japanese Food Tools — EMS Calculator, Matcha Grader, Miso Finder | Sericia",
  description: "Free utilities for Japanese craft food buyers: EMS shipping calculator, matcha grade decoder, miso finder, shelf-life checker. Built by Sericia.",
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
];

export default function ToolsIndex() {
  return (
    <>
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
              <p className="text-[15px] text-sericia-ink-soft leading-relaxed max-w-prose">{t.desc}</p>
              <p className="mt-8 text-[12px] tracking-wider uppercase text-sericia-ink-mute">
                Open tool →
              </p>
            </Link>
          ))}
        </div>
      </Container>
      <SiteFooter />
    </>
  );
}
