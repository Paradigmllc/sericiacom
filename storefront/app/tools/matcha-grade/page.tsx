"use client";
import { useState } from "react";
import Link from "next/link";
import SiteHeader from "../../../components/SiteHeader";
import SiteFooter from "../../../components/SiteFooter";
import { Container, Eyebrow, Rule } from "../../../components/ui";

type Grade = "ceremonial" | "premium" | "culinary";

const QUESTIONS = [
  { key: "usage", label: "How will you use it?", options: [
    { val: "straight", label: "Whisked straight with water — koicha or usucha.", score: { ceremonial: 3, premium: 1, culinary: 0 } },
    { val: "latte", label: "Matcha latte or cappuccino.", score: { ceremonial: 0, premium: 3, culinary: 1 } },
    { val: "baking", label: "Baking — cakes, cookies, ice cream.", score: { ceremonial: 0, premium: 0, culinary: 3 } },
    { val: "smoothie", label: "Smoothie or blended drink.", score: { ceremonial: 0, premium: 1, culinary: 3 } },
  ]},
  { key: "budget", label: "Budget per thirty grams?", options: [
    { val: "low", label: "Under fifteen dollars.", score: { ceremonial: 0, premium: 1, culinary: 3 } },
    { val: "mid", label: "Fifteen to thirty-five dollars.", score: { ceremonial: 1, premium: 3, culinary: 1 } },
    { val: "high", label: "Thirty-five dollars and above.", score: { ceremonial: 3, premium: 1, culinary: 0 } },
  ]},
  { key: "bitter", label: "Bitterness tolerance?", options: [
    { val: "sweet", label: "Mellow and sweet, please.", score: { ceremonial: 3, premium: 2, culinary: 0 } },
    { val: "balanced", label: "Balanced.", score: { ceremonial: 1, premium: 3, culinary: 1 } },
    { val: "strong", label: "Bold and bitter is fine.", score: { ceremonial: 0, premium: 1, culinary: 3 } },
  ]},
] as const;

const GRADE_INFO: Record<Grade, { title: string; region: string; harvest: string; usage: string; tell: string }> = {
  ceremonial: {
    title: "Ceremonial — 抹茶儀式用",
    region: "Uji in Kyoto, and Nishio in Aichi.",
    harvest: "First harvest — ichibancha. Shade-grown for twenty days or more.",
    usage: "Whisked with seventy-degree water for chanoyu. Never milk, never sweetened.",
    tell: "Vibrant jade green, zero grittiness, umami-forward. Thirty-five to eighty dollars per thirty grams.",
  },
  premium: {
    title: "Premium — latte grade",
    region: "Uji, and Shizuoka.",
    harvest: "First or early second harvest.",
    usage: "Lattes, cappuccinos, or sipped with light sweetening.",
    tell: "Bright green, a slight bitterness rounded by milk. Twenty to thirty-five dollars per thirty grams.",
  },
  culinary: {
    title: "Culinary — ingredient grade",
    region: "Later harvests, often from Kagoshima.",
    harvest: "Second or third harvest.",
    usage: "Baking, ice cream, smoothies — where sugar or fat mask astringency.",
    tell: "Olive-green, robust and bitter. Eight to twenty dollars per thirty grams.",
  },
};

export default function MatchaGrader() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const scores = { ceremonial: 0, premium: 0, culinary: 0 };
  for (const q of QUESTIONS) {
    const ans = answers[q.key];
    if (ans) {
      const opt = q.options.find((o) => o.val === ans);
      if (opt) {
        scores.ceremonial += opt.score.ceremonial;
        scores.premium += opt.score.premium;
        scores.culinary += opt.score.culinary;
      }
    }
  }
  const done = Object.keys(answers).length === QUESTIONS.length;
  const winner = (["ceremonial", "premium", "culinary"] as Grade[]).reduce((a, b) =>
    scores[a] >= scores[b] ? a : b,
  );

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
            <span>Matcha Grade Decoder</span>
          </nav>
          <Eyebrow>Tool two</Eyebrow>
          <h1 className="text-[40px] md:text-[56px] leading-[1.08] font-normal tracking-tight max-w-4xl">
            Matcha grade decoder.
          </h1>
          <p className="mt-8 text-[18px] text-sericia-ink-soft max-w-prose leading-relaxed">
            Ceremonial, premium, or culinary — three honest questions and we will tell you which matcha you
            actually need.
          </p>
        </Container>
      </section>

      <Container size="narrow" className="py-20 md:py-28">
        <div className="space-y-12">
          {QUESTIONS.map((q, idx) => (
            <div key={q.key}>
              <p className="label mb-4">Question {idx + 1}</p>
              <h2 className="text-[22px] font-normal mb-6">{q.label}</h2>
              <div className="space-y-px bg-sericia-line">
                {q.options.map((o) => {
                  const selected = answers[q.key] === o.val;
                  return (
                    <label
                      key={o.val}
                      className={`flex cursor-pointer items-center gap-4 px-6 py-5 bg-sericia-paper-card hover:bg-sericia-paper transition-colors ${
                        selected ? "bg-sericia-paper" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name={q.key}
                        value={o.val}
                        checked={selected}
                        onChange={() => setAnswers({ ...answers, [q.key]: o.val })}
                        className="accent-sericia-ink"
                      />
                      <span className="text-[15px]">{o.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {done && (
          <>
            <Rule className="my-16" />
            <div>
              <Eyebrow>Your match</Eyebrow>
              <h2 className="text-[32px] md:text-[40px] font-normal tracking-tight leading-[1.15] mb-10">
                {GRADE_INFO[winner].title}
              </h2>
              <dl className="space-y-8">
                {[
                  ["Region", GRADE_INFO[winner].region],
                  ["Harvest", GRADE_INFO[winner].harvest],
                  ["Use for", GRADE_INFO[winner].usage],
                  ["What to look for", GRADE_INFO[winner].tell],
                ].map(([k, v]) => (
                  <div key={k} className="grid md:grid-cols-[200px_1fr] gap-2 md:gap-6 border-b border-sericia-line pb-6">
                    <dt className="label">{k}</dt>
                    <dd className="text-[15px] text-sericia-ink-soft leading-relaxed">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </>
        )}
      </Container>
      <SiteFooter />
    </>
  );
}
