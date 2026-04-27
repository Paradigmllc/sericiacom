/**
 * Medusa-backed product fetchers.
 *
 * Drop-in replacement for lib/products.ts (Supabase-backed).
 * Exposes the same `Product` shape so consumers (PDP / listings / cart) don't
 * need to change. Once this is verified we will delete lib/products.ts and
 * rename this to it.
 *
 * Data source: Medusa Store API (https://api.sericia.com/store/products)
 *   via @medusajs/js-sdk singleton in lib/medusa.ts
 *
 * Mapping rules:
 *  - product.id        → Product.id (keep Medusa prod_* id — needed for cart)
 *  - product.handle    → Product.slug
 *  - variants[0].prices[currency=region.currency_code].amount / 100
 *                      → Product.price_usd   (Medusa stores cents)
 *  - product.images[].url → Product.images (thumbnail first, then gallery)
 *  - product.weight    → Product.weight_g   (Medusa stores grams)
 *  - inventory_quantity sum across variants → Product.stock
 *  - inferCategory(product) → Product.category  ← see TODO below
 */

import { unstable_cache } from "next/cache";
import { medusa, DEFAULT_REGION_SLUG, getRegionId } from "./medusa";
import type { Product } from "./products";

/**
 * Cache windows.
 *   • LIST_TTL: 60s — listing pages tolerate stock counts being up to a minute
 *     stale (low-stock badges remain accurate within a tight margin).
 *   • DETAIL_TTL: 30s — PDP needs fresher stock since "Only 3 left" pills
 *     are cart-decision-critical, but every-request fresh exhausts CPU.
 *   • IDS_TTL: 30s — used by /api/crossmint-webhook for inventory decrement
 *     and the cart drawer; same trade-off as detail.
 */
const LIST_TTL_SEC = 60;
const DETAIL_TTL_SEC = 30;
const IDS_TTL_SEC = 30;

