"use client";

/**
 * ThemeProvider — applies `data-theme` to <html> based on the persisted
 * intent (auto / light / dark). Works with the no-flash inline script
 * declared by `<NoFlashThemeScript />` in the layout: that script runs
 * BEFORE React hydrates and sets the correct `data-theme` so we never
 * paint a light page then snap to dark.
 *
 * Listens for OS theme changes when intent === "auto" so the live preview
 * follows OS settings without a refresh.
 */

import { useEffect } from "react";
import { resolveTheme, useTheme } from "@/lib/theme-store";

export default function ThemeProvider() {
  const intent = useTheme((s) => s.intent);

  // Apply chosen theme on mount + every time intent changes
  useEffect(() => {
    const apply = () => {
      const eff = resolveTheme(intent);
      document.documentElement.setAttribute("data-theme", eff);
    };
    apply();

    // If user picked "auto", track OS-level changes live
    if (intent !== "auto") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => apply();
    // Modern browsers
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, [intent]);

  return null;
}

/**
 * NoFlashThemeScript — must be rendered as a `<script>` inside `<head>`
 * BEFORE the React tree. Reads localStorage["sericia-theme"] and applies
 * the right `data-theme` synchronously. Without this, the page paints
 * once in light, then React hydrates and snaps to dark on first
 * useEffect — visible flash that breaks the brand.
 *
 * Storage shape mirrors zustand/middleware persist: `{ state: { intent }, version }`.
 */
export function NoFlashThemeScript() {
  const code = `(function(){try{var raw=localStorage.getItem('sericia-theme');var intent='auto';if(raw){try{var parsed=JSON.parse(raw);intent=(parsed&&parsed.state&&parsed.state.intent)||'auto'}catch(e){}}var eff=intent;if(intent==='auto'){eff=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.setAttribute('data-theme',eff)}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
