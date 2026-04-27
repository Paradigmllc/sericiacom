/**
 * Unified journal entry stream.
 *
 * Sericia's editorial content lives in three places by accident of how the
 * project grew:
 *   1. Static authored articles  — lib/journal.ts (13 hand-written pieces)
 *   2. Payload-generated pSEO    — articles collection (DeepSeek output)
 *   3. Static country-product guides — generated from pseo-matrix.ts
 *
 * From the visitor's perspective these are all "Journal" — long-form writing
 * about Japanese craft food. This module fuses the three streams into a
 * single ordered list with consistent shape, so the /journal index can
 * render them as one library with tag-chip filtering instead of forcing the
 * visitor to remember which path holds which kind of writing.
 *
 * Resilience: each source is fetched in a try/catch wrapper so a Payload
 * outage degrades the page to "static articles only" rather than 500-ing.
 */

import { JOURNAL } from "./journal";
import { COUNTRIES, PRODUCTS } from "./pseo-matrix";
import { getPayloadClient } from "./payload";

export type JournalTag = "story" | "guide" | "country-guide" | "technique";

export type JournalEntry = {
  /** URL — already category-correct (`/journal/...`, `/articles/...`, `/guides/...`). */
  href: string;
  title: string;
  /** Short lead. Falls back to first paragraph excerpt for Payload entries. */
  lede: string;
  /** Tag chip shown on the index — drives the filter UI. */
  tag: JournalTag;
  /** Date for sort. Falls back to "static / undated" guides which sort last. */
  publishedAt: string | null;
  /** Reading minutes hint shown next to the title. */
  readingMinutes?: number;
  /** Optional eyebrow ("Tea · Story", "Country guide", etc.). */
  eyebrow: string;
};

const TAG_LABEL: Record<JournalTag, string> = {
  story: "Story",
  technique: "Technique",
  guide: "Guide",
  "country-guide": "Country guide",
};

export function tagLabel(t: JournalTag): string {
  return TAG_LABEL[t];
}

// ── Source 1 — static editorial ──────────────────────────────────────────
function fromStaticJournal(): JournalEntry[] {
  return JOURNAL.map((a) => ({
    href: `/journal/${a.slug}`,
    title: a.title,
    lede: a.lede,
    // Heuristic: eyebrow contains "Tea" / "Miso" etc; if the eyebrow includes
    // the word "guide" we tag as guide, else story.
    tag: /guide/i.test(a.eyebrow) ? "guide" : "story",
    publishedAt: a.published,
    readingMinutes: a.readingMinutes,
    eyebrow: a.eyebrow,
  }));
}

// ── Source 2 — Payload pSEO articles ─────────────────────────────────────
async function fromPayloadArticles(): Promise<JournalEntry[]> {
  try {
    const payload = await getPayloadClient();
    const { docs } = await payload.find({
      collection: "articles",
      where: {
        and: [
          { _status: { equals: "published" } },
        ],
      },
      depth: 0,
      limit: 200,
      sort: "-publishedAt",
      pagination: false,
    });
    return (docs ?? []).map((d) => {
      const tags = (d.tags ?? []) as Array<{ tag?: string | null } | null>;
      const isPseo = tags.some((t) => t?.tag?.startsWith?.("gtm-"));
      const lede =
        (d.seo as { metaDescription?: string | null } | undefined)?.metaDescription
          ?.toString()
          ?.trim() ?? "";
      return {
        href: `/articles/${d.slug}`,
        title: d.title,
        lede: lede.length > 0 ? lede : "Read the full piece.",
        tag: (isPseo ? "country-guide" : "story") as JournalTag,
        publishedAt: d.publishedAt ?? null,
        eyebrow: isPseo ? "Country guide" : "Journal",
      } satisfies JournalEntry;
    });
  } catch (err) {
    console.error("[journal-entries] Payload fetch failed; degrading", err);
    return [];
  }
}

// ── Source 3 — static country × product guides ──────────────────────────
function fromCountryGuides(): JournalEntry[] {
  const out: JournalEntry[] = [];
  for (const c of COUNTRIES) {
    for (const p of PRODUCTS) {
      out.push({
        href: `/guides/${c.code}/${p.slug}`,
        title: `Buying ${p.name} in ${c.name}`,
        lede: `How to import ${p.name.toLowerCase()} from Japan to ${c.name} — shipping, customs, and what to look for.`,
        tag: "country-guide",
        publishedAt: null,
        eyebrow: `${c.flag} ${c.name}`,
      });
    }
  }
  return out;
}

/**
 * Fuse all three streams. Payload duplicates (matching slug already in static)
 * are dropped silently — the static piece is the canonical version because
 * it was hand-edited.
 */
export async function listAllJournalEntries(): Promise<JournalEntry[]> {
  const [staticItems, payloadItems, guideItems] = await Promise.allSettled([
    Promise.resolve(fromStaticJournal()),
    fromPayloadArticles(),
    Promise.resolve(fromCountryGuides()),
  ]);

  const sx = staticItems.status === "fulfilled" ? staticItems.value : [];
  const px = payloadItems.status === "fulfilled" ? payloadItems.value : [];
  const gx = guideItems.status === "fulfilled" ? guideItems.value : [];

  // Dedupe Payload entries whose slug also appears as a static journal article.
  const staticSlugs = new Set(sx.map((s) => s.href));
  const px2 = px.filter((p) => !staticSlugs.has(p.href));

  // Sort: dated entries newest-first; undated guides land at the bottom of
  // their tag group but stay grouped by tag in render via filtering.
  const all = [...sx, ...px2, ...gx];
  all.sort((a, b) => {
    if (a.publishedAt && b.publishedAt) {
      return b.publishedAt.localeCompare(a.publishedAt);
    }
    if (a.publishedAt) return -1;
    if (b.publishedAt) return 1;
    return a.title.localeCompare(b.title);
  });
  return all;
}

/** Counts per tag for the chip UI ("All 86 / Story 7 / Country guide 71"). */
export function countByTag(entries: readonly JournalEntry[]): Record<"all" | JournalTag, number> {
  const counts: Record<"all" | JournalTag, number> = {
    all: entries.length,
    story: 0,
    technique: 0,
    guide: 0,
    "country-guide": 0,
  };
  for (const e of entries) counts[e.tag]++;
  return counts;
}
