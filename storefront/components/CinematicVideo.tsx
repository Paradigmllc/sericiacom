"use client";

/**
 * CinematicVideo — reusable cinema-grade still-life video block.
 *
 * Aesop-tier behaviour:
 *   • Gradient fallback when no `src` is set (existing brand palette stays intact)
 *   • Poster-first rendering for CLS=0; video fades in once it can play
 *   • Loop + muted + playsInline + autoPlay so it works on iOS Safari
 *   • Optional scroll-tied parallax scale (1 → 1.06) for the "breathing" feel
 *   • Optional grain overlay so the gradient fallback doesn't look flat
 *   • Respects `prefers-reduced-motion` — disables scale + autoplay (still
 *     shows the poster, never the video, so motion is truly zero).
 *
 * Why a single component (not three): the gradient placeholder, the static
 * image, and the loop video are visually the same "block" with different
 * fidelity. Keeping them in one primitive lets editors upload a video and
 * have every consumer location upgrade simultaneously, while keeping the
 * untouched ones beautiful by design.
 */

import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type AspectRatio = "square" | "4/5" | "5/7" | "16/9" | "21/9" | "video";

const ASPECT_CLASS: Record<AspectRatio, string> = {
  square: "aspect-square",
  "4/5": "aspect-[4/5]",
  "5/7": "aspect-[5/7]",
  "16/9": "aspect-[16/9]",
  "21/9": "aspect-[21/9]",
  video: "aspect-video",
};

type GradientTone = "tea" | "miso" | "mushroom" | "seasoning" | "paper" | "ink" | "drop";

// Brand palette gradients matching ProductCard categories so video blocks
// degrade gracefully into category-aware placeholders.
const GRADIENTS: Record<GradientTone, string> = {
  tea: "from-[#c8d4b0] to-[#6a7d4c]",
  miso: "from-[#d4c9b0] to-[#7a5c3c]",
  mushroom: "from-[#c8b8a8] to-[#5a4a3c]",
  seasoning: "from-[#e0d4a8] to-[#8a7a2c]",
  paper: "from-[#e8e0cf] to-[#b8a987]",
  ink: "from-[#5c5d45] to-[#21231d]",
  drop: "from-[#d4c9b0] to-[#8a7d5c]",
};

export type CinematicVideoProps = {
  /** Video file URL. Empty / undefined → falls back to gradient + (optional) poster. */
  src?: string | null;
  /** Static image (poster). Used: 1) before video plays, 2) on reduced-motion, 3) on slow networks. */
  poster?: string | null;
  /** Aspect ratio token. Default 4/5 (Aesop-standard for still-life). */
  ratio?: AspectRatio;
  /** Brand gradient tone for the fallback layer. Default 'paper'. */
  tone?: GradientTone;
  /** Enable subtle scroll-tied scale 1 → 1.06. Default true. */
  parallax?: boolean;
  /** Enable SVG grain overlay (Sericia signature). Default true. */
  grain?: boolean;
  /** MIME type override. Default 'video/mp4'. */
  videoType?: string;
  /** Optional caption rendered as an overlay label (small caps, bottom-left). */
  caption?: string;
  /** className passed to the outermost wrapper for layout integration. */
  className?: string;
  /** Disable autoplay — video only plays when scrolled into view. Default false. */
  playWhenInView?: boolean;
  /** When true, the bg gets a darker wash so foreground text reads. Default false. */
  darken?: boolean;
};

export default function CinematicVideo({
  src,
  poster,
  ratio = "4/5",
  tone = "paper",
  parallax = true,
  grain = true,
  videoType = "video/mp4",
  caption,
  className = "",
  playWhenInView = false,
  darken = false,
}: CinematicVideoProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [canPlay, setCanPlay] = useState(false);
  const hasVideo = Boolean(src && src.length > 0);

  // Scroll-tied scale. With reduced motion, collapse to identity.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const scale = useTransform(
    scrollYProgress,
    [0, 1],
    parallax && !reduceMotion ? [1.0, 1.06] : [1, 1],
  );

  // Optional play-when-in-view: pauses video off-screen, plays when ≥30% visible.
  // Reduces battery / decoder pressure when several videos live on one page.
  useEffect(() => {
    if (!hasVideo || !playWhenInView || reduceMotion) return;
    const node = videoRef.current;
    const wrap = ref.current;
    if (!node || !wrap) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            // play() returns a Promise; ignore rejection (user gesture issues etc.)
            node.play().catch(() => {
              // no-op — autoplay blocked, poster stays visible
            });
          } else {
            node.pause();
          }
        }
      },
      { threshold: 0.3 },
    );
    io.observe(wrap);
    return () => io.disconnect();
  }, [hasVideo, playWhenInView, reduceMotion]);

  return (
    <div
      ref={ref}
      className={`relative ${ASPECT_CLASS[ratio]} overflow-hidden bg-sericia-paper-card ${className}`}
    >
      <motion.div
        className="absolute inset-0 will-change-transform"
        style={{ scale }}
      >
        {/* Layer 0 — gradient base. Always rendered; only hidden once video paints. */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${GRADIENTS[tone]}`}
          aria-hidden
        />

        {/* Layer 1 — poster image (if set). Sits above gradient, below video.
            Acts as the "still life" until video can play. */}
        {poster && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={poster}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        )}

        {/* Layer 2 — video (only when src + not reduced-motion). Fades in once
            decoder reports it can play through to avoid flash-of-empty-frame. */}
        {hasVideo && !reduceMotion && (
          <video
            ref={videoRef}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
              canPlay ? "opacity-100" : "opacity-0"
            }`}
            // autoPlay is honored only when playWhenInView is false; otherwise
            // the IntersectionObserver above takes over.
            autoPlay={!playWhenInView}
            loop
            muted
            playsInline
            preload="metadata"
            poster={poster ?? undefined}
            aria-hidden="true"
            onCanPlay={() => setCanPlay(true)}
          >
            {/* Single <source> with explicit type for stricter codec sniffing.
                Browsers that can't decode silently fall back to poster + gradient. */}
            <source src={src ?? undefined} type={videoType} />
          </video>
        )}

        {/* Layer 3 — grain overlay (Sericia signature). Cheap SVG, no extra request. */}
        {grain && (
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.13] mix-blend-overlay pointer-events-none"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.5'/></svg>\")",
            }}
          />
        )}

        {/* Layer 4 — optional darken wash for legibility when text overlays. */}
        {darken && <div aria-hidden className="absolute inset-0 bg-sericia-ink/25" />}
      </motion.div>

      {/* Layer 5 — optional caption label (Aesop "DROP NO. 01" style). */}
      {caption && (
        <p className="absolute bottom-5 left-5 z-10 text-[10px] tracking-[0.3em] uppercase text-sericia-paper/85 mix-blend-difference">
          {caption}
        </p>
      )}
    </div>
  );
}
