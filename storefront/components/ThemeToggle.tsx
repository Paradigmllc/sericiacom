"use client";

/**
 * ThemeToggle — three-state cycle button: auto → light → dark → auto.
 *
 * Shows the current intent's icon (sun / moon / circle-half) so users see
 * "where they are" rather than "what they'll get next". Aria-label always
 * announces the next state, which matches WCAG 2.2 AA expectations for
 * cyclical toggles.
 *
 * Why no separate sun/moon two-state button: brand identity stays cleaner
 * with one button. Aesop and Le Labo also avoid two-button theme rows.
 */

import { useEffect, useState } from "react";
import { useTheme } from "@/lib/theme-store";

function SunIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
    </svg>
  );
}

function MoonIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />
    </svg>
  );
}

function AutoIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function ThemeToggle() {
  const intent = useTheme((s) => s.intent);
  const cycle = useTheme((s) => s.cycle);
  const [mounted, setMounted] = useState(false);
  // Avoid hydration mismatch — the persisted store is hydrated client-side,
  // and the SSR render assumes `auto`. Mount-gate the icon swap.
  useEffect(() => setMounted(true), []);

  const icon = !mounted ? (
    <AutoIcon className="h-5 w-5" />
  ) : intent === "light" ? (
    <SunIcon className="h-5 w-5" />
  ) : intent === "dark" ? (
    <MoonIcon className="h-5 w-5" />
  ) : (
    <AutoIcon className="h-5 w-5" />
  );

  const next =
    !mounted || intent === "auto" ? "light" : intent === "light" ? "dark" : "auto";
  const label = `Theme: ${mounted ? intent : "auto"}. Press to switch to ${next}.`;

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={label}
      title={label}
      data-cursor="link"
      className="p-1.5 hover:text-sericia-ink transition-colors"
    >
      {icon}
    </button>
  );
}
