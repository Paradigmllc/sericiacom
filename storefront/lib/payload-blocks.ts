/**
 * Payload Homepage blocks fetcher — drag-and-drop editorial sections.
 *
 * Scope: fetches the `homepage` global's `blocks` array via Payload local API
 * and returns it narrowed/typed for the `<HomepageBlocks />` dispatcher.
 *
 * Design:
 *   • Silent-fallback — Payload outage or empty blocks MUST NEVER 500 the
 *     homepage. Returns `[]` on any error so the coded skeleton still renders.
 *   • `depth: 2` — resolves `imageRight` from Media ID → Media object (needs
 *     the extra depth because the image sits nested inside a block variant).
 *   • Narrowed discriminated-union exports — renderers consume
 *     `StoryBlockData` / `NewsletterBlockData` without pulling the full
 *     payload-types tree into every component file.
 *
 * Hybrid model (Option C, 2026-04 pivot):
 *   • Brand skeleton (hero/ticker/footer) stays hardcoded in app/page.tsx.
 *   • Editorial middle (story/newsletter) is Payload-driven via this fetcher.
 *   • hero/drop/testimonialsStrip/pressStrip blockTypes are accepted by the
 *     CMS schema but currently no-op in the dispatcher — data sources for
 *     those already live elsewhere (Supabase products, PressMentions/
 *     Testimonials collections rendered directly).
 */

import { cache } from "react";
import { getPayloadClient } from "./payload";
import type { Homepage } from "../payload-types";

/** Every block variant Payload can emit (discriminated by `blockType`). */
export type HomepageBlock = NonNullable<Homepage["blocks"]>[number];

/** Narrowed variants that HomepageBlocks currently knows how to render. */
export type StoryBlockData = Extract<HomepageBlock, { blockType: "story" }>;
export type NewsletterBlockData = Extract<HomepageBlock, { blockType: "newsletter" }>;

async function fetchHomepageBlocks(): Promise<HomepageBlock[]> {
  try {
    const payload = await getPayloadClient();
    const doc = await payload.findGlobal({
      slug: "homepage",
      depth: 2, // story.imageRight needs the extra hop to resolve Media
    });
    return doc?.blocks ?? [];
  } catch (err) {
    console.error("[payload-blocks] fetch failed, skeleton will render alone", err);
    return [];
  }
}

/**
 * Memoised per-request so a page rendering multiple dispatcher slots
 * (not our current pattern, but future-proof) only queries once.
 */
export const getHomepageBlocks = cache(fetchHomepageBlocks);
