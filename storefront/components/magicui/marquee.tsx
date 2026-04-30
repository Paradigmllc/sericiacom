"use client";

import { cn } from "@/lib/cn";
import { ComponentPropsWithoutRef } from "react";

/**
 * Magic UI Marquee — horizontal scrolling strip.
 *
 * Adapted from magicui.design/r/marquee (MIT license). Adjusted for the
 * Sericia palette and motion guidelines:
 *   - Default speed: 35s (slower than the magicui default — premium tone)
 *   - prefers-reduced-motion: animation halts (per WCAG 2.2)
 *   - Edge fade: paper-tinted gradient mask both sides so the marquee
 *     blends into the surrounding canvas instead of looking like a
 *     scrolling bar.
 *
 * Usage:
 *   <Marquee pauseOnHover className="[--duration:30s]">
 *     {makers.map(m => <MakerCard maker={m} />)}
 *   </Marquee>
 */

interface MarqueeProps extends ComponentPropsWithoutRef<"div"> {
  className?: string;
  reverse?: boolean;
  pauseOnHover?: boolean;
  vertical?: boolean;
  /** Repetitions of children. Higher = smoother loop on wide viewports. */
  repeat?: number;
}

export function Marquee({
  className,
  reverse = false,
  pauseOnHover = false,
  children,
  vertical = false,
  repeat = 4,
  ...props
}: MarqueeProps) {
  return (
    <div
      {...props}
      className={cn(
        "group flex overflow-hidden p-2 [--duration:35s] [--gap:1rem] [gap:var(--gap)]",
        {
          "flex-row": !vertical,
          "flex-col": vertical,
        },
        className,
      )}
    >
      {Array(repeat)
        .fill(0)
        .map((_, i) => (
          <div
            key={i}
            className={cn(
              "flex shrink-0 justify-around [gap:var(--gap)]",
              {
                "animate-marquee flex-row": !vertical,
                "animate-marquee-vertical flex-col": vertical,
                "group-hover:[animation-play-state:paused]": pauseOnHover,
                "[animation-direction:reverse]": reverse,
              },
            )}
          >
            {children}
          </div>
        ))}
    </div>
  );
}

export default Marquee;
