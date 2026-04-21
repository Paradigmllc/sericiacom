/**
 * Medusa v2 Store API client (singleton).
 *
 * Consumed by:
 *  - lib/products-medusa.ts  (product catalog fetchers)
 *  - lib/cart-medusa.ts      (cart + checkout ops — added in M4a phase 2)
 *
 * Env vars (set in Coolify Storefront):
 *  - NEXT_PUBLIC_MEDUSA_BACKEND_URL   → https://api.sericia.com
 *  - NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY → pk_...
 *  - NEXT_PUBLIC_DEFAULT_REGION       → jp (ISO region code, not region_id)
 *
 * NOTE on publishable key: unlike the admin JWT, the publishable key is safe
 * to expose client-side. It scopes all reads to the sales channel the key is
 * bound to. Missing key = empty product lists — we emit a loud error rather
 * than silently returning [] (rule V: no silent env fallbacks).
 */

import Medusa from "@medusajs/js-sdk";

const MEDUSA_BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "https://api.sericia.com";

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  // Don't throw at import time (Next build would fail on any route touching it).
  // Instead log loudly so misconfiguration surfaces in Coolify deploy logs.
  console.error(
    "[medusa] NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY is not set. " +
      "Product lists will be empty. Set it in Coolify → Storefront env vars.",
  );
}

export const medusa = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  publishableKey: PUBLISHABLE_KEY ?? "",
  debug: process.env.NODE_ENV !== "production",
});

/**
 * Default region code (ISO-ish — "jp" | "us" | "eu" | "gb" | "ca" | "au" | "sg" | "hk" | "me").
 * Medusa stores regions with a `name`/`currency_code` pair; we key by a stable
 * slug that the seed script writes into region.metadata.slug.
 */
export const DEFAULT_REGION_SLUG =
  process.env.NEXT_PUBLIC_DEFAULT_REGION || "jp";

/**
 * Resolve a region_id from a region slug (cached per process).
 *
 * Three-layer lookup — any of these keys resolve to the same region_id so we
 * tolerate drift between Medusa admin config and storefront env:
 *   1. metadata.slug       — canonical if seed script set it (e.g. "jp")
 *   2. name.toLowerCase()  — human-typed name ("Japan" → "japan")
 *   3. countries[].iso_2   — ISO-3166 alpha-2 code ("JP" → "jp")
 *
 * Why the widening: we shipped with `NEXT_PUBLIC_DEFAULT_REGION=jp` but the
 * Medusa region was created as "Japan" (no metadata.slug). The old lookup only
 * indexed "japan" and returned null for "jp" — every product query then fired
 * without region_id and Medusa v2 threw "Missing required pricing context".
 * PDPs 404'd, /products was empty. Building all three keys means no future
 * env/backend drift can reproduce the bug.
 *
 * Lookup is case-insensitive (we lowercase both the key writes and the slug
 * read) so callers don't need to know the original casing.
 *
 * Returns null if the region doesn't exist — caller decides whether to fall
 * back to default or error out.
 */
let _regionCache: Map<string, string> | null = null;

export async function getRegionId(slug: string): Promise<string | null> {
  if (!_regionCache) {
    _regionCache = new Map();
    try {
      // Note: module-level _regionCache (above) gives us per-process caching.
      // Regions only change on redeploy so we warm once and reuse.
      const { regions } = await medusa.store.region.list({
        fields: "id,name,currency_code,metadata,countries.iso_2",
      });
      for (const r of regions) {
        const keys: (string | undefined)[] = [
          (r.metadata?.slug as string | undefined)?.toLowerCase(),
          r.name?.toLowerCase(),
          // `fields:` projection weakens countries to a partial shape, so the
          // SDK's row type no longer carries `iso_2`. Annotate explicitly
          // rather than `as any` — keeps `noImplicitAny` strict-mode honest.
          ...((r.countries ?? []).map(
            (c: { iso_2?: string | null }) => c.iso_2?.toLowerCase(),
          )),
        ];
        for (const k of keys) {
          if (k) _regionCache.set(k, r.id);
        }
      }
    } catch (err) {
      console.error("[medusa] region.list failed", err);
      return null;
    }
  }
  return _regionCache.get(slug.toLowerCase()) ?? null;
}
