"use client";
import { useState } from "react";
import Link from "next/link";
import SiteHeader from "../../../components/SiteHeader";
import SiteFooter from "../../../components/SiteFooter";
import { Container, Eyebrow, Rule } from "../../../components/ui";

const ITEMS = [
  { val: "sencha", label: "Sencha — sealed", pantry: 730, open: 90, note: "Nitrogen-flushed vacuum packs hold for two years unopened. Once opened, oxidation accelerates — finish within three months for peak flavour." },
  { val: "matcha", label: "Matcha powder — sealed", pantry: 365, open: 30, note: "Once opened, matcha loses vibrancy within weeks. Refrigerate to slow oxidation, but warm to room temperature before whisking." },
  { val: "miso-shiro", label: "Shiro white miso — unopened", pantry: 365, open: 60, note: "Short fermentation means a shorter shelf life. Refrigerate after opening; surface discolouration is harmless but flavour fades." },
  { val: "miso-aka", label: "Aka red or hatcho miso — unopened", pantry: 1095, open: 365, note: "Long-aged miso is nearly indestructible. Refrigerated, it stays usable for a year or more after opening, and flavour deepens." },
  { val: "shiitake", label: "Dried shiitake — sealed", pantry: 1095, open: 180, note: "Store cool and dry. Vacuum-sealed lasts three years or more. After opening, an airtight jar plus a silica pack gives six months." },
  { val: "dashi-granule", label: "Granulated dashi — sealed", pantry: 545, open: 180, note: "Keep dry — humidity causes clumping but not spoilage. Eighteen months sealed, six months after opening." },
  { val: "yuzu-kosho", label: "Yuzu kosho paste", pantry: 365, open: 90, note: "Refrigerate after opening. Oil separation is normal — stir before use. Colour darkens over time, flavour stays bright." },
  { val: "shichimi", label: "Shichimi togarashi", pantry: 365, open: 120, note: "Aromatics — yuzu peel and nori — fade fastest. Replace when the scent is gone even if the spice remains." },
  { val: "furikake", label: "Furikake rice seasoning", pantry: 545, open: 180, note: "Sesame and nori fade first. Small single-serve packets preserve freshness best." },
];

function daysToHuman(d: number): string {
  if (d < 60) return `${d} days`;
  if (d < 365) return `${Math.round(d / 30)} months`;
  return `${(d / 365).toFixed(1)} years`;
}

export default function ShelfLife() {
  const [item, setItem] = useState(ITEMS[0].val);
  const [opened, setOpened] = useState(false);
  const info = ITEMS.find((i) => i.val === item)!;
  const days = opened ? info.open : info.pantry;

  return (
    <>
      <SiteHeader />
      <section className="border-b border-sericia-line bg-sericia-paper-card">
        <Container size="wide" className="py-20 md:py-28">
          <nav className="text-[12px] tracking-[0.18em] uppercase text-sericia-ink-mute mb-6">
            <Link href="/" className="hover:text-sericia-ink">Sericia</Link>
            <span className="mx-3">·</span>
            <Link href="/tools" className="hover:text-sericia-ink">Tools</Link>
            <span className="mx-3">·</span>
            <span>Shelf-Life Checker</span>
          </nav>
          <Eyebrow>Tool four</Eyebrow>
          <h1 className="text-[40px] md:text-[56px] leading-[1.08] font-normal tracking-tight max-w-4xl">
            Japanese food shelf-life checker.
          </h1>
          <p className="mt-8 text-[18px] text-sericia-ink-soft max-w-prose leading-relaxed">
            How long does miso really keep? Sencha, shiitake, matcha — real numbers, not guesses.
          </p>
        </Container>
      </section>

      <Container size="narrow" className="py-20 md:py-28">
        <div className="border border-sericia-line bg-sericia-paper-card p-10 md:p-12">
          <label className="block mb-10">
            <span className="label block mb-4">What do you have?</span>
            <select
              value={item}
              onChange={(e) => setItem(e.target.value)}
              className="w-full px-0 py-3 bg-transparent border-b border-sericia-line focus:border-sericia-ink focus:outline-none text-[16px] cursor-pointer"
            >
              {ITEMS.map((i) => <option key={i.val} value={i.val}>{i.label}</option>)}
            </select>
          </label>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={opened}
              onChange={(e) => setOpened(e.target.checked)}
              className="h-4 w-4 accent-sericia-ink"
            />
            <span className="text-[15px]">Package has been opened</span>
          </label>
        </div>

        <Rule className="my-16" />

        <Eyebrow>Expected shelf life</Eyebrow>
        <p className="text-[56px] md:text-[72px] font-normal leading-none tracking-tight mb-4">
          {daysToHuman(days)}
        </p>
        <p className="text-[13px] tracking-wider uppercase text-sericia-ink-mute mb-10">
          {days} days at proper storage
        </p>
        <p className="text-[15px] text-sericia-ink-soft leading-relaxed max-w-prose">{info.note}</p>

        <Rule className="my-16" />
        <p className="text-[12px] tracking-wider uppercase text-sericia-ink-mute max-w-prose leading-relaxed">
          Estimates based on Japan Agricultural Standards (JAS) and producer-declared best-by windows.
          Sensory check always wins — mould, off-odour, or drastic colour change means discard regardless of date.
        </p>
      </Container>
      <SiteFooter />
    </>
  );
}
