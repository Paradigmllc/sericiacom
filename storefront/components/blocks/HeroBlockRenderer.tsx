/**
 * HeroBlockRenderer — full-bleed CMS-driven hero section.
 *
 * Renders a Hero block placed by an editor in `Globals → Homepage → blocks`.
 * This is DISTINCT from the top-of-page <CinematicHero />: editors can drop
 * additional hero-style sections anywhere in the page (e.g. mid-page
 * "Discover the new drop" cinematic break between editorial blocks).
 *
 * Visual contract:
 *   • 70vh tall (vs CinematicHero's 92vh) — feels like an "interlude" rather
 *     than the main top-of-page anchor.
 *   • Same layered stack: video → gradient overlay → grain → dark wash → text.
 *   • Editor's `align` field maps to text alignment (left/center/right).
 *   • Falls back gracefully: video missing → fallbackImage → gradient only.
 *
 * Server component — no framer-motion needed (no parallax on this variant).
 * Animations are reserved for the top hero to keep visual hierarchy clear.
 */

import Link from "next/link";
import type { Homepage } from "@/payload-types";

type HeroBlockData = Extract<NonNullable<Homepage["blocks"]>[number], { blockType: "hero" }>;

type Props = {
  block: HeroBlockData;
};

export default function HeroBlockRenderer({ block }: Props) {
  const heading = block.heading?.trim();
  if (!heading) return null; // Required field — but defensive fallback

  const subheading = block.subheading?.trim();
  const ctaLabel = block.ctaLabel?.trim();
  const ctaUrl = block.ctaUrl?.trim();
  const align = block.align ?? "center";

  // videoMedia / fallbackImage are upload relationships. With depth >=1 they
  // resolve to the Media object; with depth 0 they're just IDs. The fetcher
  // uses depth 2 so we expect objects here.
  const videoUrl =
    typeof block.videoMedia === "object" && block.videoMedia?.url
      ? block.videoMedia.url
      : "";
  const isVideo = videoUrl.length > 0 && /\.(mp4|webm|mov)(\?|$)/i.test(videoUrl);
  const imageUrl =
    typeof block.fallbackImage === "object" && block.fallbackImage?.url
      ? block.fallbackImage.url
      : !isVideo && videoUrl
        ? videoUrl // editor uploaded an image to videoMedia field — accept it
        : "";

  const alignClasses =
    align === "left"
      ? "items-start text-left"
      : align === "right"
        ? "items-end text-right"
        : "items-center text-center";

  return (
    <section className="relative isolate overflow-hidden bg-sericia-ink min-h-[70vh] flex border-y border-sericia-line">
      {/* Background stack */}
      <div aria-hidden className="absolute inset-0 -z-10">
        {/* Base gradient (always-on fallback) */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #3a3b2e 0%, #5c5d45 30%, #8a7d5c 60%, #b8a987 100%)",
          }}
        />

        {/* Video layer — only mounts if URL ends in mp4/webm/mov */}
        {isVideo && (
          <video
            className="absolute inset-0 h-full w-full object-cover opacity-95"
            src={videoUrl}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            aria-hidden="true"
          />
        )}

        {/* Image layer — fallback for non-video URLs OR when editor uses fallbackImage */}
        {!isVideo && imageUrl && (
          // Plain <img> here (not next/image) to keep server rendering simple
          // and avoid configuring remotePatterns for editor-uploaded URLs that
          // may live on Supabase S3 vs Coolify-served public/.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-95"
            aria-hidden="true"
          />
        )}

        {/* Dark wash for text legibility */}
        <div className={isVideo || imageUrl ? "absolute inset-0 bg-sericia-ink/45" : "absolute inset-0 bg-sericia-ink/20"} />

        {/* Grain texture */}
        <svg
          aria-hidden
          className="absolute inset-0 h-full w-full opacity-[0.11] mix-blend-overlay"
          xmlns="http://www.w3.org/2000/svg"
        >
          <filter id={`grain-${block.id ?? "hero"}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.13  0 0 0 0 0.14  0 0 0 0 0.11  0 0 0 0.5 0" />
          </filter>
          <rect width="100%" height="100%" filter={`url(#grain-${block.id ?? "hero"})`} />
        </svg>
      </div>

      {/* Foreground */}
      <div
        className={`relative z-10 w-full max-w-[1440px] mx-auto px-6 md:px-12 py-24 md:py-32 flex flex-col ${alignClasses}`}
      >
        <h2 className="text-[36px] md:text-[64px] leading-[1.05] font-light tracking-tight text-sericia-paper drop-shadow-[0_2px_20px_rgba(33,35,29,0.25)] max-w-3xl">
          {heading}
        </h2>
        {subheading && (
          <p className="mt-6 text-[16px] md:text-[18px] leading-[1.7] font-light text-sericia-paper/90 max-w-xl">
            {subheading}
          </p>
        )}
        {ctaLabel && ctaUrl && (
          <Link
            href={ctaUrl}
            data-cursor="link"
            className="mt-10 inline-flex items-center justify-center self-auto bg-sericia-paper text-sericia-ink px-9 py-4 text-[13px] tracking-[0.18em] uppercase hover:bg-sericia-ink hover:text-sericia-paper transition-colors"
          >
            {ctaLabel}
          </Link>
        )}
      </div>
    </section>
  );
}
