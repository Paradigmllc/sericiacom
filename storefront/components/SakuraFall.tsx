/**
 * SakuraFall — CSS-only cherry blossom petal particles.
 *
 * Why this exists (and why it's not tsparticles):
 *   • tsparticles is ~40KB gzipped. This file is <1KB. The visual payoff
 *     of 14 drifting petals at 0.22 opacity doesn't justify a physics engine.
 *   • GPU-friendly: only `transform` and `opacity` are animated — no layout
 *     thrash, no repaints, composited on the GPU thread.
 *   • Aesop-restraint: petals are quiet (max opacity 0.22), slow
 *     (19–30s fall time), and sparse (14 total). Not a "cherry blossom
 *     storm" — this is the faint memory of one.
 *
 * SSR / Hydration:
 *   • Petal positions are deterministic (a frozen tuple array) — server
 *     and client render byte-identical HTML. No `Math.random()` in render.
 *   • No React hooks. This is a Server Component, so it has zero JS cost
 *     on the client (the browser just gets pre-rendered <span>s + a style tag).
 *
 * Accessibility:
 *   • `aria-hidden` — screen readers skip this decorative layer.
 *   • `pointer-events: none` — petals never intercept clicks on CTAs below.
 *   • `@media (prefers-reduced-motion: reduce)` — a CSS-level gate. No
 *     `useReducedMotion()` hook is needed (which would otherwise cause a
 *     null → bool hydration flash).
 *
 * Usage:
 *   <section className="relative overflow-hidden">
 *     <SakuraFall zIndex={5} />
 *     ... hero content ...
 *   </section>
 *
 * Notes:
 *   • Parent must be `position: relative` (absolute fill won't work otherwise).
 *   • Parent should have `overflow-hidden` — the petals briefly exit the box
 *     during the sway, and you don't want horizontal scrollbars.
 *   • Color is a dusty rose (`rgba(212, 180, 185, 0.22)`) — tuned to read as
 *     "faint petal" against both paper/ink/sage tones in the brand palette.
 */

// Fixed deterministic petal config — identical on server and client.
// Each row: [leftPercent, sizePx, durationSec, delaySec, swayPx, rotateEndDeg]
//
// The 14 values were picked to spread across the viewport width (2%–96%)
// with staggered delays so petals never arrive all at once. Sway directions
// alternate (+/-) to avoid a single drift bias.
const PETALS: ReadonlyArray<readonly [number, number, number, number, number, number]> = [
  [5, 14, 22, 0, 40, 360],
  [12, 18, 26, 3, -35, -280],
  [22, 12, 19, 7, 50, 400],
  [31, 16, 28, 2, -45, -320],
  [40, 14, 24, 9, 38, 300],
  [48, 20, 30, 5, -55, -380],
  [56, 13, 21, 11, 42, 340],
  [64, 17, 27, 1, -40, -300],
  [72, 15, 23, 8, 48, 360],
  [79, 19, 29, 4, -50, -340],
  [85, 13, 20, 10, 35, 280],
  [91, 16, 25, 6, -42, -320],
  [96, 15, 26, 13, 45, 380],
  [2, 17, 28, 12, -38, -300],
];

type Props = {
  /**
   * CSS `z-index` for the petal layer. Place between background and
   * foreground in the parent's stacking context. Default 1.
   */
  zIndex?: number;
};

export default function SakuraFall({ zIndex = 1 }: Props) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ zIndex }}
    >
      {PETALS.map(([left, size, duration, delay, sway, rotate], i) => (
        <span
          key={i}
          className="sericia-petal absolute"
          style={{
            left: `${left}%`,
            top: "-10%",
            width: `${size}px`,
            height: `${size}px`,
            animationDuration: `${duration}s`,
            animationDelay: `${delay}s`,
            // CSS custom properties feed into the @keyframes below.
            // Cast via string key so TS accepts non-standard CSS vars.
            ["--petal-sway" as string]: `${sway}px`,
            ["--petal-rotate" as string]: `${rotate}deg`,
          }}
        >
          <svg viewBox="0 0 24 24" className="h-full w-full" fill="currentColor">
            {/* Simplified cherry-petal: teardrop with a soft curl.
                At 12–20px and 0.22 opacity the silhouette reads as "petal"
                without needing the full 5-lobe blossom detail. */}
            <path d="M12 2c-3 3-5 7-5 11 0 3 2 6 5 9 3-3 5-6 5-9 0-4-2-8-5-11z" />
          </svg>
        </span>
      ))}

      <style>{`
        .sericia-petal {
          color: rgba(212, 180, 185, 0.22);
          will-change: transform, opacity;
          animation-name: sericia-petal-fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        @keyframes sericia-petal-fall {
          0% {
            transform: translate3d(0, 0, 0) rotate(0deg);
            opacity: 0;
          }
          8% {
            opacity: 1;
          }
          92% {
            opacity: 1;
          }
          100% {
            transform: translate3d(var(--petal-sway, 40px), 120vh, 0)
                       rotate(var(--petal-rotate, 360deg));
            opacity: 0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .sericia-petal { animation: none; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
