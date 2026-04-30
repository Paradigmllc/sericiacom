"use client";

import { cn } from "@/lib/cn";
import { motion, type Transition } from "framer-motion";
import type { CSSProperties } from "react";

/**
 * Magic UI BorderBeam — animated border highlight.
 *
 * A thin rotating beam travels around the parent's border. Used to
 * draw the eye to the primary CTA in pSEO articles without
 * introducing flashing or popups (Aesop-tone restraint).
 *
 * Adapted from magicui.design/r/border-beam (MIT). Sericia tuning:
 *   - Default colours pulled from sericia palette: ink → accent
 *   - Default duration 8s (slower = more luxurious read)
 *   - prefers-reduced-motion: animation pauses (visible static border)
 */

interface BorderBeamProps {
  /** Beam segment length in px. Higher = longer trail. */
  size?: number;
  /** Animation cycle in seconds. */
  duration?: number;
  /** Stroke width in px. */
  borderWidth?: number;
  /** Hex / rgb tone at the head of the beam. */
  colorFrom?: string;
  /** Hex / rgb tone at the tail of the beam. */
  colorTo?: string;
  /** Initial offset (0–100%). */
  initialOffset?: number;
  /** Reverse direction. */
  reverse?: boolean;
  className?: string;
  /** Override transition (rare). */
  transition?: Transition;
}

export function BorderBeam({
  className,
  size = 50,
  duration = 8,
  colorFrom = "#21231d",
  colorTo = "#807c70",
  borderWidth = 1,
  initialOffset = 0,
  reverse = false,
  transition,
}: BorderBeamProps) {
  return (
    <div className="pointer-events-none absolute inset-0 rounded-[inherit] [border:calc(var(--border-width)*1px)_solid_transparent] ![mask-clip:padding-box,border-box] ![mask-composite:intersect] [mask:linear-gradient(transparent,transparent),linear-gradient(white,white)]"
      style={{ "--border-width": borderWidth } as CSSProperties}
    >
      <motion.div
        className={cn(
          "absolute aspect-square",
          "bg-gradient-to-l from-[var(--color-from)] via-[var(--color-to)] to-transparent",
          className,
        )}
        style={{
          width: size,
          offsetPath: `rect(0 auto auto 0 round ${size}px)`,
          "--color-from": colorFrom,
          "--color-to": colorTo,
        } as CSSProperties}
        initial={{ offsetDistance: `${initialOffset}%` }}
        animate={{
          offsetDistance: reverse
            ? [`${100 - initialOffset}%`, `${-initialOffset}%`]
            : [`${initialOffset}%`, `${100 + initialOffset}%`],
        }}
        transition={{
          repeat: Infinity,
          ease: "linear",
          duration,
          ...transition,
        }}
      />
    </div>
  );
}

export default BorderBeam;
