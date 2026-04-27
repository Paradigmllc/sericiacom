"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Theme store — light / dark / auto.
 *
 * `auto` resolves at runtime via `prefers-color-scheme`. We store the user's
 * intent (so they can switch back to "follow OS" without losing the choice)
 * and the ThemeProvider derives the effective theme from it.
 *
 * Why three states (not just light/dark): respecting OS preference is the
 * a11y default — users who set their OS to dark expect every site to follow.
 * But once they explicitly toggle, we lock to that choice across sessions.
 */

export type ThemeIntent = "light" | "dark" | "auto";

type ThemeState = {
  intent: ThemeIntent;
  setIntent: (i: ThemeIntent) => void;
  cycle: () => void;
};

const ORDER: ThemeIntent[] = ["auto", "light", "dark"];

export const useTheme = create<ThemeState>()(
  persist(
    (set, get) => ({
      intent: "auto",
      setIntent: (i) => set({ intent: i }),
      // One-tap cycle: auto → light → dark → auto. Used by header button.
      cycle: () => {
        const cur = get().intent;
        const next = ORDER[(ORDER.indexOf(cur) + 1) % ORDER.length];
        set({ intent: next });
      },
    }),
    {
      name: "sericia-theme",
      // We only persist `intent` — the resolved (light|dark) value is
      // computed every time so it stays in sync with the OS in `auto`.
      partialize: (s) => ({ intent: s.intent }),
    },
  ),
);

/** Resolve effective theme from intent + system prefers-color-scheme. */
export function resolveTheme(intent: ThemeIntent): "light" | "dark" {
  if (intent === "light" || intent === "dark") return intent;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}
