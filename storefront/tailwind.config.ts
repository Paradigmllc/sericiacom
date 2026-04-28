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
          // RGB-channel pattern — required for Tailwind opacity modifiers
          // (e.g., `text-sericia-paper/80`) to work with CSS-variable colors.
          // CSS vars are defined in globals.css as `R G B` triplets (no
          // commas, no `rgb()` wrapper); Tailwind's JIT inlines the alpha.
          // Without this pattern, `/80` silently falls back to the default
          // text color, producing WCAG-fail eyebrow-on-dark-hero situations.
          paper: "rgb(var(--sericia-paper) / <alpha-value>)",
          "paper-deep": "rgb(var(--sericia-paper-deep) / <alpha-value>)",
          "paper-card": "rgb(var(--sericia-paper-card) / <alpha-value>)",
          ink: "rgb(var(--sericia-ink) / <alpha-value>)",
          "ink-soft": "rgb(var(--sericia-ink-soft) / <alpha-value>)",
          "ink-mute": "rgb(var(--sericia-ink-mute) / <alpha-value>)",
          line: "rgb(var(--sericia-line) / <alpha-value>)",
          accent: "rgb(var(--sericia-accent) / <alpha-value>)",
          // Wishlist / "loved" state. Aged crimson — warm but restrained,
          // harmonizes with earth-tone brand palette. Used by AnimatedHeart.
          heart: "rgb(var(--sericia-heart) / <alpha-value>)",
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
