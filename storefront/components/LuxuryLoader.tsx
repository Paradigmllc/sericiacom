"use client";
import { useEffect, useState } from "react";

/**
 * First-paint spinner.
 *
 * History
 * ──────
 * v1 (M4c-9): full-screen noren curtain with the 鮮 hanko + SERICIA wordmark
 *   + tagline. Removed per F22 brand-asset rule (no CJK in brand chrome) and
 *   user directive「ローディングはぐるぐるのみ」.
 * v2: ring spinner on a translucent paper-tinted backdrop covering the
 *   viewport. User feedback 2026-04-28:
 *     「ローディングアニメーションの精度が悪い」
 *     「背景が隠れないくるくる回転するアニメーション」
 *   → the full-screen overlay with backdrop-blur was hiding the page
 *   underneath, which the user wants visible.
 *
 * v3 (this version): corner-floating SVG ring, no backdrop, no overlay.
 *   - Position: top-right (mirrors RouteProgress) so the eye trains a single
 *     "loading is happening" zone whether it's first load or route change.
 *   - SVG stroke with rounded line-cap → no border-top rasterization
 *     artefacts, smooth at every DPR.
 *   - 36-degree gap (i.e. 90% stroke arc) feels more luxurious than the
 *     50/50 split, and the animation reads as "rotation" rather than
 *     "alternating arc" since the gap is small.
 *   - cubic-bezier(0.65, 0, 0.35, 1) easing — barely perceptible vs linear
 *     but adds a hair of "weight" at each rotation cycle, which is the
 *     "kura craft" feel Aesop / Le Labo use in their micro-animations.
 *   - Auto-dismisses after 600ms (covers slow-3G hydration but feels instant
 *     on fast networks).
 *   - prefers-reduced-motion → mounts then immediately unmounts (no spin).
 */
export default function LuxuryLoader() {
  const [gone, setGone] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduced) {
      setGone(true);
      return;
    }

    // Two-stage dismiss: at 600ms start fading, at 800ms unmount. The fade
    // window is what makes it feel like the page "settles in" rather than
    // the spinner snapping out. Easing matches RouteProgress for consistency.
    const fadeTimer = window.setTimeout(() => setFading(true), 600);
    const unmountTimer = window.setTimeout(() => setGone(true), 800);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(unmountTimer);
    };
  }, []);

  if (gone) return null;

  return (
    <div
      aria-hidden
      role="presentation"
      // Corner-floating, no backdrop. Page content remains fully visible
      // through the loader — user can scroll, tap, read while it's still
      // resolving. pointer-events:none so it never intercepts clicks.
      className="fixed top-4 right-4 md:top-5 md:right-5 z-[200] pointer-events-none"
      style={{
        opacity: fading ? 0 : 1,
        transform: fading ? "scale(0.85)" : "scale(1)",
        transition:
          "opacity 220ms cubic-bezier(0.65, 0, 0.35, 1), transform 220ms cubic-bezier(0.65, 0, 0.35, 1)",
      }}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 22 22"
        fill="none"
        className="luxury-kuru md:w-6 md:h-6"
        aria-hidden
      >
        {/* Faint track — keeps the ring shape readable on light backgrounds
            without competing with the page chrome. */}
        <circle
          cx="11"
          cy="11"
          r="9"
          stroke="rgba(33, 35, 29, 0.10)"
          strokeWidth="2"
          fill="none"
        />
        {/* Active arc — 90% of circumference (gap of 36°) keeps it reading
            as a continuous rotation. dasharray uses the circumference of a
            r=9 circle: 2π × 9 ≈ 56.55. 51 / 56.55 = ~90% arc. */}
        <circle
          cx="11"
          cy="11"
          r="9"
          stroke="#21231d"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="51 56.55"
          fill="none"
          transform="rotate(-90 11 11)"
        />
      </svg>
      <style jsx>{`
        @keyframes luxury-kuru-spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .luxury-kuru {
          animation: luxury-kuru-spin 900ms cubic-bezier(0.65, 0, 0.35, 1) infinite;
          transform-origin: center;
        }
        @media (prefers-reduced-motion: reduce) {
          .luxury-kuru {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
