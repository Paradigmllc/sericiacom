"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

/**
 * Magic UI Sparkles Text — H1 / hero text with floating sparkle particles.
 *
 * Adapted from magicui.design/r/sparkles-text (MIT). Sericia tuning:
 *   - Sparkle colour pulled from sericia palette tokens
 *   - Default sparkle count 6 (not 10) — restraint
 *   - prefers-reduced-motion: sparkles disappear (text remains static)
 *
 * Use case: TL;DR badge or section heading where we want a subtle
 * "this is special" cue without going full marketing-confetti.
 */

interface Sparkle {
  id: string;
  x: string;
  y: string;
  color: string;
  delay: number;
  scale: number;
  lifespan: number;
}

interface SparklesTextProps {
  /** The text content to render. */
  text: string;
  className?: string;
  sparklesCount?: number;
  /** Two-tone sparkles. Default = sericia accent + paper-card. */
  colors?: { first: string; second: string };
}

function genSparkle(
  colors: { first: string; second: string },
): Sparkle {
  return {
    id: `${Math.random()}-${Date.now()}`,
    x: `${Math.random() * 100}%`,
    y: `${Math.random() * 100}%`,
    color: Math.random() > 0.5 ? colors.first : colors.second,
    delay: Math.random() * 2,
    scale: Math.random() * 1 + 0.3,
    lifespan: Math.random() * 10 + 5,
  };
}

export function SparklesText({
  text,
  className,
  sparklesCount = 6,
  colors = { first: "#21231d", second: "#a06a3f" },
}: SparklesTextProps) {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    setReducedMotion(reduced);
    if (reduced) return;
    setSparkles(
      Array.from({ length: sparklesCount }, () => genSparkle(colors)),
    );
    const interval = setInterval(() => {
      setSparkles((prev) => {
        const next = prev
          .map((s) => ({ ...s }))
          .filter((s) => s.lifespan > 0.1);
        while (next.length < sparklesCount) {
          next.push(genSparkle(colors));
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sparklesCount, colors]);

  return (
    <span className={cn("relative inline-block", className)}>
      {!reducedMotion &&
        sparkles.map((sparkle) => (
          <motion.svg
            key={sparkle.id}
            className="pointer-events-none absolute z-10"
            style={{ left: sparkle.x, top: sparkle.y }}
            width="12"
            height="12"
            viewBox="0 0 21 21"
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [0, sparkle.scale, 0],
              opacity: [0, 0.9, 0],
            }}
            transition={{
              duration: 2.5,
              delay: sparkle.delay,
              repeat: Infinity,
              repeatDelay: sparkle.lifespan / 2,
            }}
          >
            <path
              d="M9.82531 0.843845C10.0553 0.215178 10.9446 0.215178 11.1746 0.843845L11.6622 2.18646C12.6831 4.99828 14.8993 7.21455 17.7111 8.23541L19.0537 8.72296C19.6824 8.95301 19.6824 9.84231 19.0537 10.0724L17.7111 10.5599C14.8993 11.5808 12.6831 13.7971 11.6622 16.6089L11.1746 17.9515C10.9446 18.5802 10.0553 18.5802 9.82531 17.9515L9.33775 16.6089C8.31688 13.7971 6.10063 11.5808 3.28882 10.5599L1.94619 10.0724C1.31753 9.84231 1.31753 8.95301 1.94619 8.72296L3.28882 8.23541C6.10063 7.21455 8.31688 4.99828 9.33775 2.18646L9.82531 0.843845Z"
              fill={sparkle.color}
            />
          </motion.svg>
        ))}
      <span className="relative z-0">{text}</span>
    </span>
  );
}

export default SparklesText;
