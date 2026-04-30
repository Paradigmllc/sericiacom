"use client";
import { useState } from "react";
import ToolPageShell from "@/components/ToolPageShell";

// 1-hour ISR — page is mostly static editorial / brand copy.
export const revalidate = 3600;
const DISHES = [
  {
    val: "ponzu",
    label: "Ponzu sauce",
    substitute: "Lemon + lime + a drop of mandarin or orange zest.",
    ratio: "Lemon 60%, lime 30%, mandarin zest 10%.",
    note: "Yuzu's defining quality is a grapefruit-like bitter note with sharp floral aromatics. Lemon alone is too one-dimensional — adding lime plus mandarin rebuilds the complexity.",
  },
  {
    val: "yuzu-kosho",
    label: "Yuzu kosho paste",
    substitute: "Lemon zest + green chilli + salt.",
    ratio: "Zest of 2 lemons + 1 small green chilli + 1 tsp sea salt, muddled and rested 24h.",
    note: "The real paste is fermented with green chilli. A fresh substitute skips fermentation but captures the citrus-heat hit. Rest 24 hours before using.",
  },
  {
    val: "dressings",
    label: "Salad dressings",
    substitute: "Lime juice + grapefruit zest.",
    ratio: "Lime juice 80%, finely grated grapefruit zest 20%.",
    note: "The pink grapefruit contributes yuzu's slight bitterness that lemon can't. Use Key lime where available.",
  },
  {
    val: "dessert",
    label: "Desserts and pastry",
    substitute: "Meyer lemon + a touch of bergamot.",
    ratio: "Meyer lemon 90%, bergamot (earl grey tea) 10%.",
    note: "Meyer lemon's honeyed note is closer to yuzu than regular lemon. A splash of cold-brewed Earl Grey adds the floral register.",
  },
  {
    val: "hot-pot",
    label: "Hot pot / nabe dipping",
    substitute: "Ponzu made from lemon + soy + mirin + katsuobushi.",
    ratio: "4 tbsp lemon juice + 3 tbsp soy + 2 tbsp mirin + 1 tsp katsuobushi, rested 1h.",
    note: "The hot-pot application needs acid + umami, not pure citrus. The ratio here is traditional for yuzu ponzu and works with lemon as the acid driver.",
  },
];

export default function YuzuSubstitute() {
  const [dish, setDish] = useState(DISHES[0].val);
  const d = DISHES.find((x) => x.val === dish)!;

  return (
    <ToolPageShell slug="yuzu-substitute">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start">
        <div className="border border-sericia-line bg-sericia-paper p-8 md:p-10">
          <label className="block">
            <span className="label block mb-4">What are you making?</span>
            <select
              value={dish}
              onChange={(e) => setDish(e.target.value)}
              className="w-full px-0 py-3 bg-transparent border-b border-sericia-line focus:border-sericia-ink focus:outline-none text-[16px] cursor-pointer"
            >
              {DISHES.map((x) => <option key={x.val} value={x.val}>{x.label}</option>)}
            </select>
          </label>
        </div>

        <div>
          <p className="label mb-4">Substitute</p>
          <p className="text-[24px] md:text-[28px] font-normal leading-tight tracking-tight mb-3 text-sericia-ink">{d.substitute}</p>
          <p className="text-[12px] tracking-[0.18em] uppercase text-sericia-ink-mute mb-6">{d.ratio}</p>
          <p className="text-[15px] text-sericia-ink-soft leading-relaxed">{d.note}</p>
        </div>
      </div>
    </ToolPageShell>
  );
}
