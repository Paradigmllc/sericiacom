"use client";

/**
 * SamplerBanner — Aesop-style "complimentary sample with your order" strip.
 *
 * Mirrors aesop.com's hairline announcement (e.g. "Receive a generously-sized
 * sample of new Solais Replenishing Hand Serum with your order"). Sericia's
 * Phase 1 acquisition plan in CLAUDE.md s14-14 already commits to free
 * samples — this component surfaces that promise to every site visitor.
 *
 * Placement strategy:
 *   • Below the announcement marquee on /products and home (already-aware
 *     visitors browsing the catalogue)
 *   • Inside the cart drawer footer (intent peak — about to checkout, this
 *     adds a small surprise that lifts AOV without discounting the brand)
 *
 * Editor control: copy + URL are supplied via props so a single Payload
 * field upstream can drive both placements when SiteSettings learns this
 * shape (next iteration). For now the brand-baseline copy lives in props.
 *
 * Brand tone: same hairline border + paper-card background as Aesop's strip.
 * No yellow highlighter. No emoji. Period at end of each sentence.
 */

import Link from "next/link";

export type SamplerBannerVariant = "wide" | "compact" | "drawer";

export default function SamplerBanner({
  variant = "wide",
  text,
  ctaLabel,
  ctaUrl = "/products",
}: {
  variant?: SamplerBannerVariant;
  text?: string;
  ctaLabel?: string;
  ctaUrl?: string;
}) {
  const copy =
    text ??
    "Receive a complimentary sample of our next drop with your first order — chosen for your palate, packed by hand in Kyoto.";
  const cta = ctaLabel ?? "Learn more";

  if (variant === "drawer") {
    return (
      <div className="border-t border-sericia-line bg-sericia-paper-card px-6 py-4">
        <p className="text-[12px] leading-relaxed text-sericia-ink-soft">
          <span className="text-sericia-ink font-medium">A small gift.</span>{" "}
          {copy.replace(/\.$/, "")}.
        </p>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="border-y border-sericia-line bg-sericia-paper-card text-center py-3.5 px-4">
        <p className="text-[13px] leading-snug text-sericia-ink-soft">
          {copy}{" "}
          <Link href={ctaUrl} className="underline-link text-sericia-ink ml-1">
            {cta}
          </Link>
        </p>
      </div>
    );
  }

  // wide (default — full-width strip, paper card, hairline borders)
  return (
    <section
      aria-label="Complimentary sample with your order"
      className="border-y border-sericia-line bg-sericia-paper-card"
    >
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-5 md:py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-8">
        <p className="text-[14px] md:text-[15px] leading-snug text-sericia-ink max-w-3xl">
          {copy}
        </p>
        <Link
          href={ctaUrl}
          data-cursor="link"
          className="text-[12px] tracking-[0.18em] uppercase border-b border-sericia-ink pb-0.5 text-sericia-ink hover:opacity-70 transition-opacity whitespace-nowrap"
        >
          {cta}
        </Link>
      </div>
    </section>
  );
}
