"use client";

/**
 * JournalTagFilter — server-authority chip filter for the unified /journal
 * index. Mirrors the ProductsFilterBar pattern from F2:
 *
 *   • Server reads `?tag=` from searchParams and renders the correctly-
 *     filtered grid before any client JS executes (crawlable URLs).
 *   • This client component owns only the INPUT surface — the chip row.
 *     A click pushes a new URL via next/navigation; the server re-renders
 *     the grid.
 *
 * Why not Zustand: tag selection is shareable / bookmarkable. Keeping it
 * in the URL means /journal?tag=country-guide is a real page Google can
 * index, instead of a transient state hidden behind JS.
 */

import { useRouter, usePathname } from "next/navigation";
import { tagLabel, type JournalTag } from "@/lib/journal-entries";

type TagKey = "all" | JournalTag;

const ORDER: TagKey[] = ["all", "story", "technique", "guide", "country-guide"];

const ALL_LABEL = "All";

export default function JournalTagFilter({
  current,
  counts,
}: {
  current: TagKey;
  counts: Record<TagKey, number>;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function setTag(tag: TagKey) {
    if (tag === "all") {
      router.push(pathname);
    } else {
      router.push(`${pathname}?tag=${tag}`);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 md:gap-3">
      {ORDER.map((t) => {
        if (counts[t] === 0 && t !== "all") return null;
        const active = current === t;
        const label = t === "all" ? ALL_LABEL : tagLabel(t);
        return (
          <button
            key={t}
            type="button"
            onClick={() => setTag(t)}
            aria-pressed={active}
            data-cursor="link"
            className={`inline-flex items-center gap-2 px-4 py-2 text-[12px] tracking-[0.18em] uppercase border transition-colors ${
              active
                ? "border-sericia-ink bg-sericia-ink text-sericia-paper"
                : "border-sericia-line text-sericia-ink-soft hover:border-sericia-ink hover:text-sericia-ink"
            }`}
          >
            <span>{label}</span>
            <span
              className={`tabular-nums text-[10px] ${
                active ? "text-sericia-paper/70" : "text-sericia-ink-mute"
              }`}
            >
              {counts[t]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
