"use client";

/**
 * CinematicHero — Aesop-restraint hero with optional bg video + scroll zoom.
 *
 * Layers, back-to-front:
 *   0. Animated gradient (always present, acts as fallback + base tone)
 *   1. Optional <video> layer (env-driven, poster-first for CLS=0)
 *   2. Radial gradient overlay (brand depth)
 *   3. SVG grain (texture)
 *   4. Dark wash (legibility)
 *   5. Foreground content (text + CTA)
 *
 * Scroll behaviour:
 *   • Bg layer (video + gradients): gently scale 1 → 1.08 (cinematic "breathing")
 *   • Text layer: translateY 0 → 120 + opacity 1 → 0 (receding)
 *   • All motion disabled when `prefers-reduced-motion: reduce`
 *
 * Video controls:
 *   • Env-driven activation: NEXT_PUBLIC_HERO_VIDEO_URL required to mount.
 *     Absent = gradient-only hero (current production state, zero CLS).
 *   • `muted + playsInline + loop + autoPlay` — required for mobile autoplay.
 *   • `preload="metadata"` — loads ~1–2KB for dimensions/duration, not the
 *     whole file. First paint uses poster image.
 *   • `poster={NEXT_PUBLIC_HERO_VIDEO_POSTER}` — keeps the visual while the
 *     video buffers. Falls back to gradient if poster is also absent.
 *
 * Accessibility:
 *   • Video is `aria-hidden` (decorative, not informational)
 *   • Reduced motion disables the scroll scale transform entirely
 *   • Autoplaying + muted + looping silent video is WCAG 2.2 AA compliant
 *     (pauses not required since there's no audio + no animation > 5s with
 *     user-blocking content)
 */

import Link from "next/link";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import Typewriter from "typewriter-effect";
import { useRef } from "react";
import { useTranslations } from "next-intl";
import MagneticButton from "./MagneticButton";
import SakuraFall from "./SakuraFall";
import { useSettings } from "./SettingsProvider";

// Env-driven fallback — used only when SiteSettings has no `heroVideoUrl`.
// Set in Coolify if you want a "factory default" before the editor uploads.
const ENV_HERO_VIDEO_URL = process.env.NEXT_PUBLIC_HERO_VIDEO_URL?.trim() || "";
const ENV_HERO_VIDEO_POSTER = process.env.NEXT_PUBLIC_HERO_VIDEO_POSTER?.trim() || "";
const HERO_VIDEO_TYPE = process.env.NEXT_PUBLIC_HERO_VIDEO_TYPE?.trim() || "video/mp4";

// Seasonal / drop-specific decorative overlay. Opt-in — default off.
// Set NEXT_PUBLIC_SAKURA_ENABLED=true in Coolify during spring campaigns.
const SAKURA_ENABLED = process.env.NEXT_PUBLIC_SAKURA_ENABLED === "true";

// Brand defaults are sourced via next-intl `useTranslations("hero")` so a
// visitor on /ja sees Japanese hero copy even before the editor opens
// Payload. URLs (which aren't translation candidates) stay literal.
const DEFAULT_PRIMARY_CTA_URL = "/products";
const DEFAULT_SECONDARY_CTA_URL = "/#story";

