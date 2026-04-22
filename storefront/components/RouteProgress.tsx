"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Two-layer route-change indicator that keeps the "くるくる開店"
 * shop-opening motif alive across every in-app navigation:
 *
 *   1. Aesop/LV-style 2px hairline progress bar at the top of the
 *      viewport (carries over from the original implementation).
 *   2. A miniature 鮮 hanko seal in the top-right corner that spins
 *      continuously while the new route resolves — matching the full
 *      LuxuryLoader's ceremony in lighter-weight form.
 *
 * Triggers on pathname / searchParams change. Auto-hides after the new
 * render commits. Pure CSS transitions — no framer-motion needed.
 */
export default function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [state, setState] = useState<"idle" | "running" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const timers = useRef<{ tick?: ReturnType<typeof setInterval>; done?: ReturnType<typeof setTimeout> }>({});
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    // Reset any existing timers
    if (timers.current.tick) clearInterval(timers.current.tick);
    if (timers.current.done) clearTimeout(timers.current.done);

    setState("running");
    setProgress(10);

    timers.current.tick = setInterval(() => {
      setProgress((p) => {
        if (p >= 85) return p;
        const step = (85 - p) * 0.08;
        return Math.min(85, p + step + 0.5);
      });
    }, 120);

    // Nominal "done" — new render committed.
    timers.current.done = setTimeout(() => {
      if (timers.current.tick) clearInterval(timers.current.tick);
      setProgress(100);
      setState("done");
      setTimeout(() => {
        setState("idle");
        setProgress(0);
      }, 250);
    }, 380);

    return () => {
      if (timers.current.tick) clearInterval(timers.current.tick);
      if (timers.current.done) clearTimeout(timers.current.done);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams?.toString()]);

  const visible = state !== "idle";
  const fading = state === "done";

  return (
    <>
      {/* Top hairline progress bar */}
      <div
        aria-hidden
        className="fixed left-0 right-0 top-0 z-[100] pointer-events-none"
        style={{ height: 2 }}
      >
        <div
          className="h-full bg-sericia-ink origin-left"
          style={{
            width: `${progress}%`,
            opacity: visible ? (fading ? 0 : 1) : 0,
            transition: fading
              ? "width 120ms linear, opacity 300ms ease 80ms"
              : "width 160ms ease-out, opacity 160ms ease",
          }}
        />
      </div>

      {/* くるくる mini hanko — spins while the new route resolves */}
      <div
        aria-hidden
        className="fixed top-4 right-4 md:top-5 md:right-5 z-[99] pointer-events-none"
        style={{
          opacity: visible ? (fading ? 0 : 1) : 0,
          transform: visible ? "scale(1)" : "scale(0.85)",
          transition: fading
            ? "opacity 260ms ease 80ms, transform 260ms ease"
            : "opacity 180ms ease, transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
      >
        <svg
          viewBox="0 0 80 80"
          className={`w-8 h-8 md:w-9 md:h-9 drop-shadow-sm ${visible && !fading ? "seal-kuru-loop" : ""}`}
        >
          <circle cx="40" cy="40" r="36" fill="#b84a3e" />
          <circle cx="40" cy="40" r="32" fill="none" stroke="#f5efe6" strokeWidth="1" />
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

        <style jsx>{`
          @keyframes kuru-loop {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
          .seal-kuru-loop {
            animation: kuru-loop 900ms linear infinite;
            transform-origin: 50% 50%;
          }
          @media (prefers-reduced-motion: reduce) {
            .seal-kuru-loop {
              animation: none;
            }
          }
        `}</style>
      </div>
    </>
  );
}
