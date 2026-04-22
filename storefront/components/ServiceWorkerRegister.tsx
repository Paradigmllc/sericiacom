"use client";

import { useEffect } from "react";

/**
 * Registers /sw.js in production only.
 *
 * Why production-only: `next dev` serves non-hashed asset URLs that change
 * on every file save. A service worker caching those would pin stale HTML /
 * JS across edits and produce confusing "why aren't my changes showing"
 * loops. Production builds ship immutable hashed URLs in /_next/static/*
 * where aggressive caching is safe.
 *
 * Why no UI / no toast on failure: SW registration is a background concern.
 * An end user has no action to take if it fails; surfacing an error would
 * only erode trust. A failed register just means the site works as a normal
 * web app (no offline fallback, no push) — graceful degradation.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    let detach: (() => void) | undefined;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          // updateViaCache: "none" makes the browser revalidate sw.js itself
          // on every registration call instead of holding a 24h HTTP cache.
          // Without this, a bug-fix SW release can take up to a day to reach
          // returning users — the HTTP cache of /sw.js pins the old file.
          updateViaCache: "none",
        });

        // Nudge the browser to check for an updated sw.js whenever the user
        // returns focus to the tab. Cheap — just a conditional request against
        // the server — and ensures SW updates land within minutes of deploy
        // rather than hours.
        const onFocus = () => { reg.update().catch(() => {}); };
        window.addEventListener("focus", onFocus);
        detach = () => window.removeEventListener("focus", onFocus);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("[sw] registration failed", e);
      }
    };

    register();
    return () => { detach?.(); };
  }, []);

  return null;
}
