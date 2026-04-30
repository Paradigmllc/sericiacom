"use client";
import { useState, useMemo } from "react";
import ToolPageShell from "@/components/ToolPageShell";

// 1-hour ISR — page is mostly static editorial / brand copy.
export const revalidate = 3600;
type Style = "ichiban" | "niban" | "awase" | "kombu" | "iriko" | "shiitake";

const STYLES: Record<Style, { label: string; kombu: number; katsuo: number; iriko: number; shiitake: number; note: string; best: string }> = {
  ichiban: {
    label: "Ichiban dashi (first extraction)",
    kombu: 10, katsuo: 20, iriko: 0, shiitake: 0,
    note: "Clear, gold-tinted, delicate. Kombu soaked cold 30–60 min, brought to 60–65°C, removed; katsuobushi added off-heat and strained within 60 seconds.",
    best: "Clear soups, chawanmushi, refined broths.",
  },
  niban: {
    label: "Niban dashi (second extraction)",
    kombu: 10, katsuo: 10, iriko: 0, shiitake: 0,
    note: "Re-simmer the used kombu and katsuo from ichiban in fresh water for 10 minutes with a small top-up of katsuobushi. Deeper, slightly smoky.",
    best: "Miso soup, simmered dishes, nimono.",
  },
  awase: {
    label: "Awase dashi (household blend)",
    kombu: 8, katsuo: 15, iriko: 0, shiitake: 0,
    note: "A simplified ichiban. Cold-soak kombu for 20 min, bring to near-boil, add katsuobushi off-heat for 90 seconds, strain.",
    best: "Everyday use — miso soup, egg dishes, udon.",
  },
  kombu: {
    label: "Kombu dashi (vegan)",
    kombu: 15, katsuo: 0, iriko: 0, shiitake: 0,
    note: "Cold brew overnight (8–12 h) or warm at 60°C for 1 hour. Never boil kombu — it turns slimy and bitter.",
    best: "Vegan cooking, delicate fish, tofu dishes.",
  },
  iriko: {
    label: "Iriko dashi (sardine)",
    kombu: 5, katsuo: 0, iriko: 15, shiitake: 0,
    note: "Remove heads and black innards from iriko. Cold-soak with kombu for 30 min, simmer 7 minutes. Bold, slightly fishy.",
    best: "Udon broths, hearty miso soups, country cooking.",
  },
  shiitake: {
    label: "Shiitake dashi (vegan, deep)",
    kombu: 5, katsuo: 0, iriko: 0, shiitake: 15,
    note: "Cold-brew dried shiitake overnight in refrigerator. Combine with kombu for full-bodied vegan dashi. Do not discard the mushrooms — reuse in nimono.",
    best: "Vegan ramen, winter stews, noodle dipping sauce.",
  },
};

export default function DashiRatio() {
  const [style, setStyle] = useState<Style>("awase");
  const [water, setWater] = useState(1000);
  const s = STYLES[style];
  const ratios = useMemo(() => {
    const f = water / 1000;
    return {
      kombu: Math.round(s.kombu * f),
      katsuo: Math.round(s.katsuo * f),
      iriko: Math.round(s.iriko * f),
      shiitake: Math.round(s.shiitake * f),
    };
  }, [water, s]);

  return (
    <ToolPageShell slug="dashi-ratio">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start">
        <div className="border border-sericia-line bg-sericia-paper p-8 md:p-10">
          <label className="block mb-8">
            <span className="label block mb-4">Style</span>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value as Style)}
              className="w-full px-0 py-3 bg-transparent border-b border-sericia-line focus:border-sericia-ink focus:outline-none text-[16px] cursor-pointer"
            >
              {(Object.keys(STYLES) as Style[]).map((k) => (
                <option key={k} value={k}>{STYLES[k].label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label block mb-4">Water (ml)</span>
            <input
              type="number"
              min={100} max={5000} step={100}
              value={water}
              onChange={(e) => setWater(Math.max(100, Math.min(5000, Number(e.target.value) || 0)))}
              className="w-full px-0 py-3 bg-transparent border-b border-sericia-line focus:border-sericia-ink focus:outline-none text-[16px]"
            />
          </label>
        </div>

        <div>
          <p className="label mb-6">Exact ratio</p>
          <div className="grid grid-cols-2 gap-6 mb-8">
            {ratios.kombu > 0 && <Stat value={`${ratios.kombu}g`} label="Kombu" />}
            {ratios.katsuo > 0 && <Stat value={`${ratios.katsuo}g`} label="Katsuobushi" />}
            {ratios.iriko > 0 && <Stat value={`${ratios.iriko}g`} label="Iriko" />}
            {ratios.shiitake > 0 && <Stat value={`${ratios.shiitake}g`} label="Shiitake" />}
            <Stat value={`${water}ml`} label="Water" />
          </div>
          <p className="text-[15px] text-sericia-ink-soft leading-relaxed">{s.note}</p>
          <p className="mt-4 text-[12px] tracking-[0.18em] uppercase text-sericia-ink-mute">
            Best for: {s.best}
          </p>
        </div>
      </div>
    </ToolPageShell>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-[28px] md:text-[34px] font-normal leading-none mb-2 tabular-nums text-sericia-ink">{value}</div>
      <div className="label">{label}</div>
    </div>
  );
}
