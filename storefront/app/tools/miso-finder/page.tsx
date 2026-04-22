"use client";
import { useState } from "react";
import Link from "next/link";
import SiteHeader from "../../../components/SiteHeader";
import SiteFooter from "../../../components/SiteFooter";
import ContentSidebar from "../../../components/ContentSidebar";
import { Container, Eyebrow, Rule } from "../../../components/ui";

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
    flavor: "Very sweet, creamy, pale yellow. Aka white miso&apos;s refined cousin.",
    tip: "The classic fish marinade — coat silver cod for two days, then grill.",
  },
};

export default function MisoFinder() {
  const [dish, setDish] = useState<string>("");
  const pick = DISHES.find((d) => d.val === dish)?.pick;

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
            <span>Miso Finder</span>
          </nav>
          <Eyebrow>Tool three</Eyebrow>
          <h1 className="text-[40px] md:text-[56px] leading-[1.08] font-normal tracking-tight max-w-4xl">
            Miso type finder.
          </h1>
          <p className="mt-8 text-[18px] text-sericia-ink-soft max-w-prose leading-relaxed">
            Japan has dozens of miso varieties. Pick the dish you are making and we will match the right one.
          </p>
        </Container>
      </section>

      <Container size="wide" className="py-20 md:py-28">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          <div className="flex-1 min-w-0 max-w-[720px]">
        <p className="label mb-6">What are you making?</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-sericia-line">
          {DISHES.map((d) => {
            const selected = dish === d.val;
            return (
              <button
                key={d.val}
                onClick={() => setDish(d.val)}
                className={`text-left px-6 py-5 text-[15px] transition-colors ${
                  selected ? "bg-sericia-ink text-sericia-paper" : "bg-sericia-paper-card hover:bg-sericia-paper"
                }`}
              >
                {d.label}
              </button>
            );
          })}
        </div>

        {pick && (
          <>
            <Rule className="my-16" />
            <Eyebrow>Recommended</Eyebrow>
            <h2 className="text-[32px] md:text-[40px] font-normal tracking-tight leading-[1.15] mb-10">
              {MISO_INFO[pick].name}
            </h2>
            <dl className="space-y-8">
              {[
                ["Region", MISO_INFO[pick].region],
                ["Fermentation", MISO_INFO[pick].age],
                ["Flavour", MISO_INFO[pick].flavor],
                ["Pro tip", MISO_INFO[pick].tip],
              ].map(([k, v]) => (
                <div key={k} className="grid md:grid-cols-[200px_1fr] gap-2 md:gap-6 border-b border-sericia-line pb-6">
                  <dt className="label">{k}</dt>
                  <dd className="text-[15px] text-sericia-ink-soft leading-relaxed">{v}</dd>
                </div>
              ))}
            </dl>
          </>
        )}
          </div>
          <ContentSidebar
            relatedTools={[
              { href: "/tools/shelf-life", label: "Shelf-life checker" },
              { href: "/tools/matcha-grade", label: "Matcha grade decoder" },
              { href: "/tools/tea-brewer", label: "Japanese tea brewer" },
              { href: "/tools/ems-calculator", label: "EMS shipping calculator" },
            ]}
            relatedGuides={[
              { href: "/guides/us/miso", label: "Buying miso — US guide" },
              { href: "/guides/uk/miso", label: "Buying miso — UK guide" },
              { href: "/guides/de/miso", label: "Buying miso — Germany" },
              { href: "/guides/au/miso", label: "Buying miso — Australia" },
            ]}
          />
        </div>
      </Container>
      <SiteFooter />
    </>
  );
}
