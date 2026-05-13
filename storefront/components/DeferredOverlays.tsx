"use client";

/**
 * DeferredOverlays — idle-mounts non-critical client components after first
 * paint so they don't compete with hero-section hydration for main-thread time.
 *
 * Rationale (F69): the storefront root layout mounts 14 client components
 * eagerly, of which 4 are NOT needed during first interactive (Dify chat,
 * PostHog analytics, cookie consent banner, social proof toasts). Each one
 * brings its own JS bundle that the browser parses + executes during the
 * 0–1s window when the user is reading the hero. Idle-mounting them shifts
 * 50–150kB of JS work to after first-paint, improving TTI by 500–1500ms on
 * mid-range mobile.
 *
 * Mount strategy:
 *   1. Wait for `requestIdleCallback` (or 2s timeout fallback for Safari)
 *   2. Render the four heavy children via React `lazy()` so their bundles are
 *      code-split separately (Next.js auto-splits `next/dynamic` imports).
 *
 * Why all four behind one gate (vs separate `next/dynamic` calls in layout):
 *   - Single round-trip for the idle-callback signal
 *   - Single Suspense boundary keeps the layout JSX clean
 *   - Easy to disable in bulk if any one of them regresses
 *
 * NOTE on Sonner toaster: NOT in this list — toast notifications must be
 * available the moment a server action fires (e.g. WaitlistForm error on
 * first submit). Sonner stays eagerly mounted in the layout.
 */

import { lazy, Suspense, useEffect, useState } from "react";

// Lazy imports — each one becomes its own chunk in the Next.js build.
const DifyChat = lazy(() => import("@/components/DifyChat"));
const Analytics = lazy(() => import("@/components/Analytics"));
const CookieConsent = lazy(() => import("@/components/CookieConsent"));
const SocialProofToastGate = lazy(
  () => import("@/components/SocialProofToastGate"),
);
const ServiceWorkerRegister = lazy(
  () => import("@/components/ServiceWorkerRegister"),
);

/** Cross-browser idle scheduler. Falls back to setTimeout on Safari/iOS. */
function scheduleIdle(cb: () => void, timeoutMs = 2000): () => void {
  type RIC = (
    cb: IdleRequestCallback,
    opts?: { timeout: number },
  ) => number;
  const ric = (window as unknown as { requestIdleCallback?: RIC })
    .requestIdleCallback;
  if (typeof ric === "function") {
    const id = ric(() => cb(), { timeout: timeoutMs });
    return () => {
      const cancel = (window as unknown as {
        cancelIdleCallback?: (id: number) => void;
      }).cancelIdleCallback;
      cancel?.(id);
    };
  }
  const id = window.setTimeout(cb, timeoutMs);
  return () => window.clearTimeout(id);
}

export default function DeferredOverlays() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Wait for the next idle moment OR 2s — whichever comes first.
    // Mobile Safari has no rIC; the timeout is its sole path.
    const cancel = scheduleIdle(() => setReady(true), 2000);
    return cancel;
  }, []);

  if (!ready) return null;

  return (
    <Suspense fallback={null}>
      <Analytics />
      <CookieConsent />
      <SocialProofToastGate />
      <ServiceWorkerRegister />
      <DifyChat />
    </Suspense>
  );
}
