"use client";

/**
 * ProductsFilterBar — category pills + sort select for /products.
 *
 * Why this is a Client Component even though the filtering happens server-side:
 *   • The SERVER reads searchParams and returns an already-filtered grid — that
 *     is the source of truth (SEO-friendly, shareable URL, works with JS off).
 *   • This component is only for the INTERACTION surface. It:
 *       1. Renders the pills as <Link> elements (so Ctrl/Cmd-click opens the
 *          filtered view in a new tab — a detail that matters on /products).
 *       2. Renders a native <select> for sort and calls router.replace() on
 *          change so the URL updates without a hard reload.
 *   • `router.replace` (not push) — filter changes shouldn't fill the browser
 *     back stack. One press of Back from /products?category=tea should go to
 *     wherever the user came from, not cycle through every pill they tried.
 *
 * URL schema:
 *   /products                             → all, default (featured) order
 *   /products?category=tea                → only tea, default order
 *   /products?sort=price-asc              → all, price low→high
 *   /products?category=miso&sort=name     → combined
 *
 * Design: Aesop-restraint — hairline pills that invert on active, small-caps
 * label eyebrow, sort on the right in the same 11px tracking as the label.
 */
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

export type CategoryKey = "tea" | "miso" | "mushroom" | "seasoning";
export type SortKey = "featured" | "price-asc" | "price-desc" | "name";

export const SORT_OPTIONS: ReadonlyArray<{ value: SortKey; label: string }> = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price — low to high" },
  { value: "price-desc", label: "Price — high to low" },
  { value: "name", label: "Name — A to Z" },
];

const CATEGORY_PILLS: ReadonlyArray<{ key: CategoryKey | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "tea", label: "Tea" },
  { key: "miso", label: "Miso" },
  { key: "mushroom", label: "Mushroom" },
  { key: "seasoning", label: "Seasoning" },
];

type Props = {
  currentCategory: CategoryKey | null;
  currentSort: SortKey;
  counts: Record<CategoryKey, number>;
  totalCount: number;
};

export default function ProductsFilterBar({
  currentCategory,
  currentSort,
  counts,
  totalCount,
}: Props) {
  const router = useRouter();
  const pathname = usePathname() || "/products";
  const searchParams = useSearchParams();

  // Build a new URL preserving every other param except the one we're updating.
  // `null` removes the param. We always emit a canonical ordering so the URL
  // stays stable (category first, sort second) — nice for tracking & sharing.
  const buildHref = useCallback(
    (patch: { category?: CategoryKey | "all" | null; sort?: SortKey | null }) => {
      const next = new URLSearchParams(searchParams?.toString() ?? "");
      if (patch.category !== undefined) {
        if (patch.category === null || patch.category === "all") next.delete("category");
        else next.set("category", patch.category);
      }
      if (patch.sort !== undefined) {
        if (patch.sort === null || patch.sort === "featured") next.delete("sort");
        else next.set("sort", patch.sort);
      }
      const qs = next.toString();
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [pathname, searchParams],
  );

  const onSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as SortKey;
    router.replace(buildHref({ sort: value }), { scroll: false });
  };

  const activeKey: CategoryKey | "all" = currentCategory ?? "all";

  // Cumulative label for the eyebrow — "12 items" / "3 items in Tea".
  const summary = useMemo(() => {
    if (currentCategory === null) return `${totalCount} ${totalCount === 1 ? "item" : "items"}`;
    const n = counts[currentCategory] ?? 0;
    const catLabel =
      CATEGORY_PILLS.find((p) => p.key === currentCategory)?.label ?? currentCategory;
    return `${n} ${n === 1 ? "item" : "items"} in ${catLabel}`;
  }, [currentCategory, counts, totalCount]);

  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 md:gap-8 pb-8 md:pb-10 border-b border-sericia-line">
      <div className="flex-1 min-w-0">
        <p className="label mb-4">{summary}</p>
        <nav aria-label="Filter by category">
          <ul className="flex flex-wrap items-center gap-2">
            {CATEGORY_PILLS.map((p) => {
              const isActive = p.key === activeKey;
              const n = p.key === "all" ? totalCount : counts[p.key] ?? 0;
              const disabled = p.key !== "all" && n === 0;
              return (
                <li key={p.key}>
                  {disabled ? (
                    <span
                      aria-disabled="true"
                      className="inline-flex items-center gap-1.5 border border-sericia-line px-4 py-2 text-[12px] tracking-[0.14em] uppercase text-sericia-ink-mute opacity-50 cursor-not-allowed"
                    >
                      {p.label}
                      <span className="tabular-nums normal-case tracking-normal text-[10px] text-sericia-ink-mute">
                        ({n})
                      </span>
                    </span>
                  ) : (
                    <Link
                      href={buildHref({
                        category: p.key === "all" ? null : (p.key as CategoryKey),
                      })}
                      scroll={false}
                      aria-current={isActive ? "page" : undefined}
                      className={`inline-flex items-center gap-1.5 border px-4 py-2 text-[12px] tracking-[0.14em] uppercase transition-colors ${
                        isActive
                          ? "bg-sericia-ink text-sericia-paper border-sericia-ink"
                          : "border-sericia-line text-sericia-ink hover:border-sericia-ink"
                      }`}
                    >
                      {p.label}
                      <span
                        className={`tabular-nums normal-case tracking-normal text-[10px] ${
                          isActive ? "text-sericia-paper/70" : "text-sericia-ink-mute"
                        }`}
                      >
                        ({n})
                      </span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div className="flex items-center gap-3 md:shrink-0">
        <label
          htmlFor="products-sort"
          className="label whitespace-nowrap"
        >
          Sort by
        </label>
        <div className="relative">
          <select
            id="products-sort"
            value={currentSort}
            onChange={onSortChange}
            className="appearance-none bg-transparent border-b border-sericia-line focus:border-sericia-ink focus:outline-none py-2 pr-8 pl-0 text-[13px] text-sericia-ink cursor-pointer transition-colors"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <svg
            aria-hidden
            viewBox="0 0 10 6"
            className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 w-[10px] h-[6px] text-sericia-ink-mute"
          >
            <path d="M1 1l4 4 4-4" stroke="currentColor" fill="none" strokeWidth="1.2" />
          </svg>
        </div>
      </div>
    </div>
  );
}
