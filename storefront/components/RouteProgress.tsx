"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Aesop/LV-style 2px progress bar at the top of the viewport.
 * Triggers on pathname/searchparams change. Auto-hides after completion.
 * Uses CSS transitions only — no Framer Motion needed for this hairline.
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

  return (
    <div
      aria-hidden
      className="fixed left-0 right-0 top-0 z-[100] pointer-events-none"
      style={{ height: 2 }}
    >
      <div
        className="h-full bg-sericia-ink origin-left"
        style={{
          width: `${progress}%`,
          opacity: visible ? (state === "done" ? 0 : 1) : 0,
          transition:
            state === "done"
              ? "width 120ms linear, opacity 300ms ease 80ms"
              : "width 160ms ease-out, opacity 160ms ease",
        }}
      />
    </div>
  );
}
