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
 * Resolve a region_id from a region slug (cached per request).
 * Returns null if the region doesn't exist — caller decides whether to
 * fall back to default or error.
 */
let _regionCache: Map<string, string> | null = null;

export async function getRegionId(slug: string): Promise<string | null> {
  if (!_regionCache) {
    _regionCache = new Map();
    try {
      // Note: module-level _regionCache (above) gives us per-process caching.
      // We previously passed `{ next: { revalidate: 3600 } }` here, but the
      // Medusa v2 SDK second arg is typed `{ tags: string[] }` and was
      // discarding the Next hint anyway. The Map cache is enough — regions
      // only change on a redeploy.
      const { regions } = await medusa.store.region.list({
        fields: "id,name,currency_code,metadata",
      });
      for (const r of regions) {
        // Seed writes metadata.slug; fall back to lowercased name match.
        const key =
          (r.metadata?.slug as string | undefined) ?? r.name?.toLowerCase();
        if (key) _regionCache.set(key, r.id);
      }
    } catch (err) {
      console.error("[medusa] region.list failed", err);
      return null;
    }
  }
  return _regionCache.get(slug) ?? null;
}
