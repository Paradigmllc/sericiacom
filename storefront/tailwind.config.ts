import type { Config } from "tailwindcss";

/**
 * Sericia Tailwind config — token-driven via CSS variables.
 *
 * The `sericia.*` colour scale is exposed through `var(--sericia-*)`
 * declarations in app/(frontend)/globals.css. This means a single
 * <html data-theme="dark"> swap re-skins every existing class (`bg-
 * sericia-paper`, `text-sericia-ink-soft`, etc.) without touching any
 * component file. Light is the default; dark is opt-in via the toggle.
 *
 * `darkMode` is set to a custom selector strategy so that `dark:` variants
 * react to `[data-theme="dark"]` on the <html> element instead of OS
 * preference. We respect `prefers-color-scheme: dark` only when the user
 * picks "auto" mode in the toggle (handled by ThemeProvider).
 */
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        sericia: {
          paper: "var(--sericia-paper)",
          "paper-deep": "var(--sericia-paper-deep)",
          "paper-card": "var(--sericia-paper-card)",
          ink: "var(--sericia-ink)",
          "ink-soft": "var(--sericia-ink-soft)",
          "ink-mute": "var(--sericia-ink-mute)",
          line: "var(--sericia-line)",
          accent: "var(--sericia-accent)",
          // Wishlist / "loved" state. Aged crimson — warm but restrained,
          // harmonizes with earth-tone brand palette. Used by AnimatedHeart.
          heart: "var(--sericia-heart)",
        },
      },
      fontFamily: {
        sans: ['"Noto Sans"', '"Noto Sans JP"', "system-ui", "sans-serif"],
        serif: ['"Noto Sans"', '"Noto Sans JP"', "system-ui", "sans-serif"],
      },
      letterSpacing: {
        label: "0.18em",
        wider2: "0.22em",
      },
      maxWidth: {
        prose: "62ch",
      },
    },
  },
  plugins: [],
} satisfies Config;
