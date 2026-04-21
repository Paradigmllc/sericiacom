/**
 * Medusa v2 Admin client — server-only mutations.
 *
 * Exists because `lib/medusa.ts` uses the publishable key which only grants
 * Store API read access. Payment-success inventory decrement needs admin
 * JWT auth: login with email+password → cache token 50 min → mutate.
 *
 * Env required (set in Coolify → Storefront; never exposed to the browser):
 *   - MEDUSA_ADMIN_URL       → https://api.sericia.com
 *   - MEDUSA_ADMIN_EMAIL     → admin@sericia.com
 *   - MEDUSA_ADMIN_PASSWORD  → from memory/reference_api_keys.md
 *
 * Graceful degradation (Rule V): missing creds → warn + early return.
 * Payment flow must NEVER block on admin-auth misconfiguration — Crossmint
 * will retry the webhook on 5xx and we'd get duplicate `paid` side effects.
 */

const ADMIN_URL = process.env.MEDUSA_ADMIN_URL || "https://api.sericia.com";
const ADMIN_EMAIL = process.env.MEDUSA_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD;

type CachedToken = { token: string; expiresAt: number };
let _tokenCache: CachedToken | null = null;

async function getAdminToken(): Promise<string | null> {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.warn(
      "[medusa-admin] MEDUSA_ADMIN_EMAIL / MEDUSA_ADMIN_PASSWORD not set — admin ops disabled",
    );
    return null;
  }
  if (_tokenCache && _tokenCache.expiresAt > Date.now()) {
    return _tokenCache.token;
  }
  try {
    const res = await fetch(`${ADMIN_URL}/auth/user/emailpass`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[medusa-admin] login failed", res.status, detail);
      return null;
    }
    const payload = (await res.json()) as { token?: string };
    if (!payload.token) {
      console.error("[medusa-admin] login returned no token", payload);
      return null;
    }
    // Medusa v2 JWT TTL defaults to 60 min — refresh 10 min early.
    _tokenCache = { token: payload.token, expiresAt: Date.now() + 50 * 60_000 };
    return payload.token;
  } catch (e) {
    console.error("[medusa-admin] login exception", e);
    return null;
  }
}

async function adminFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response | null> {
  const token = await getAdminToken();
  if (!token) return null;
  return fetch(`${ADMIN_URL}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    signal: init.signal ?? AbortSignal.timeout(15_000),
  });
}

/**
 * Best-effort inventory decrement for a purchased Medusa product.
 *
 * Walks: product → variants[0].inventory_items[] → location_levels[0]
 *   → POST /admin/inventory-items/{iid}/location-levels/{lid}
 *     with { stocked_quantity: max(0, current - qty) }
 *
 * Sericia products today have 1 variant × 1 inventory_item × 1 location.
 * If we go multi-variant (size/grade), we'd need to know WHICH variant was
 * purchased — right now sericia_orders only stores product_id. Upgrade path:
 * add variant_id to sericia_order_items and pick the exact variant here.
 *
 * Returns a summary for the caller to include in the Slack "paid" bell. Never
 * throws — all failure modes log a warning and return { ok: false }.
 */
export async function decrementVariantInventory(
  productId: string,
  quantity: number,
): Promise<{ ok: boolean; decremented: number }> {
  try {
    const productRes = await adminFetch(
      `/admin/products/${productId}?fields=variants.id,variants.inventory_items.inventory_item_id`,
    );
    if (!productRes || !productRes.ok) {
      console.warn(
        "[medusa-admin] product fetch failed",
        productId,
        productRes?.status,
      );
      return { ok: false, decremented: 0 };
    }
    const { product } = (await productRes.json()) as {
      product: {
        variants?: { inventory_items?: { inventory_item_id: string }[] }[];
      };
    };
    const variant = product?.variants?.[0];
    if (!variant) {
      console.warn("[medusa-admin] no variants on product", productId);
      return { ok: false, decremented: 0 };
    }
    let decremented = 0;
    for (const link of variant.inventory_items ?? []) {
      const iid = link.inventory_item_id;
      if (!iid) continue;
      const lvlRes = await adminFetch(
        `/admin/inventory-items/${iid}/location-levels`,
      );
      if (!lvlRes || !lvlRes.ok) continue;
      const { location_levels } = (await lvlRes.json()) as {
        location_levels: { location_id: string; stocked_quantity: number }[];
      };
      const level = location_levels?.[0];
      if (!level) continue;
      const newQty = Math.max((level.stocked_quantity ?? 0) - quantity, 0);
      const upd = await adminFetch(
        `/admin/inventory-items/${iid}/location-levels/${level.location_id}`,
        {
          method: "POST",
          body: JSON.stringify({ stocked_quantity: newQty }),
        },
      );
      if (upd?.ok) decremented += 1;
    }
    return { ok: true, decremented };
  } catch (e) {
    console.error(
      "[medusa-admin] decrementVariantInventory exception",
      productId,
      e,
    );
    return { ok: false, decremented: 0 };
  }
}
