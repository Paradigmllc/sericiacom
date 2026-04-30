"use client";
import { useState } from "react";
import ToolPageShell from "@/components/ToolPageShell";

// 1-hour ISR — page is mostly static editorial / brand copy.
export const revalidate = 3600;
type TeaType = "sencha" | "gyokuro" | "bancha" | "hojicha" | "genmaicha" | "matcha-koicha" | "matcha-usucha";

const PARAMS: Record<TeaType, { label: string; waterTempC: number; steepSeconds: number; leafPerMl: number; note: string }> = {
  sencha: {
    label: "Sencha",
    waterTempC: 75,
    steepSeconds: 60,
    leafPerMl: 3 / 100,
    note: "Cool boiling water to ~75°C before pouring. Decant fully — the last drop carries the sweetness. A second steep (80°C, 15 s) is shorter.",
  },
  gyokuro: {
    label: "Gyokuro (shaded)",
    waterTempC: 55,
    steepSeconds: 120,
    leafPerMl: 4 / 60,
    note: "The gentlest, sweetest Japanese green. Low temperature reveals umami; high temperature destroys it. Small volume, concentrated.",
  },
  bancha: {
    label: "Bancha",
    waterTempC: 85,
    steepSeconds: 45,
    leafPerMl: 3 / 100,
    note: "Everyday green — forgiving and bright. Higher temperature tolerated. Good cold-brewed in summer.",
  },
  hojicha: {
    label: "Hojicha (roasted)",
    waterTempC: 95,
    steepSeconds: 30,
    leafPerMl: 3 / 100,
    note: "Low caffeine, toasty. Near-boiling water. Steeps fast. Excellent iced with a slice of yuzu peel.",
  },
  genmaicha: {
    label: "Genmaicha (rice-blended)",
    waterTempC: 90,
    steepSeconds: 45,
    leafPerMl: 3 / 100,
    note: "Popped brown rice balances the tannin. Near-boiling water, short steep. The rice aroma fades after the second steep.",
  },
  "matcha-usucha": {
    label: "Matcha — usucha (thin)",
    waterTempC: 75,
    steepSeconds: 0,
    leafPerMl: 2 / 70,
    note: "Thin, foamy, everyday matcha. Whisk 2g matcha with 70ml water at 75°C in a zig-zag motion for ~15 seconds until a foam forms.",
  },
  "matcha-koicha": {
    label: "Matcha — koicha (thick)",
    waterTempC: 75,
    steepSeconds: 0,
    leafPerMl: 4 / 30,
    note: "Ceremonial thick matcha. 4g matcha with just 30ml water at 75°C, kneaded rather than whisked. Reserved for ceremonial-grade matcha only.",
  },
};

export default function TeaBrewer() {
  const [tea, setTea] = useState<TeaType>("sencha");
  const [cupMl, setCupMl] = useState(150);
  const p = PARAMS[tea];
  const leafG = Math.max(0.5, Math.round(cupMl * p.leafPerMl * 10) / 10);

  return (
    <ToolPageShell slug="tea-brewer">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start">
        <div className="border border-sericia-line bg-sericia-paper p-8 md:p-10">
          <label className="block mb-8">
            <span className="label block mb-4">Tea</span>
            <select
              value={tea}
              onChange={(e) => setTea(e.target.value as TeaType)}
              className="w-full px-0 py-3 bg-transparent border-b border-sericia-line focus:border-sericia-ink focus:outline-none text-[16px] cursor-pointer"
            >
              {(Object.keys(PARAMS) as TeaType[]).map((k) => (
                <option key={k} value={k}>{PARAMS[k].label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label block mb-4">Cup size (ml)</span>
            <input
              type="number"
              min={30}
              max={1000}
              step={10}
              value={cupMl}
              onChange={(e) => setCupMl(Math.max(30, Math.min(1000, Number(e.target.value) || 0)))}
              className="w-full px-0 py-3 bg-transparent border-b border-sericia-line focus:border-sericia-ink focus:outline-none text-[16px]"
            />
          </label>
        </div>

        <div>
          <p className="label mb-6">Brew this</p>
          <div className="grid grid-cols-3 gap-6 mb-8">
            <Stat value={`${p.waterTempC}°C`} label="Water temp" />
            <Stat value={p.steepSeconds === 0 ? "Whisk" : `${p.steepSeconds}s`} label="Steep" />
            <Stat value={`${leafG}g`} label="Leaf" />
          </div>
          <p className="text-[15px] text-sericia-ink-soft leading-relaxed">{p.note}</p>
        </div>
      </div>
    </ToolPageShell>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-[26px] md:text-[32px] font-normal leading-none mb-2 tabular-nums text-sericia-ink">{value}</div>
      <div className="label">{label}</div>
    </div>
  );
}
