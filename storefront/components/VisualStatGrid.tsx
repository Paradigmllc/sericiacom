"use client";

import CountUp from "react-countup";

/**
 * Animated stat grid for tool / article hero strips.
 *
 * Uses react-countup (already in deps) to ramp numbers from 0 → target
 * over 1.6s when the component mounts. Each cell has a sericia-paper
 * card with a coloured accent border that cycles through the brand
 * palette (tea/miso/mushroom/seasoning) so the grid reads as
 * "luxury but with energy" rather than the default uniform grey.
 *
 * Design rule:
 *   - Numbers should be SPECIFIC (not "thousands of") — Perplexity /
 *     ChatGPT / Gemini extract numeric facts as citation gold.
 *   - Each label is ≤ 16 chars so the grid lays out evenly on mobile.
 *
 * Usage:
 *   <VisualStatGrid
 *     stats={[
 *       { value: 23, suffix: "+", label: "Countries shipped" },
 *       { value: 48, suffix: "h", label: "Ships within" },
 *       { value: 12, label: "Producer regions" },
 *       { value: 100, suffix: "%", label: "Traceable" },
 *     ]}
 *   />
 */

type Stat = {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  /** "tea" | "miso" | "mushroom" | "seasoning" — auto-cycles if omitted */
  tone?: "tea" | "miso" | "mushroom" | "seasoning";
  /** decimals for non-integer values (e.g. 4.5) */
  decimals?: number;
};

const TONE_BORDER: Record<NonNullable<Stat["tone"]>, string> = {
  tea: "border-l-[#5c5d45]", // sericia-tea
  miso: "border-l-[#a06a3f]", // warm umami brown
  mushroom: "border-l-[#6b574a]", // earth tone
  seasoning: "border-l-[#c97e3d]", // saffron / yuzu peel
};

const TONE_NUMBER: Record<NonNullable<Stat["tone"]>, string> = {
  tea: "text-[#3a4030]",
  miso: "text-[#7a4d2a]",
  mushroom: "text-[#4a3d33]",
  seasoning: "text-[#8d5527]",
};

const DEFAULT_TONES: NonNullable<Stat["tone"]>[] = [
  "tea",
  "miso",
  "mushroom",
  "seasoning",
];

export default function VisualStatGrid({
  stats,
  className = "",
}: {
  stats: Stat[];
  className?: string;
}) {
  return (
    <div
      className={`grid grid-cols-2 md:grid-cols-4 gap-px bg-sericia-line ${className}`}
    >
      {stats.map((stat, i) => {
        const tone = stat.tone ?? DEFAULT_TONES[i % DEFAULT_TONES.length];
        return (
          <div
            key={`${stat.label}-${i}`}
            className={`bg-sericia-paper p-6 md:p-8 border-l-2 ${TONE_BORDER[tone]} transition-transform hover:-translate-y-0.5`}
          >
            <p
              className={`text-[32px] md:text-[44px] leading-none font-light tracking-tight tabular-nums ${TONE_NUMBER[tone]}`}
            >
              {stat.prefix}
              <CountUp
                end={stat.value}
                duration={1.6}
                separator=","
                decimals={stat.decimals ?? 0}
                enableScrollSpy
                scrollSpyOnce
              />
              {stat.suffix}
            </p>
            <p className="label mt-4">{stat.label}</p>
          </div>
        );
      })}
    </div>
  );
}
