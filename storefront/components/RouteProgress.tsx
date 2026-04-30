"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Route-change indicator — click-driven (F37 fix).
 *
 *   1. Aesop/LV-style 2px hairline progress bar at the top of the viewport.
 *   2. A minimal くるくる ring spinner in the top-right corner while the
 *      new route resolves.
 *
 * Why this rewrite (F37):
 *   The previous implementation (F34/M4c-9) fired its progress timer in
 *   `useEffect([pathname])`, which runs AFTER the new route's RSC payload
 *   has already resolved and committed — i.e. progress was shown *post*
 *   navigation, not during. Combined with a 380ms hard timeout that ended
 *   the bar regardless of actual completion, visitors on a 5-second
 *   server-rendered navigation saw zero feedback for the first 4.6 seconds
 *   and then a phantom progress bar after the page had already swapped.
 *
 * The fix reads navigation START via document-level click delegation
 * (any `<a href="…">` to an internal path triggers the start) and END via
 * pathname/searchParams change. The progress bar creeps to 85% during the
 * wait and snaps to 100% on commit. This pairs with the new
 * `app/(frontend)/loading.tsx` Suspense fallback to give visitors *two*
 * layers of immediate feedback during slow server renders.
 *
 * Per user directive 2026-04-22「この漢字ロゴは絶対✖削除して」the prior
 * 鮮 hanko mini-seal was removed and replaced with a bare ring spinner —
 * matching LuxuryLoader's stripped-down treatment.
 */
export default function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [state, setState] = useState<"idle" | "running" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Detect navigation START via click delegation ─────────────────────
  useEffect(() => {
    const isInternalLinkNav = (e: MouseEvent): boolean => {
      // Honour modifier-clicks (cmd/ctrl/shift/alt = open in new tab/window)
      // and middle-clicks — those don't trigger SPA navigation.
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
      if (e.button !== 0) return false;
      const a = (e.target as HTMLElement | null)?.closest?.("a[href]") as
        | HTMLAnchorElement
        | null;
      if (!a) return false;
      // target=_blank → opens externally, no SPA nav
      if (a.target === "_blank") return false;
      // download attribute → file download, no nav
      if (a.hasAttribute("download")) return false;
      const href = a.getAttribute("href") ?? "";
      // Skip pure hash jumps within the same page (no SPA route change)
      if (href.startsWith("#")) return false;
      // Skip mailto:/tel:/etc.
      if (/^[a-z]+:/i.test(href) && !href.startsWith("/")) {
        try {
          const u = new URL(a.href, window.location.href);
          if (u.origin !== window.location.origin) return false;
        } catch {
          return false;
        }
      }
      return true;
    };

    const onClick = (e: MouseEvent) => {
      if (!isInternalLinkNav(e)) return;
      startProgress();
    };

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Detect navigation END via pathname / searchParams commit ─────────
  useEffect(() => {
    // Skip the initial mount — we only react to subsequent route commits.
    if (state !== "running") return;
    finishProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams?.toString()]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      if (fadeRef.current) clearTimeout(fadeRef.current);
      if (safetyRef.current) clearTimeout(safetyRef.current);
    };
  }, []);

  function startProgress() {
    if (tickRef.current) clearInterval(tickRef.current);
    if (fadeRef.current) clearTimeout(fadeRef.current);
    if (safetyRef.current) clearTimeout(safetyRef.current);

    setState("running");
    setProgress(8);

    // Slow asymptotic creep towards 85% — never claims completion until
    // the actual route commit fires. Step shrinks as we approach the cap
    // so the bar feels like it's settling rather than racing.
    tickRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 85) return p;
        const remaining = 85 - p;
        const step = Math.max(0.4, remaining * 0.06);
        return Math.min(85, p + step);
      });
    }, 140);

    // Safety net — if pathname never changes (e.g. user clicked a link
    // back to the current route, or navigation was cancelled), don't
    // leave the progress bar stuck. After 12s force-finish.
    safetyRef.current = setTimeout(() => {
      finishProgress();
    }, 12_000);
  }

  function finishProgress() {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (safetyRef.current) {
      clearTimeout(safetyRef.current);
      safetyRef.current = null;
    }
    setProgress(100);
    setState("done");
    fadeRef.current = setTimeout(() => {
      setState("idle");
      setProgress(0);
    }, 280);
  }

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

      {/* くるくる ring spinner — centered (F42: was top-right corner).
          Per user directive 2026-04-30「ローディングアニメーションの
          くるくるが右上ではなく画面中央で全ページ統一」— always render
          at the centre of the viewport, matching LuxuryLoader's first-
          paint position so visitors see one consistent loading idiom
          across cold-paint, route-change, and slow-data states. */}
      <div
        aria-hidden
        className="fixed inset-0 z-[99] pointer-events-none flex items-center justify-center"
        style={{
          opacity: visible ? (fading ? 0 : 1) : 0,
          transform: visible ? "scale(1)" : "scale(0.85)",
          transition: fading
            ? "opacity 260ms ease 80ms, transform 260ms ease"
            : "opacity 180ms ease, transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
      >
        <div
          className={`w-8 h-8 md:w-10 md:h-10 rounded-full ${
            visible && !fading ? "route-kuru-loop" : ""
          }`}
          style={{
            border: "2px solid rgba(33, 35, 29, 0.14)",
            borderTopColor: "#21231d",
          }}
        />

        <style jsx>{`
          @keyframes route-kuru-spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
          .route-kuru-loop {
            animation: route-kuru-spin 750ms linear infinite;
          }
          @media (prefers-reduced-motion: reduce) {
            .route-kuru-loop {
              animation: none;
            }
          }
        `}</style>
      </div>
    </>
  );
}
