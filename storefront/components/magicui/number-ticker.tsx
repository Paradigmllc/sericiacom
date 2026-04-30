"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/cn";

/**
 * Magic UI NumberTicker — scroll-triggered animated number.
 *
 * Adapted from magicui.design/r/number-ticker (MIT). Sericia tuning:
 *   - tabular-nums for stable digit width (no layout shift during count)
 *   - prefers-reduced-motion: jumps to final value instantly
 *
 * Different from `react-countup` (already in deps) in two ways:
 *   1. Uses framer-motion useSpring for smoother easing
 *   2. Default decimals 0 — call sites that need decimals pass them
 */

interface NumberTickerProps {
  value: number;
  direction?: "up" | "down";
  delay?: number;
  className?: string;
  decimalPlaces?: number;
}

export function NumberTicker({
  value,
  direction = "up",
  delay = 0,
  className,
  decimalPlaces = 0,
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setReducedMotion(
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false,
    );
  }, []);

  const motionValue = useMotionValue(direction === "down" ? value : 0);
  const springValue = useSpring(motionValue, {
    damping: 60,
    stiffness: 100,
  });
  const isInView = useInView(ref, { once: true, margin: "0px" });

  useEffect(() => {
    if (!isInView) return;
    if (reducedMotion) {
      motionValue.set(value);
      if (ref.current) {
        ref.current.textContent = value.toFixed(decimalPlaces);
      }
      return;
    }
    const t = setTimeout(() => {
      motionValue.set(direction === "down" ? 0 : value);
    }, delay * 1000);
    return () => clearTimeout(t);
  }, [motionValue, isInView, delay, value, direction, reducedMotion, decimalPlaces]);

  useEffect(() => {
    const unsub = springValue.on("change", (latest: number) => {
      if (!ref.current) return;
      ref.current.textContent = latest.toFixed(decimalPlaces);
    });
    return () => unsub();
  }, [springValue, decimalPlaces]);

  return (
    <span
      ref={ref}
      className={cn("inline-block tabular-nums", className)}
    >
      0
    </span>
  );
}

export default NumberTicker;
