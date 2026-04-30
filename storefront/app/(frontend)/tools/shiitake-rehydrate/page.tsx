"use client";
import { useState, useMemo } from "react";
import ToolPageShell from "@/components/ToolPageShell";

// 1-hour ISR — page is mostly static editorial / brand copy.
export const revalidate = 3600;
type Method = "cold-overnight" | "cold-6h" | "warm-30min" | "boiling-15min";

const METHOD_NOTES: Record<Method, { label: string; hours: number; waterRatio: number; note: string; score: string }> = {
  "cold-overnight": {
    label: "Cold water overnight (recommended)",
    hours: 8, waterRatio: 4,
    note: "Place shiitake in cold water in the refrigerator (4°C) 8–12 hours. Maximum guanylate release — the compound that gives dashi its depth. Use the soaking liquid.",
    score: "Best flavour — 100% guanylate extraction.",
  },
  "cold-6h": {
    label: "Cold water at room temperature",
    hours: 6, waterRatio: 4,
    note: "Cover with cold water at room temperature for 6 hours. Slightly less flavour than refrigerated, but works for same-day cooking.",
    score: "~85% guanylate extraction.",
  },
  "warm-30min": {
    label: "Warm water (40°C)",
    hours: 0.5, waterRatio: 4,
    note: "Quick fix when time is tight. Warm water at 40°C rehydrates in 30 minutes but breaks down some of the glutamate enzymes before they work. Acceptable, not optimal.",
    score: "~60% guanylate extraction.",
  },
  "boiling-15min": {
    label: "Boiling water (not recommended)",
    hours: 0.25, waterRatio: 4,
    note: "Rehydrates in 15 minutes but destroys the umami enzymes. Use only if you're discarding the soaking liquid.",
    score: "~25% guanylate extraction — avoid for dashi.",
  },
};

export default function ShiitakeRehydrate() {
  const [method, setMethod] = useState<Method>("cold-overnight");
  const [driedG, setDriedG] = useState(30);
  const m = METHOD_NOTES[method];
  const computed = useMemo(() => ({
    waterMl: driedG * m.waterRatio * 10,
    finishedG: Math.round(driedG * 4.5),
  }), [driedG, m]);

  return (
    <ToolPageShell slug="shiitake-rehydrate">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start">
        <div className="border border-sericia-line bg-sericia-paper p-8 md:p-10">
          <label className="block mb-8">
            <span className="label block mb-4">Method</span>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as Method)}
              className="w-full px-0 py-3 bg-transparent border-b border-sericia-line focus:border-sericia-ink focus:outline-none text-[16px] cursor-pointer"
            >
              {(Object.keys(METHOD_NOTES) as Method[]).map((k) => (
                <option key={k} value={k}>{METHOD_NOTES[k].label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label block mb-4">Dried shiitake (g)</span>
            <input
              type="number" min={5} max={500} step={5}
              value={driedG}
              onChange={(e) => setDriedG(Math.max(5, Math.min(500, Number(e.target.value) || 0)))}
              className="w-full px-0 py-3 bg-transparent border-b border-sericia-line focus:border-sericia-ink focus:outline-none text-[16px]"
            />
          </label>
        </div>

        <div>
          <p className="label mb-6">Rehydration plan</p>
          <div className="grid grid-cols-3 gap-6 mb-8">
            <Stat value={`${computed.waterMl}ml`} label="Cold water" />
            <Stat value={m.hours >= 1 ? `${m.hours}h` : `${Math.round(m.hours * 60)}m`} label="Time" />
            <Stat value={`${computed.finishedG}g`} label="Finished" />
          </div>
          <p className="text-[15px] text-sericia-ink-soft leading-relaxed mb-3">{m.note}</p>
          <p className="text-[12px] tracking-[0.18em] uppercase text-sericia-ink-mute">{m.score}</p>
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
