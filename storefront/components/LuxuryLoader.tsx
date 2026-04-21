"use client";
import { useEffect, useState } from "react";

/**
 * Full-screen luxury loading overlay shown once per browser session.
 * SERICIA wordmark fades in over a paper-cream backdrop, a hairline
 * is drawn under it, then everything fades out to reveal the page.
 *
 * - Uses sessionStorage so returning pages within the same tab skip it.
 * - No external dependencies — CSS keyframes only.
 * - Respects prefers-reduced-motion.
 */
export default function LuxuryLoader() {
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<"enter" | "exit" | "gone">("enter");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const seen = sessionStorage.getItem("sericia_loader_seen");

    if (seen || reduced) {
      setPhase("gone");
      return;
    }

    setVisible(true);
    sessionStorage.setItem("sericia_loader_seen", "1");

    const exitAt = 1400;
    const goneAt = 1900;

    const t1 = window.setTimeout(() => setPhase("exit"), exitAt);
    const t2 = window.setTimeout(() => {
      setPhase("gone");
      setVisible(false);
    }, goneAt);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      aria-hidden
      role="presentation"
      className={`fixed inset-0 z-[200] flex items-center justify-center bg-[#f5f1e8] transition-opacity duration-500 ${
        phase === "exit" ? "opacity-0" : "opacity-100"
      } ${visible ? "" : "pointer-events-none"}`}
      style={{ pointerEvents: phase === "exit" ? "none" : "auto" }}
    >
      {/* Thread / silk-fibre backdrop */}
      <svg
        aria-hidden
        className="absolute inset-0 w-full h-full opacity-20"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="silk" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8b8b85" stopOpacity="0" />
            <stop offset="50%" stopColor="#8b8b85" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#8b8b85" stopOpacity="0" />
          </linearGradient>
        </defs>
        {Array.from({ length: 12 }).map((_, i) => (
          <path
            key={i}
            d={`M -100 ${60 + i * 60} Q 400 ${40 + i * 58}, 800 ${70 + i * 62} T 1400 ${55 + i * 60}`}
            stroke="url(#silk)"
            strokeWidth="0.5"
            fill="none"
          />
        ))}
      </svg>

      {/* Wordmark */}
      <div className="relative flex flex-col items-center">
        <div
          className="luxury-wordmark text-[22px] md:text-[28px] tracking-[0.5em] text-[#1a1a1a] uppercase select-none"
          style={{
            fontFamily:
              "var(--font-noto-sans), ui-sans-serif, system-ui, -apple-system, 'Helvetica Neue', sans-serif",
            fontWeight: 300,
          }}
        >
          Sericia
        </div>
        <div className="luxury-rule mt-6 h-px bg-[#1a1a1a] origin-left" />
        <div
          className="mt-6 text-[10px] tracking-[0.4em] uppercase text-[#8b8b85]"
          style={{ opacity: phase === "exit" ? 0 : 1, transition: "opacity 300ms ease" }}
        >
          Rescued Japanese craft food
        </div>
      </div>

      <style jsx>{`
        @keyframes wordmark-in {
          0% { opacity: 0; letter-spacing: 0.7em; }
          100% { opacity: 1; letter-spacing: 0.5em; }
        }
        @keyframes rule-draw {
          0% { transform: scaleX(0); opacity: 0; }
          60% { opacity: 0.9; }
          100% { transform: scaleX(1); opacity: 0.9; }
        }
        .luxury-wordmark {
          animation: wordmark-in 900ms ease-out both;
        }
        .luxury-rule {
          width: 120px;
          animation: rule-draw 900ms ease-out 250ms both;
        }
      `}</style>
    </div>
  );
}
