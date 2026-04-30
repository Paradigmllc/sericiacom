"use client";
import { useState } from "react";
import ToolPageShell from "@/components/ToolPageShell";

// 1-hour ISR — page is mostly static editorial / brand copy.
export const revalidate = 3600;
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
    <ToolPageShell slug="shelf-life">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start">
        <div className="border border-sericia-line bg-sericia-paper p-8 md:p-10">
          <label className="block mb-8">
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
            <span className="text-[15px] text-sericia-ink">Package has been opened</span>
          </label>
        </div>

        <div>
          <p className="label mb-4">Expected shelf life</p>
          <p className="text-[48px] md:text-[64px] font-normal leading-none tracking-tight mb-3 text-sericia-ink">
            {daysToHuman(days)}
          </p>
          <p className="text-[12px] tracking-wider uppercase text-sericia-ink-mute mb-6">
            {days} days at proper storage
          </p>
          <p className="text-[15px] text-sericia-ink-soft leading-relaxed">{info.note}</p>
          <p className="mt-6 text-[12px] tracking-wider uppercase text-sericia-ink-mute leading-relaxed">
            Sensory check always wins — mould, off-odour, or drastic colour change means discard regardless of date.
          </p>
        </div>
      </div>
    </ToolPageShell>
  );
}
