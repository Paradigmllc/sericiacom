"use client";

/**
 * Coloured-bar comparison table for /compare/[a]/[b].
 *
 * Renders rows of "attribute → A bar / B bar" where each bar is a
 * proportional horizontal fill in the brand palette. This visualises
 * the comparison far better than a plain text table and keeps the
 * visitor's eye scanning across rows.
 *
 * No charting library needed — pure CSS bars, server-renderable
 * if marked use client only because of the entrance animation.
 * (We mark it client because the small slide-in transition reads
 * as "alive" on first paint.)
 *
 * Each attribute row gets a distinct hue chosen from the brand
 * palette so the table doesn't read as a wall of uniform grey.
 */

type Row = {
  /** Short attribute label, e.g. "Caffeine", "Umami depth" */
  label: string;
  /** 0–100 score for product A */
  a: number;
  /** 0–100 score for product B */
  b: number;
  /** Optional one-line explanation shown under the row */
  note?: string;
};

const ROW_TONES = [
  { fillA: "#5c5d45", fillB: "#a06a3f" }, // tea / miso
  { fillA: "#6b574a", fillB: "#c97e3d" }, // mushroom / seasoning
  { fillA: "#4a604c", fillB: "#a08240" }, // moss / amber
  { fillA: "#7a4d2a", fillB: "#3a4030" }, // umami / forest
  { fillA: "#8d5527", fillB: "#5a5e44" }, // saffron / olive
  { fillA: "#a06a3f", fillB: "#4a604c" }, // miso / moss
];

export default function ColorfulComparisonTable({
  productA,
  productB,
  rows,
}: {
  productA: string;
  productB: string;
  rows: Row[];
}) {
  return (
    <div className="bg-sericia-paper border border-sericia-line rounded-sm overflow-hidden">
      {/* Header row — product labels */}
      <div className="grid grid-cols-[1fr_2fr_2fr] gap-4 p-5 bg-sericia-paper-card border-b border-sericia-line">
        <div className="label">Attribute</div>
        <div className="label text-[#3a4030]">{productA}</div>
        <div className="label text-[#7a4d2a]">{productB}</div>
      </div>

      {rows.map((row, i) => {
        const tone = ROW_TONES[i % ROW_TONES.length];
        const aPct = Math.max(0, Math.min(100, row.a));
        const bPct = Math.max(0, Math.min(100, row.b));
        return (
          <div
            key={`${row.label}-${i}`}
            className="grid grid-cols-[1fr_2fr_2fr] gap-4 p-5 border-b border-sericia-line last:border-b-0"
          >
            {/* Label cell */}
            <div className="flex flex-col justify-center">
              <p className="text-[15px] font-medium text-sericia-ink">
                {row.label}
              </p>
              {row.note ? (
                <p className="text-[12px] text-sericia-ink-mute mt-1 leading-snug">
                  {row.note}
                </p>
              ) : null}
            </div>

            {/* Bar A */}
            <div className="flex items-center gap-3">
              <div
                aria-label={`${productA}: ${aPct}`}
                className="flex-1 h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: "rgba(33, 35, 29, 0.06)" }}
              >
                <div
                  className="h-full rounded-full origin-left"
                  style={{
                    width: `${aPct}%`,
                    backgroundColor: tone.fillA,
                    animation: "ccmp-grow 900ms cubic-bezier(0.65, 0, 0.35, 1) both",
                  }}
                />
              </div>
              <span className="text-[12px] tabular-nums text-sericia-ink-soft min-w-[2ch] text-right">
                {aPct}
              </span>
            </div>

            {/* Bar B */}
            <div className="flex items-center gap-3">
              <div
                aria-label={`${productB}: ${bPct}`}
                className="flex-1 h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: "rgba(33, 35, 29, 0.06)" }}
              >
                <div
                  className="h-full rounded-full origin-left"
                  style={{
                    width: `${bPct}%`,
                    backgroundColor: tone.fillB,
                    animation: "ccmp-grow 900ms cubic-bezier(0.65, 0, 0.35, 1) both",
                  }}
                />
              </div>
              <span className="text-[12px] tabular-nums text-sericia-ink-soft min-w-[2ch] text-right">
                {bPct}
              </span>
            </div>
          </div>
        );
      })}

      <style jsx>{`
        @keyframes ccmp-grow {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="ccmp-grow"] {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
