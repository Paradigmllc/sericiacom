"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * RecentlyViewed — Aesop-tier session memory.
 *
 * Tracks the last N products the visitor has opened on a PDP. Surfaces in:
 *   • Bottom of the products listing ("Continue browsing — recently viewed")
 *   • Bottom of each PDP, below recommended pairings
 *   • Account drawer (future)
 *
 * Design notes:
 *   • Pure client store — never reaches the server. The user's browsing
 *     trail is private; storing it server-side would be overreach for a
 *     restraint brand.
 *   • Capped at 12 entries so the persist payload stays small (≤2KB).
 *   • "Touching" a product (re-viewing) bumps it to the head — same
 *     mental model as recent files in a finder.
 *   • Excludes the currently-viewed product from `list()` so PDP pages
 *     don't show "Recently viewed: this exact thing you're looking at".
 */

export type RecentItem = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price_usd: number;
  weight_g: number;
  origin_region: string | null;
  /** Image URL or null. Card falls back to gradient when null. */
  thumbnail: string | null;
  /** ISO-8601 — last time this item was viewed. Re-viewing updates this. */
  viewedAt: string;
};

const MAX = 12;

type RecentlyViewedState = {
  items: RecentItem[];
  /** Push or move-to-front. Idempotent: re-viewing an item bumps timestamp. */
  touch: (item: Omit<RecentItem, "viewedAt">) => void;
  /** All items minus optional `excludeId`, sorted newest-first. */
  list: (excludeId?: string) => RecentItem[];
  clear: () => void;
};

export const useRecentlyViewed = create<RecentlyViewedState>()(
  persist(
    (set, get) => ({
      items: [],
      touch: (item) =>
        set((state) => {
          const now = new Date().toISOString();
          const without = state.items.filter((i) => i.id !== item.id);
          const next: RecentItem = { ...item, viewedAt: now };
          return { items: [next, ...without].slice(0, MAX) };
        }),
      list: (excludeId) => {
        const all = get().items;
        return excludeId ? all.filter((i) => i.id !== excludeId) : all;
      },
      clear: () => set({ items: [] }),
    }),
    {
      name: "sericia-recently-viewed",
      storage: createJSONStorage(() => localStorage),
      // version bump rebuilds the store when shape changes
      version: 1,
    },
  ),
);
