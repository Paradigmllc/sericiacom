"use client";

/**
 * RecentlyViewed — section that renders the last-viewed products.
 *
 * Two parts:
 *   1. <RecentlyViewedTracker /> — invisible, calls store.touch() on mount
 *      from inside a PDP. Pass the current product so it gets added.
 *   2. <RecentlyViewedSection /> — visible row of cards. Skips render when
 *      empty (no awkward "no recently viewed" empty state — Aesop-level
 *      restraint: don't show a section that has nothing to show).
 *
 * Hydration safety: persist middleware hydrates client-side, so SSR sees
 * an empty list. We mount-gate to avoid a flash where the section renders
 * empty for one frame then populates.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRecentlyViewed, type RecentItem } from "@/lib/recently-viewed-store";

export function RecentlyViewedTracker({ product }: { product: Omit<RecentItem, "viewedAt"> }) {
  const touch = useRecentlyViewed((s) => s.touch);
  useEffect(() => {
    touch(product);
    // We deliberately don't add `touch` or `product` to deps — touch is a
    // stable Zustand setter, and we only want to record the view once per
    // mount. Re-running on every prop change would skew the timestamp.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  tea: "from-[#c8d4b0] to-[#6a7d4c]",
  miso: "from-[#d4c9b0] to-[#7a5c3c]",
  mushroom: "from-[#c8b8a8] to-[#5a4a3c]",
  seasoning: "from-[#e0d4a8] to-[#8a7a2c]",
};

export function RecentlyViewedSection({
  excludeId,
  title = "Recently viewed",
  eyebrow = "Continue browsing",
}: {
  excludeId?: string;
  title?: string;
  eyebrow?: string;
}) {
  const list = useRecentlyViewed((s) => s.list);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // SSR + first paint = empty (restraint default). Avoids hydration mismatch
  // since persist hasn't filled the store yet.
  if (!mounted) return null;

  const items = list(excludeId);
  if (items.length === 0) return null;

  return (
    <section className="border-t border-sericia-line bg-sericia-paper-card">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-16 md:py-20">
        <div className="mb-10 md:mb-12">
          <p className="label mb-3">{eyebrow}</p>
          <h2 className="text-[24px] md:text-[28px] font-normal leading-snug text-sericia-ink">
            {title}
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {items.slice(0, 4).map((it) => {
            const gradient =
              CATEGORY_GRADIENTS[it.category] ?? "from-sericia-line to-sericia-ink-mute";
            return (
              <Link
                key={it.id}
                href={`/products/${it.slug}`}
                data-cursor="link"
                className="group block bg-sericia-paper hover:bg-sericia-paper transition-colors p-4 md:p-5"
              >
                <div className="relative aspect-[4/5] overflow-hidden mb-4">
                  {it.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={it.thumbnail}
                      alt=""
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${gradient} transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]`}
                    />
                  )}
                </div>
                <p className="label mb-2">
                  {it.category}
                  {it.origin_region ? ` · ${it.origin_region}` : ""}
                </p>
                <h3 className="text-[15px] md:text-[16px] font-normal leading-snug text-sericia-ink mb-2 line-clamp-2">
                  {it.name}
                </h3>
                <p className="text-[13px] tabular-nums text-sericia-ink-soft">
                  ${it.price_usd} USD
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
