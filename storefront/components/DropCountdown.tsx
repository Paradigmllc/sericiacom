"use client";

/**
 * DropCountdown — Aesop-style editorial countdown to drop close.
 *
 * Design principles:
 *   • Numbers in tabular-nums so the glyphs don't jitter as they tick
 *   • Labels in uppercase tracked spacing (brand grammar)
 *   • Hairline rule divider above, matches Rule / Eyebrow pattern
 *   • When `closesAt` is null → render nothing (null-safe for future evergreen drops)
 *   • When the drop has already closed → swap to a "Closed" state so the UI never lies
 *
 * Accuracy notes:
 *   • Uses native setInterval(1000). For a 48-hour drop window, client clock drift
 *     of ±1s is acceptable — we trust `closes_at` as the server-supplied truth and
 *     compute remaining time from `Date.now()` each tick.
 *   • Only one countdown should be mounted per page (above the fold). The setInterval
 *     cost is trivial, but we don't want N countdowns fighting each other visually.
 *
 * A11y:
 *   • `role="timer"` + `aria-live="off"` — we don't want screen readers announcing
 *     every second. The numbers are still visually readable; assistive tech users
 *     get the closes_at timestamp via the fallback sr-only date string.
 */
import { useEffect, useState } from "react";

type Props = {
  closesAt: string | null;
  /** Optional prefix label, defaults to "Drop closes in" */
  label?: string;
  /** Visual variant */
  variant?: "default" | "compact";
  className?: string;
};

type Remaining = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isClosed: boolean;
};

function computeRemaining(targetMs: number): Remaining {
  const now = Date.now();
  const diff = targetMs - now;
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isClosed: true };
  }
  const seconds = Math.floor(diff / 1000) % 60;
  const minutes = Math.floor(diff / (1000 * 60)) % 60;
  const hours = Math.floor(diff / (1000 * 60 * 60)) % 24;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return { days, hours, minutes, seconds, isClosed: false };
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

export default function DropCountdown({
  closesAt,
  label = "Drop closes in",
  variant = "default",
  className = "",
}: Props) {
  const targetMs = closesAt ? new Date(closesAt).getTime() : null;
  const validTarget = targetMs !== null && !Number.isNaN(targetMs);

  // Initial state must match SSR (we can't call Date.now during SSR and trust it)
  // so we start at null and populate after mount. This avoids hydration mismatch.
  const [remaining, setRemaining] = useState<Remaining | null>(null);

  useEffect(() => {
    if (!validTarget || targetMs === null) return;
    setRemaining(computeRemaining(targetMs));
    const id = window.setInterval(() => {
      setRemaining(computeRemaining(targetMs));
    }, 1000);
    return () => window.clearInterval(id);
  }, [targetMs, validTarget]);

  // No valid deadline → render nothing (keeps layout stable for evergreen products)
  if (!validTarget || targetMs === null) return null;

  // Pre-hydration placeholder — reserves vertical space so Cumulative Layout Shift stays at 0
  if (!remaining) {
    return (
      <div
        className={`flex flex-col items-center gap-2 ${className}`}
        aria-hidden="true"
      >
        <span className="text-[10px] tracking-[0.24em] uppercase text-sericia-ink-mute">
          {label}
        </span>
        <span className="text-[20px] md:text-[22px] text-sericia-ink-soft font-light tabular-nums">
          — : — : — : —
        </span>
      </div>
    );
  }

  if (remaining.isClosed) {
    return (
      <div
        role="status"
        className={`flex flex-col items-center gap-2 ${className}`}
      >
        <span className="text-[10px] tracking-[0.24em] uppercase text-sericia-ink-mute">
          Drop closed
        </span>
        <span className="text-[14px] md:text-[15px] tracking-[0.1em] uppercase text-sericia-ink-soft font-light">
          Waitlist for the next drop below
        </span>
      </div>
    );
  }

  const absoluteDate = new Date(targetMs).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  if (variant === "compact") {
    return (
      <div
        role="timer"
        aria-live="off"
        aria-label={`${label}: closes on ${absoluteDate}`}
        className={`inline-flex items-baseline gap-2 ${className}`}
      >
        <span className="text-[10px] tracking-[0.24em] uppercase text-sericia-ink-mute">
          {label}
        </span>
        <span className="text-[14px] text-sericia-ink font-light tabular-nums">
          {pad(remaining.days)}
          <span className="text-sericia-ink-mute">d</span>{" "}
          {pad(remaining.hours)}
          <span className="text-sericia-ink-mute">h</span>{" "}
          {pad(remaining.minutes)}
          <span className="text-sericia-ink-mute">m</span>{" "}
          {pad(remaining.seconds)}
          <span className="text-sericia-ink-mute">s</span>
        </span>
      </div>
    );
  }

  return (
    <div
      role="timer"
      aria-live="off"
      aria-label={`${label}: closes on ${absoluteDate}`}
      className={`flex flex-col items-center gap-3 ${className}`}
    >
      <span className="text-[10px] tracking-[0.24em] uppercase text-sericia-ink-mute">
        {label}
      </span>
      <div className="flex items-baseline gap-6 md:gap-8">
        <TimeUnit value={remaining.days} unit="days" />
        <Separator />
        <TimeUnit value={remaining.hours} unit="hours" />
        <Separator />
        <TimeUnit value={remaining.minutes} unit="minutes" />
        <Separator />
        <TimeUnit value={remaining.seconds} unit="seconds" />
      </div>
      <span className="sr-only">Closes on {absoluteDate}</span>
    </div>
  );
}

function TimeUnit({ value, unit }: { value: number; unit: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 min-w-[44px]">
      <span className="text-[28px] md:text-[36px] leading-none text-sericia-ink font-light tabular-nums">
        {pad(value)}
      </span>
      <span className="text-[9px] tracking-[0.24em] uppercase text-sericia-ink-mute">
        {unit}
      </span>
    </div>
  );
}

function Separator() {
  return (
    <span
      className="text-[20px] md:text-[24px] text-sericia-ink-mute/40 font-light leading-none self-start mt-1"
      aria-hidden="true"
    >
      :
    </span>
  );
}