type MedusaImage = { id: string; url: string };
type MedusaPrice = { amount: number; currency_code: string };
type MedusaVariant = {
  id: string;
  title: string;
  prices?: MedusaPrice[];
  inventory_quantity?: number;
  calculated_price?: { calculated_amount: number; currency_code: string };
};
type MedusaProduct = {
  id: string;
  title: string;
  handle: string;
  description: string | null;
  thumbnail: string | null;
  images?: MedusaImage[];
  variants?: MedusaVariant[];
  weight?: number | null;
  status: "published" | "draft" | "proposed" | "rejected";
  categories?: { id: string; handle: string; name: string }[];
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

/**
 * inferCategory — Strategy B (category handle).
 *
 * Reads the first category handle from Medusa product.categories[] and maps it
 * to our 4-enum. Categories are bootstrapped by:
 *   medusa-backend/src/scripts/categorize-products.ts
 * which creates { tea, miso, mushroom, seasoning } as top-level product_category
 * records and attaches the 4 seed products accordingly.
 *
 * Fallback to handle keyword match if categories is empty — this keeps the UI
 * usable even if a new product is added via admin but categorization is
 * forgotten. Final fallback is "seasoning" (catch-all / limited-drop slot).
 */
const VALID_CATEGORIES: ReadonlySet<Product["category"]> = new Set([
  "tea",
  "miso",
  "mushroom",
  "seasoning",
]);

function inferCategory(product: MedusaProduct): Product["category"] {
  const handle = product.categories?.[0]?.handle;
  if (handle && VALID_CATEGORIES.has(handle as Product["category"])) {
    return handle as Product["category"];
  }
  // Keyword fallback for uncategorized new products
  const h = product.handle.toLowerCase();
  if (h.includes("sencha") || h.includes("tea") || h.includes("matcha")) return "tea";
  if (h.includes("miso")) return "miso";
  if (h.includes("shiitake") || h.includes("mushroom")) return "mushroom";
  return "seasoning";
}

function toProduct(
  mp: MedusaProduct,
  currency: string,
): Product {
  // Pick the cheapest variant's price as the display price (matches how we
  // showed price_usd flat before — upgrade to variant picker later).
  const cheapest = (mp.variants ?? [])
    .map((v) => {
      const byCurrency = v.prices?.find((p) => p.currency_code === currency);
      return byCurrency?.amount ?? v.calculated_price?.calculated_amount ?? null;
    })
    .filter((a): a is number => a !== null)
    .sort((a, b) => a - b)[0];

  const priceUsd = cheapest != null ? cheapest / 100 : 0;

  const stock = (mp.variants ?? []).reduce(
    (sum, v) => sum + (v.inventory_quantity ?? 0),
    0,
  );

  const images = [
    ...(mp.thumbnail ? [mp.thumbnail] : []),
    ...(mp.images ?? []).map((i) => i.url).filter((u) => u !== mp.thumbnail),
  ];

  return {
    id: mp.id,
    slug: mp.handle,
    name: mp.title,
    description: mp.description ?? "",
    story: (mp.metadata?.story as string | undefined) ?? "",
    price_usd: priceUsd,
    weight_g: mp.weight ?? 0,
    stock,
    category: inferCategory(mp),
    images,
    status: mp.status === "published" ? "active" : stock === 0 ? "sold_out" : "draft",
    origin_region: (mp.metadata?.origin_region as string | undefined) ?? null,
    producer_name: (mp.metadata?.producer_name as string | undefined) ?? null,
    created_at: mp.created_at,
    updated_at: mp.updated_at,
  };
}

async function fetchWithRegion(): Promise<{
  regionId: string | null;
  currency: string;
}> {
  const regionId = await getRegionId(DEFAULT_REGION_SLUG);
  // Fallback currency if region lookup fails — jp uses jpy, most EU/US uses usd.
  // We only use this to pick the right price from variant.prices[], so the
  // worst case of a wrong guess is price=0 (surfaced in UI, not silent).
  const currency = DEFAULT_REGION_SLUG === "jp" ? "jpy" : "usd";
  return { regionId, currency };
}

// ── Uncached fetchers (raw work) ───────────────────────────────────────────
// `unstable_cache` requires its inner function to be a stable reference, so
// we factor the actual Medusa calls out and let the public exports below wrap
// them with caching keys + revalidate windows. This keeps the same external
// API while giving us per-key cache invalidation.

async function listActiveProductsRaw(): Promise<Product[]> {
  try {
    const { regionId, currency } = await fetchWithRegion();
    const { products } = await medusa.store.product.list({
      limit: 100,
      fields:
        "id,title,handle,description,thumbnail,images.url,weight,status,metadata,categories.handle,categories.name,variants.id,variants.title,variants.prices.amount,variants.prices.currency_code,variants.inventory_quantity,variants.calculated_price,created_at,updated_at",
      ...(regionId ? { region_id: regionId } : {}),
    });
    return (products as unknown as MedusaProduct[])
      .map((p) => toProduct(p, currency))
      .filter((p) => p.status === "active")
      .sort(
        (a, b) =>
          a.category.localeCompare(b.category) || a.price_usd - b.price_usd,
      );
  } catch (err) {
    console.error("[products-medusa] listActive failed", err);
    return [];
  }
}

async function getProductBySlugRaw(slug: string): Promise<Product | null> {
  try {
    const { regionId, currency } = await fetchWithRegion();
    const { products } = await medusa.store.product.list({
      handle: slug,
      limit: 1,
      fields:
        "id,title,handle,description,thumbnail,images.url,weight,status,metadata,categories.handle,categories.name,variants.id,variants.title,variants.prices.amount,variants.prices.currency_code,variants.inventory_quantity,variants.calculated_price,created_at,updated_at",
      ...(regionId ? { region_id: regionId } : {}),
    });
    const mp = (products as unknown as MedusaProduct[])[0];
    if (!mp) return null;
    const p = toProduct(mp, currency);
    return p.status === "active" ? p : null;
  } catch (err) {
    console.error("[products-medusa] getBySlug failed", err);
    return null;
  }
}

async function getProductsByIdsRaw(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];
  try {
    const { regionId, currency } = await fetchWithRegion();
    const { products } = await medusa.store.product.list({
      id: ids,
      limit: ids.length,
      fields:
        "id,title,handle,description,thumbnail,images.url,weight,status,metadata,categories.handle,categories.name,variants.id,variants.title,variants.prices.amount,variants.prices.currency_code,variants.inventory_quantity,variants.calculated_price,created_at,updated_at",
      ...(regionId ? { region_id: regionId } : {}),
    });
    return (products as unknown as MedusaProduct[]).map((p) =>
      toProduct(p, currency),
    );
  } catch (err) {
    console.error("[products-medusa] getByIds failed", err);
    return [];
  }
}

// ── Cached public exports ──────────────────────────────────────────────────
// `unstable_cache` keeps the function reference stable across requests so
// repeat callers within `LIST_TTL_SEC` reuse the same Medusa response — turning
// the post-import 6-second /products page into a sub-50ms cache-hit page after
// the first warmup. tag: "products" allows targeted revalidation later
// (e.g. from a Medusa product.updated webhook).

export const listActiveProducts = unstable_cache(
  listActiveProductsRaw,
  ["products-list-active"],
  { revalidate: LIST_TTL_SEC, tags: ["products", "products-list"] },
);

export const getProductBySlug = unstable_cache(
  async (slug: string) => getProductBySlugRaw(slug),
  ["products-by-slug"],
  { revalidate: DETAIL_TTL_SEC, tags: ["products", "products-detail"] },
);

export const getProductsByIds = unstable_cache(
  async (ids: string[]) => getProductsByIdsRaw([...ids].sort()),
  ["products-by-ids"],
  { revalidate: IDS_TTL_SEC, tags: ["products"] },
);

// categoryLabel lives in ./products alongside the Product type (canonical).
// Consumers should continue importing from "@/lib/products".
