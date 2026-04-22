/**
 * Payload local-API helper for Server Components.
 *
 * Pattern: wrap `getPayload({ config })` so call-sites don't repeat the import
 * gymnastics. Payload itself memoizes the client per-process; React `cache()`
 * adds per-request memoization for concurrent SC trees.
 *
 * Usage in a Server Component:
 *   const payload = await getPayloadClient();
 *   const { docs } = await payload.find({ collection: "testimonials", ... });
 */
import { cache } from "react";
import { getPayload } from "payload";
import config from "../payload.config";

async function initPayload() {
  return getPayload({ config });
}

// React 19 `cache()` = per-request memoization. For cross-request singleton,
// Payload's own internal cache handles it.
export const getPayloadClient = cache(initPayload);
