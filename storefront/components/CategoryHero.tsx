"use client";

/**
 * CategoryHero — Aesop-style full-bleed banner for product collection pages.
 *
 * Layout (matches aesop.com/gifts/signature-formulations/):
 *   • Full-bleed dark cinematic background (image OR loop video OR gradient)
 *   • Title overlay bottom-left, large light-weight type
 *   • Optional eyebrow caption above title
 *   • min-h 50vh mobile / 60vh desktop
 *
 * Why a dedicated component (not CinematicVideo): the existing video
 * primitive is aspect-ratio driven (4:5, 16:9, 21:9). Hero banners are
 * height-driven (50–60vh). Inlining the video tag here keeps both
 * responsibilities simple instead of one component fighting both modes.
 *
 * Brand discipline:
 *   • Empty src → ink-tone gradient + grain (no sloppy stock photo)
 *   • Reduced-motion → static poster, no scroll parallax
 *   • Dark wash so paper-coloured title reads at WCAG AA over arbitrary imagery
 */

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";

type Tone = "tea" | "miso" | "mushroom" | "seasoning" | "paper" | "drop" | "ink";

const TONE_GRADIENTS: Record<Tone, string> = {
  tea: "from-[#3f4a28] to-[#1a1d12]",
  miso: "from-[#3f2c1a] to-[#1a120a]",
  mushroom: "from-[#2f241c] to-[#15100c]",
  seasoning: "from-[#4a3f10] to-[#1a160a]",
  paper: "from-[#5c5d45] to-[#21231d]",
  drop: "from-[#3a3b2e] to-[#1a1c14]",
  ink: "from-[#2a2c25] to-[#0e1009]",
};

export default function CategoryHero({
  eyebrow,
  title,
  videoSrc,
  posterSrc,
  imageSrc,
  tone = "ink",
}: {
  eyebrow?: string;
  title: string;
  /** Loop video URL. Highest priority. */
  videoSrc?: string | null;
  /** Poster frame for video (CLS=0) and reduced-motion still. */
  posterSrc?: string | null;
  /** Static image when no video — falls through to gradient if also empty. */
  imageSrc?: string | null;
  /** Gradient tone for fallback. */
  tone?: Tone;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const [canPlay, setCanPlay] = useState(false);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const titleY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, 80]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.7], reduce ? [1, 1] : [1, 0]);
  const bgScale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [1, 1.08]);

  const hasVideo = !!videoSrc && videoSrc.length > 0;
  const stillSrc = posterSrc || imageSrc || null;

  return (
    <section
      ref={ref}
      className="relative isolate overflow-hidden border-b border-sericia-line min-h-[50vh] md:min-h-[60vh] flex items-end"
    >
      {/* Background stack */}
      <motion.div
        aria-hidden
        className="absolute inset-0 -z-10 will-change-transform"
        style={{ scale: bgScale }}
      >
        {/* Layer 0: tone gradient (ink-leaning) */}
        <div className={`absolute inset-0 bg-gradient-to-br ${TONE_GRADIENTS[tone]}`} />

        {/* Layer 1: poster image (static, paints first) */}
        {stillSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={stillSrc}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
            decoding="async"
          />
        )}

        {/* Layer 2: video (only when src + not reduced-motion) */}
        {hasVideo && !reduce && (
          <video
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
              canPlay ? "opacity-100" : "opacity-0"
            }`}
            src={videoSrc ?? undefined}
            poster={stillSrc ?? undefined}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            aria-hidden="true"
            onCanPlay={() => setCanPlay(true)}
          />
        )}

        {/* Layer 3: grain texture */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.10] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.5'/></svg>\")",
          }}
        />

        {/* Layer 4: dark wash for legibility */}
        <div aria-hidden className="absolute inset-0 bg-sericia-ink/30" />
      </motion.div>

      {/* Foreground title */}
      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-6 md:px-12 py-16 md:py-24">
        <motion.div style={{ y: titleY, opacity: titleOpacity }}>
          {eyebrow && (
            <p className="text-[11px] tracking-[0.3em] uppercase font-medium text-sericia-paper/80 mb-6">
              {eyebrow}
            </p>
          )}
          <h1 className="text-[44px] md:text-[80px] leading-[1.02] font-light tracking-tight text-sericia-paper drop-shadow-[0_2px_24px_rgba(33,35,29,0.35)] max-w-3xl">
            {title}
          </h1>
        </motion.div>
      </div>
    </section>
  );
}

/**
 * Breadcrumb — small top strip below the hero (or at the start of filterable
 * content). Aesop-tier ergonomics: "Home › Gifts › Signature formulations".
 */
export function Breadcrumb({
  items,
}: {
  items: Array<{ label: string; url?: string }>;
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="text-[12px] tracking-wider text-sericia-ink-mute"
    >
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((it, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-2">
              {it.url && !isLast ? (
                <a
                  href={it.url}
                  className="hover:text-sericia-ink transition-colors"
                  data-cursor="link"
                >
                  {it.label}
                </a>
              ) : (
                <span className={isLast ? "text-sericia-ink" : ""}>
                  {it.label}
                </span>
              )}
              {!isLast && (
                <span aria-hidden className="text-sericia-line">
                  ›
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
