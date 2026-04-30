"use client";
import { useState } from "react";
import ToolPageShell from "@/components/ToolPageShell";

// 1-hour ISR — page is mostly static editorial / brand copy.
export const revalidate = 3600;
type MisoType = "shiro" | "aka" | "awase" | "hatcho" | "saikyo";

const DISHES = [
  { val: "soup-light", label: "Light miso soup for breakfast.", pick: "shiro" as MisoType },
  { val: "soup-hearty", label: "Hearty winter miso soup.", pick: "aka" as MisoType },
  { val: "ramen", label: "Miso ramen broth.", pick: "awase" as MisoType },
  { val: "glaze", label: "Fish or eggplant glaze.", pick: "saikyo" as MisoType },
  { val: "marinade", label: "Meat marinade.", pick: "hatcho" as MisoType },
  { val: "dressing", label: "Salad dressing or dip.", pick: "shiro" as MisoType },
  { val: "pickle", label: "Vegetable pickling — miso-zuke.", pick: "saikyo" as MisoType },
  { val: "stew", label: "Slow-cooked stew.", pick: "hatcho" as MisoType },
];

const MISO_INFO: Record<MisoType, { name: string; region: string; age: string; flavor: string; tip: string }> = {
  shiro: {
    name: "Shiro miso — 白味噌",
    region: "Kyoto, Kansai region.",
    age: "Two weeks to three months.",
    flavor: "Sweet, mild, low salt. A high rice-koji ratio.",
    tip: "Do not boil — add after the heat is off to preserve aroma and probiotics.",
  },
  aka: {
    name: "Aka miso — 赤味噌",
    region: "Northern and eastern Japan.",
    age: "One to three years.",
    flavor: "Deep umami, salty, robust. Longer fermentation — darker and stronger.",
    tip: "At its best in cold-weather dishes and rich broths.",
  },
  awase: {
    name: "Awase miso — 合わせ味噌",
    region: "The nationwide household standard.",
    age: "Variable.",
    flavor: "Balanced — the safe all-purpose choice. A blend of shiro and aka.",
    tip: "If you only buy one miso, buy this.",
  },
  hatcho: {
    name: "Hatcho miso — 八丁味噌",
    region: "Okazaki, Aichi — three producers only.",
    age: "Two to three years, soy-only — no rice koji.",
    flavor: "Intensely dark, rich, slightly bitter. Protein-dense.",
    tip: "Stew-friendly — it holds up to long cooking where lighter miso breaks down.",
  },
  saikyo: {
    name: "Saikyo miso — 西京味噌",
    region: "Kyoto.",
    age: "About one month.",
    flavor: "Very sweet, creamy, pale yellow. Aka white miso's refined cousin.",
    tip: "The classic fish marinade — coat silver cod for two days, then grill.",
  },
};

export default function MisoFinder() {
  const [dish, setDish] = useState<string>("");
  const pick = DISHES.find((d) => d.val === dish)?.pick;

  return (
    <ToolPageShell slug="miso-finder">
      <div>
        <p className="label mb-3">Pick the dish</p>
        <h3 className="text-[20px] font-normal mb-6 text-sericia-ink">What are you cooking?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-sericia-line mb-10">
          {DISHES.map((d) => (
            <label
              key={d.val}
              className={`flex cursor-pointer items-center gap-4 px-6 py-4 bg-sericia-paper hover:bg-sericia-paper-deep transition-colors ${
                dish === d.val ? "bg-sericia-paper-deep" : ""
              }`}
            >
              <input
                type="radio"
                name="dish"
                value={d.val}
                checked={dish === d.val}
                onChange={() => setDish(d.val)}
                className="accent-sericia-ink"
              />
              <span className="text-[15px] text-sericia-ink">{d.label}</span>
            </label>
          ))}
        </div>

        {pick && (
          <div className="pt-10 border-t border-sericia-line">
            <p className="label mb-3">Reach for</p>
            <h3 className="text-[28px] md:text-[36px] font-normal tracking-tight leading-tight mb-8 text-sericia-ink">
              {MISO_INFO[pick].name}
            </h3>
            <dl className="space-y-5">
              {[
                ["Region", MISO_INFO[pick].region],
                ["Aged", MISO_INFO[pick].age],
                ["Flavor", MISO_INFO[pick].flavor],
                ["Cook with it", MISO_INFO[pick].tip],
              ].map(([k, v]) => (
                <div key={k} className="grid md:grid-cols-[180px_1fr] gap-2 md:gap-6 border-b border-sericia-line pb-4">
                  <dt className="label">{k}</dt>
                  <dd className="text-[15px] text-sericia-ink-soft leading-relaxed">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </ToolPageShell>
  );
}
