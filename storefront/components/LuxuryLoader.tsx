"use client";
import { useEffect, useState } from "react";

/**
 * くるくる開店 (kuru-kuru kaiten) — full-screen Japanese-luxury
 * "shop opening" overlay shown on every initial HTML render.
 *
 * Sequence:
 *   0-900ms   : 鮮 hanko seal spins 720° + settles (the "kuru-kuru")
 *   400-1200ms: SERICIA wordmark fades in, letter-spacing contracts
 *   700-1400ms: hairline rule draws from left
 *   1000-1500ms: tagline fades in
 *   1200-1900ms: noren curtain (paper-cream panels) parts down the
 *                center seam and slides out to both edges (the "kaiten")
 *
 * - No sessionStorage gate — every fresh page load greets the visitor
 *   like stepping through a shop's noren. Client-side navigations use
 *   the lighter mini-seal in RouteProgress instead (see RouteProgress.tsx).
 * - Respects prefers-reduced-motion (skips entirely).
 * - Pure CSS keyframes, no framer-motion dependency.
 */
export default function LuxuryLoader() {
  const [phase, setPhase] = useState<"enter" | "open" | "gone">("enter");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduced) {
      setPhase("gone");
      return;
    }

    // Open the noren curtains after the hanko + wordmark settle
    const openAt = 1200;
    // Remove from DOM once panels finish pulling apart
    const goneAt = 1900;

    const t1 = window.setTimeout(() => setPhase("open"), openAt);
    const t2 = window.setTimeout(() => setPhase("gone"), goneAt);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  if (phase === "gone") return null;

  const opening = phase === "open";

  return (
    <div
      aria-hidden
      role="presentation"
      className="fixed inset-0 z-[200]"
      style={{ pointerEvents: opening ? "none" : "auto" }}
    >
      {/* Left noren panel */}
      <div
        className="absolute inset-y-0 left-0 w-1/2 bg-[#f5f1e8] overflow-hidden"
        style={{
          transform: opening ? "translateX(-100%)" : "translateX(0)",
          transition: "transform 700ms cubic-bezier(0.65, 0, 0.35, 1)",
        }}
      >
        {/* Silk-fibre strokes — same motif as the brand placeholders */}
        <svg
          aria-hidden
          className="absolute inset-0 w-full h-full opacity-20"
          viewBox="0 0 600 800"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="silkL" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#8b8b85" stopOpacity="0" />
              <stop offset="50%" stopColor="#8b8b85" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#8b8b85" stopOpacity="0" />
            </linearGradient>
          </defs>
          {Array.from({ length: 12 }).map((_, i) => (
            <path
              key={i}
              d={`M -50 ${60 + i * 60} Q 200 ${40 + i * 58}, 400 ${70 + i * 62} T 700 ${55 + i * 60}`}
              stroke="url(#silkL)"
              strokeWidth="0.5"
              fill="none"
            />
          ))}
        </svg>
        {/* Center seam — the shoji hairline */}
        <div className="absolute right-0 top-0 bottom-0 w-px bg-[#21231d] opacity-[0.08]" />
      </div>

      {/* Right noren panel */}
      <div
        className="absolute inset-y-0 right-0 w-1/2 bg-[#f5f1e8] overflow-hidden"
        style={{
          transform: opening ? "translateX(100%)" : "translateX(0)",
          transition: "transform 700ms cubic-bezier(0.65, 0, 0.35, 1)",
        }}
      >
        <svg
          aria-hidden
          className="absolute inset-0 w-full h-full opacity-20"
          viewBox="0 0 600 800"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="silkR" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#8b8b85" stopOpacity="0" />
              <stop offset="50%" stopColor="#8b8b85" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#8b8b85" stopOpacity="0" />
            </linearGradient>
          </defs>
          {Array.from({ length: 12 }).map((_, i) => (
            <path
              key={i}
              d={`M -100 ${60 + i * 60} Q 100 ${40 + i * 58}, 300 ${70 + i * 62} T 600 ${55 + i * 60}`}
              stroke="url(#silkR)"
              strokeWidth="0.5"
              fill="none"
            />
          ))}
        </svg>
        <div className="absolute left-0 top-0 bottom-0 w-px bg-[#21231d] opacity-[0.08]" />
      </div>

      {/* Centerpiece — hanko seal + wordmark. Sits above both panels,
          fades out just before the curtain parts so it doesn't get split. */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        style={{
          opacity: opening ? 0 : 1,
          transition: "opacity 350ms ease",
        }}
      >
        {/* くるくる rotating 鮮 hanko seal — matches /logo-mark.svg */}
        <div className="seal-kuru">
          <svg
            viewBox="0 0 80 80"
            className="w-[84px] h-[84px] md:w-[104px] md:h-[104px]"
            aria-hidden
          >
            <circle cx="40" cy="40" r="36" fill="#b84a3e" />
            <circle cx="40" cy="40" r="32" fill="none" stroke="#f5efe6" strokeWidth="0.8" />
            <text
              x="40"
              y="53"
              textAnchor="middle"
              fontFamily="'Noto Serif JP', 'Yu Mincho', serif"
              fontWeight={700}
              fontSize="38"
              fill="#f5efe6"
            >
              鮮
            </text>
          </svg>
        </div>

        <div
          className="luxury-wordmark mt-8 text-[22px] md:text-[28px] tracking-[0.5em] text-[#1a1a1a] uppercase select-none"
          style={{
            fontFamily:
              "var(--font-noto-sans), ui-sans-serif, system-ui, -apple-system, 'Helvetica Neue', sans-serif",
            fontWeight: 300,
          }}
        >
          Sericia
        </div>
        <div className="luxury-rule mt-5 h-px bg-[#1a1a1a] origin-left" />
        <div className="luxury-tag mt-5 text-[10px] tracking-[0.4em] uppercase text-[#8b8b85]">
          Rescued Japanese craft food
        </div>
      </div>

      <style jsx>{`
        @keyframes seal-kuru-in {
          0% {
            opacity: 0;
            transform: rotate(-720deg) scale(0.2);
          }
          60% {
            opacity: 1;
          }
          85% {
            transform: rotate(18deg) scale(1.04);
          }
          100% {
            opacity: 1;
            transform: rotate(0deg) scale(1);
          }
        }
        @keyframes wordmark-in {
          0% {
            opacity: 0;
            letter-spacing: 0.7em;
          }
          100% {
            opacity: 1;
            letter-spacing: 0.5em;
          }
        }
        @keyframes rule-draw {
          0% {
            transform: scaleX(0);
            opacity: 0;
          }
          60% {
            opacity: 0.9;
          }
          100% {
            transform: scaleX(1);
            opacity: 0.9;
          }
        }
        @keyframes tag-in {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
        .seal-kuru {
          animation: seal-kuru-in 900ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }
        .luxury-wordmark {
          animation: wordmark-in 800ms ease-out 400ms both;
        }
        .luxury-rule {
          width: 120px;
          animation: rule-draw 700ms ease-out 700ms both;
        }
        .luxury-tag {
          animation: tag-in 500ms ease 1000ms both;
        }
      `}</style>
    </div>
  );
}
