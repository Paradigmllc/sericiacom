import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sericia: {
          paper: "#f5f0e8",
          "paper-deep": "#ebe4d4",
          "paper-card": "#faf6ee",
          ink: "#21231d",
          "ink-soft": "#4a4c44",
          "ink-mute": "#7b7d73",
          line: "#d4cfc4",
          accent: "#5c5d45",
          // Wishlist / "loved" state. Aged crimson — warm but restrained,
          // harmonizes with earth-tone brand palette. Used by AnimatedHeart.
          heart: "#BF3649",
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
