"use client";

/**
 * AnimatedHeart — animated wishlist heart icon.
 *
 * Separate from the stateless `HeartIcon` in components/Icons.tsx because
 * that one is also used as a decorative "saved" badge on the wishlist page.
 * We don't want those badges bouncing on every page load.
 *
 * Behaviour:
 *   • When `filled` flips false → true, the SVG pops:
 *       scale 1 → 1.35 → 0.9 → 1.08 → 1 over 0.5s (5-step keyframes).
 *     The undershoot at 0.9 is what makes it feel "springy" rather than
 *     a linear pop; the 1.08 shoulder is a gentle settle before 1.
 *   • A one-shot ring pulse expands outward from behind the icon when the
 *     heart is filled — keyed on `filled` so unfill doesn't trigger it.
 *   • When `filled` flips true → false, no bounce (removals shouldn't
 *     celebrate). Just a color/fill fade.
 *   • `useReducedMotion()` short-circuits all motion to identity values
 *     when the user has prefers-reduced-motion: reduce set.
 *
 * Colour:
 *   • Unfilled: inherits `currentColor` from parent (typically
 *     `text-sericia-ink-mute` → `text-sericia-ink` on hover).
 *   • Filled: forces `text-sericia-heart` (#BF3649). Aged crimson — warm
 *     enough to read as "loved" universally, restrained enough to sit in
 *     the Aesop-inspired palette.
 *
 * Framer-motion reference stability:
 *   • Keyframe arrays are module-level constants — framer-motion compares
 *     animate values shallowly, so reusing the same ref avoids spurious
 *     re-animations on unrelated re-renders.
 */

import { SVGProps } from "react";
import { motion, useReducedMotion } from "framer-motion";

// Keyframe tuples hoisted so framer-motion sees identical refs across renders.
const BOUNCE_SCALES = [1, 1.35, 0.9, 1.08, 1];
const BOUNCE_TIMES = [0, 0.2, 0.45, 0.75, 1];
const BOUNCE_DURATION = 0.5; // seconds

// `onAnimation*` / `onDrag*` are also excluded because framer-motion's
// motion.svg overrides those with its own (incompatible) signatures. Leaving
// them in would cause a types collision at the spread site.
type Props = Omit<
  SVGProps<SVGSVGElement>,
  | "fill"
  | "stroke"
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration"
  | "onDrag"
  | "onDragStart"
  | "onDragEnd"
> & {
  filled?: boolean;
  className?: string;
};

export default function AnimatedHeart({ filled = false, className = "", ...props }: Props) {
  const reduce = useReducedMotion();

  return (
    <span className="relative inline-flex items-center justify-center">
      {/* Ring pulse — one-shot, keyed on `filled` so it only plays on add. */}
      {filled && !reduce && (
        <motion.span
          key="heart-pulse"
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full border border-sericia-heart"
          initial={{ scale: 0.6, opacity: 0.55 }}
          animate={{ scale: 2.2, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      )}

      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`${filled ? "text-sericia-heart" : ""} ${className}`}
        aria-hidden="true"
        animate={
          reduce
            ? { scale: 1 }
            : filled
              ? { scale: BOUNCE_SCALES }
              : { scale: 1 }
        }
        transition={{
          duration: BOUNCE_DURATION,
          times: BOUNCE_TIMES,
          ease: "easeOut",
        }}
        {...props}
      >
        <path d="M12 21s-7-4.35-7-10a4.5 4.5 0 0 1 8-2.83A4.5 4.5 0 0 1 19 11c0 5.65-7 10-7 10Z" />
      </motion.svg>
    </span>
  );
}