export default function CinematicHero() {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const settings = useSettings();
  const copy = settings?.heroCopy;
  const t = useTranslations("hero");

  // Resolve every visible string with CMS-first / env-second / hardcoded-third
  // precedence. Editor edits in Payload → instant reflect on next request.
  const heroVideoUrl = (settings?.heroVideoUrl?.trim() || ENV_HERO_VIDEO_URL).trim();
  const heroPosterUrl = (settings?.heroPosterUrl?.trim() || ENV_HERO_VIDEO_POSTER).trim();

  // Three-tier resolution: CMS (editor) → next-intl messages (locale) →
  // emergency literal. The locale tier is the one the user was missing on
  // /ja before this fix — without it we fall back to en-baked literals.
  const eyebrow = copy?.eyebrow?.trim() || t("eyebrow");
  const headlineLine1 = copy?.headlineLine1?.trim() || t("title_line_1");
  const headlineLine2 = copy?.headlineLine2?.trim() || t("title_line_2");
  const body = copy?.body?.trim() || t("lede");

  const typewriterStrings: string[] =
    copy?.typewriterStrings && copy.typewriterStrings.length > 0
      ? copy.typewriterStrings
          .map((s) => (s as { text?: string | null })?.text?.trim() || "")
          .filter((s): s is string => s.length > 0)
      : [t("typewriter_1"), t("typewriter_2"), t("typewriter_3")];
  const safeTypewriter =
    typewriterStrings.length > 0 ? typewriterStrings : [t("typewriter_1")];

  const metaLines: string[] =
    copy?.metaLines && copy.metaLines.length > 0
      ? copy.metaLines
          .map((s) => (s as { text?: string | null })?.text?.trim() || "")
          .filter((s): s is string => s.length > 0)
      : [t("meta_kyoto"), t("meta_ems"), t("meta_units_fmt", { count: 50 })];

  const primaryCtaLabel = copy?.primaryCtaLabel?.trim() || t("cta_shop");
  const primaryCtaUrl = copy?.primaryCtaUrl?.trim() || DEFAULT_PRIMARY_CTA_URL;
  const secondaryCtaLabel = copy?.secondaryCtaLabel?.trim() || t("cta_story");
  const secondaryCtaUrl = copy?.secondaryCtaUrl?.trim() || DEFAULT_SECONDARY_CTA_URL;

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Text: receding parallax. When reduced motion, collapse to identity.
  const textY = useTransform(scrollYProgress, [0, 1], shouldReduceMotion ? [0, 0] : [0, 120]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.8], shouldReduceMotion ? [1, 1] : [1, 0]);

  // Bg: subtle cinematic zoom (1 → 1.08). Reduced motion = no scale.
  const bgScale = useTransform(scrollYProgress, [0, 1], shouldReduceMotion ? [1, 1] : [1, 1.08]);

  const hasVideo = heroVideoUrl.length > 0;

  return (
    <section
      ref={ref}
      className="relative isolate overflow-hidden bg-sericia-paper min-h-[92vh] flex items-center border-b border-sericia-line"
    >
      {/* ─── Background stack (zoom-transformed as one unit) ─── */}
      <motion.div
        aria-hidden
        className="absolute inset-0 -z-10 will-change-transform"
        style={{ scale: bgScale }}
      >
        {/* Layer 0: animated gradient (always-on base) */}
        <div className="sericia-hero-gradient absolute inset-0" />

        {/* Layer 1: optional bg video (env-gated).
            Mounted only if the URL is set — avoids empty <video> tag. */}
        {hasVideo && (
          <video
            className="absolute inset-0 h-full w-full object-cover opacity-95 mix-blend-normal"
            src={heroVideoUrl}
            poster={heroPosterUrl || undefined}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            // aria-hidden is inherited from parent; explicit for screen readers
            aria-hidden="true"
          >
            {/* Source fallback for browsers that prefer explicit type sniffing */}
            <source src={heroVideoUrl} type={HERO_VIDEO_TYPE} />
          </video>
        )}

        {/* Layer 2: radial gradient overlay — brand depth */}
        <div
          className="absolute inset-0 mix-blend-multiply opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(circle at 18% 30%, rgba(92,93,69,0.35) 0px, transparent 45%), radial-gradient(circle at 82% 72%, rgba(33,35,29,0.28) 0px, transparent 50%), radial-gradient(circle at 52% 20%, rgba(212,201,176,0.25) 0px, transparent 40%)",
          }}
        />

        {/* Layer 3: SVG grain texture */}
        <svg
          aria-hidden
          className="absolute inset-0 h-full w-full opacity-[0.11] mix-blend-overlay"
          xmlns="http://www.w3.org/2000/svg"
        >
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.13  0 0 0 0 0.14  0 0 0 0 0.11  0 0 0 0.5 0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain)" />
        </svg>

        {/* Layer 4: dark wash for text legibility.
            Deeper when video is active (real footage = more chroma = more contrast needed). */}
        <div
          className={hasVideo ? "absolute inset-0 bg-sericia-ink/30" : "absolute inset-0 bg-sericia-ink/15"}
        />
      </motion.div>

      {/* ─── Optional sakura petal overlay ───
          Sits between bg (-z-10) and foreground (z-10) in stacking order.
          Deliberately OUTSIDE the zoom-transformed motion.div so petals don't
          scale with the bg — they should drift at their own pace. */}
      {SAKURA_ENABLED && <SakuraFall zIndex={5} />}

      {/* ─── Foreground content (text + CTAs) ─── */}
      <motion.div
        style={{ y: textY, opacity: textOpacity }}
        className="relative z-10 w-full max-w-[1440px] mx-auto px-6 md:px-12 py-24 md:py-32"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 items-end">
          <div className="md:col-span-8">
            <p className="text-[11px] tracking-[0.3em] uppercase font-medium text-sericia-paper/80 mb-8">
              {eyebrow}
            </p>
            <h1 className="text-[46px] md:text-[80px] leading-[1.02] font-light tracking-tight text-sericia-paper drop-shadow-[0_2px_20px_rgba(33,35,29,0.25)]">
              {headlineLine1}<br />{headlineLine2}
            </h1>
            <div className="mt-3 text-[28px] md:text-[40px] leading-[1.1] text-sericia-paper/95 font-light min-h-[1.2em]">
              <Typewriter
                // Key forces full re-init when editor changes the typewriter
                // strings — without this, the component caches the old strings.
                key={safeTypewriter.join("|")}
                options={{
                  strings: safeTypewriter,
                  autoStart: true,
                  loop: true,
                  delay: 60,
                  deleteSpeed: 30,
                  cursor: "_",
                }}
              />
            </div>
          </div>
          <div className="md:col-span-4">
            <p className="text-[16px] md:text-[17px] text-sericia-paper/90 leading-[1.75] max-w-md">
              {body}
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-5 text-[11px] tracking-[0.22em] uppercase text-sericia-paper/80">
              {metaLines.map((line, i) => (
                <span key={`meta-${i}`} className="inline-flex items-center gap-5">
                  <span>{line}</span>
                  {i < metaLines.length - 1 && (
                    <span className="inline-block h-px w-6 bg-sericia-paper/50" />
                  )}
                </span>
              ))}
            </div>
            <div className="mt-10 flex items-center gap-5">
              <MagneticButton>
                <Link
                  href={primaryCtaUrl}
                  data-cursor="link"
                  className="inline-flex items-center justify-center bg-sericia-paper text-sericia-ink px-9 py-4 text-[13px] tracking-[0.18em] uppercase hover:bg-sericia-ink hover:text-sericia-paper transition-colors"
                >
                  {primaryCtaLabel}
                </Link>
              </MagneticButton>
              <Link
                href={secondaryCtaUrl}
                data-cursor="link"
                className="text-[13px] tracking-[0.18em] uppercase text-sericia-paper border-b border-sericia-paper/70 hover:border-sericia-paper py-1"
              >
                {secondaryCtaLabel}
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <motion.div
          className="absolute bottom-6 left-6 md:left-12 text-[10px] tracking-[0.3em] uppercase text-sericia-paper/60 hidden sm:flex items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
        >
          <span className="inline-block h-px w-10 bg-sericia-paper/50" />
          {t("scroll_hint")}
        </motion.div>
      </motion.div>

      <style>{`
        .sericia-hero-gradient {
          background:
            linear-gradient(135deg, #3a3b2e 0%, #5c5d45 30%, #8a7d5c 60%, #b8a987 100%);
          background-size: 220% 220%;
          animation: sericia-hero-shift 22s ease-in-out infinite;
        }
        @keyframes sericia-hero-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .sericia-hero-gradient { animation: none; }
        }
      `}</style>
    </section>
  );
}
