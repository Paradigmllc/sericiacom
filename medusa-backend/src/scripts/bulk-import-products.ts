import { ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createInventoryLevelsWorkflow,
  createLinksWorkflow,
  createProductsWorkflow,
} from "@medusajs/medusa/core-flows";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Sericia bulk product import.
 *
 * Reads `medusa-backend/src/scripts/products-bulk.json` and creates products
 * in Medusa via the same workflows the seed uses. Designed to take Sericia
 * from 4 demo products → hundreds of catalog items in a single idempotent
 * pass.
 *
 * Design notes:
 *   • thumbnail / images are deliberately left null on import — Sericia
 *     refuses sloppy AI-generated or random Unsplash imagery (see global
 *     memory `feedback_no_sloppy_images.md`). The existing
 *     `upload-product-thumbnails.ts` script attaches real photography
 *     post-shoot via the same admin API path.
 *   • One variant per product by default. If a product needs multiple SKUs
 *     (sizes / grades), add a `variants` array in the JSON entry.
 *   • Categories: each entry references a slug from the four pre-seeded
 *     categories (tea / miso / mushroom / seasoning) via `category_handles`.
 *     New categories must be created via `categorize-products.ts` first.
 *   • Inventory: every variant gets 100 units at Tokyo (matches seed default)
 *     unless overridden per-variant.
 *   • Idempotent: products with an existing handle are skipped, NOT
 *     overwritten. To update fields, run a purpose-built migration script.
 *
 * Required environment:
 *   None (script runs inside Medusa container via `npx medusa exec`).
 *
 * Usage:
 *   npx medusa exec ./src/scripts/bulk-import-products.ts
 */

type BulkVariant = {
  title: string;
  sku: string;
  /** Default price in USD; FX-converted to all 8 currencies on import. */
  price_usd: number;
  weight_g: number;
  metadata?: Record<string, unknown>;
  /** Override default 100u/Tokyo. */
  inventory_quantity?: number;
};

type BulkProduct = {
  /** URL handle. Unique. Lowercase, hyphen-separated. */
  handle: string;
  title: string;
  /** Plain markdown — used by Storefront PDP fallback. Rich content lives in Payload ProductCopy global (overlay). */
  description: string;
  /** One of the seeded category handles. */
  category_handles?: string[];
  /** Free tags surfaced as metadata.tags (comma-joined). */
  tags?: string[];
  /** Country of origin metadata. */
  origin?: string;
  /** Producer metadata (free text). */
  producer?: string;
  /** When omitted, generates a single Standard variant from product-level price. */
  variants?: BulkVariant[];
  /** Used when variants is omitted. */
  price_usd?: number;
  /** Used when variants is omitted. */
  weight_g?: number;
  /** Status — defaults to PUBLISHED. */
  status?: "draft" | "published";
};

type BulkConfig = {
  /** All products to import (idempotent — existing handles skipped). */
  products: BulkProduct[];
};

function priceForAll(usdAmount: number) {
  return [
    { currency_code: "usd", amount: usdAmount },
    { currency_code: "jpy", amount: Math.round(usdAmount * 150) },
    { currency_code: "eur", amount: Math.round(usdAmount * 0.92) },
    { currency_code: "gbp", amount: Math.round(usdAmount * 0.79) },
    { currency_code: "cad", amount: Math.round(usdAmount * 1.37) },
    { currency_code: "aud", amount: Math.round(usdAmount * 1.53) },
    { currency_code: "sgd", amount: Math.round(usdAmount * 1.35) },
    { currency_code: "hkd", amount: Math.round(usdAmount * 7.82) },
  ];
}

export default async function bulkImportProducts({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const productModule = container.resolve(Modules.PRODUCT);
  const salesChannelModule = container.resolve(Modules.SALES_CHANNEL);
  const fulfillmentModule = container.resolve(Modules.FULFILLMENT);
  const stockLocationModule = container.resolve(Modules.STOCK_LOCATION);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  logger.info("=== Sericia bulk product import start ===");

  // ---------- 1. Load config ----------
  // Use cwd-relative path. Medusa runs scripts with cwd = /app, so the
  // products-bulk.json sits at ./src/scripts/products-bulk.json.
  // Avoid `import.meta.url` here — Medusa's TS compiler emits CJS but the
  // runtime treats `import.meta` calls as ESM, which trips
  // "exports is not defined in ES module scope".
  const configPath = resolve(process.cwd(), "src/scripts/products-bulk.json");
  let config: BulkConfig;
  try {
    const raw = readFileSync(configPath, "utf8");
    config = JSON.parse(raw) as BulkConfig;
  } catch (err) {
    logger.error(
      `[bulk-import] failed to read ${configPath}: ${(err as Error).message}`,
    );
    throw err;
  }
  logger.info(`[bulk-import] loaded ${config.products.length} product specs`);

  // ---------- 2. Resolve dependencies ----------
  const [salesChannel] = await (salesChannelModule as any).listSalesChannels({
    name: "Default Sericia",
  });
  if (!salesChannel) {
    throw new Error(
      "[bulk-import] 'Default Sericia' sales channel not found. Run seed.ts first.",
    );
  }

  const [shippingProfile] = await (fulfillmentModule as any).listShippingProfiles({
    name: "EMS Worldwide",
  });
  if (!shippingProfile) {
    throw new Error(
      "[bulk-import] 'EMS Worldwide' shipping profile not found. Run seed.ts first.",
    );
  }

  const [tokyoLocation] = await (stockLocationModule as any).listStockLocations({
    name: "Tokyo Fulfillment",
  });
  if (!tokyoLocation) {
    throw new Error(
      "[bulk-import] 'Tokyo Fulfillment' stock location not found. Run seed.ts first.",
    );
  }

  // Pre-load categories so we can resolve handles → ids without N requests.
  const { data: allCategories } = await query.graph({
    entity: "product_category",
    fields: ["id", "handle"],
  });
  const categoryByHandle = new Map<string, string>(
    allCategories.map((c: any) => [c.handle, c.id]),
  );

  // ---------- 3. Diff against existing handles (idempotency) ----------
  const existingProducts = await (productModule as any).listProducts({});
  const existingHandles = new Set<string>(
    existingProducts.map((p: any) => p.handle),
  );

  const toCreate = config.products.filter((p) => !existingHandles.has(p.handle));
  const toSkip = config.products.length - toCreate.length;
  if (toSkip > 0) {
    logger.info(
      `[bulk-import] skipping ${toSkip} products (handle already exists)`,
    );
  }
  if (toCreate.length === 0) {
    logger.info("[bulk-import] nothing to import — all products already present");
    return;
  }

  // ---------- 4. Build createProductsWorkflow input ----------
  const productsInput = toCreate.map((p) => {
    const variants =
      p.variants && p.variants.length > 0
        ? p.variants
        : [
            {
              title: "Standard",
              sku: `${p.handle.toUpperCase().replace(/-/g, "_")}-STD`,
              price_usd: p.price_usd ?? 0,
              weight_g: p.weight_g ?? 0,
              metadata: {},
            } satisfies BulkVariant,
          ];

    const categoryIds = (p.category_handles ?? [])
      .map((handle) => categoryByHandle.get(handle))
      .filter((id): id is string => Boolean(id));

    if ((p.category_handles ?? []).length > 0 && categoryIds.length === 0) {
      logger.warn(
        `[bulk-import] product ${p.handle}: none of category_handles resolved (${p.category_handles?.join(",")})`,
      );
    }

    return {
      title: p.title,
      handle: p.handle,
      description: p.description,
      // thumbnail intentionally undefined — see file header.
      status:
        p.status === "draft" ? ProductStatus.DRAFT : ProductStatus.PUBLISHED,
      sales_channels: [{ id: salesChannel.id }],
      categories: categoryIds.map((id) => ({ id })),
      options: [{ title: "Size", values: variants.map((v) => v.title) }],
      weight: p.weight_g ?? variants[0]?.weight_g ?? 100,
      metadata: {
        origin: p.origin ?? null,
        producer: p.producer ?? null,
        tags: p.tags?.join(",") ?? null,
      },
      variants: variants.map((v) => ({
        title: v.title,
        sku: v.sku,
        manage_inventory: true,
        prices: priceForAll(v.price_usd),
        options: { Size: v.title },
        metadata: {
          weight_g: v.weight_g,
          ...(v.metadata ?? {}),
        },
      })),
    };
  });

  // ---------- 5. Create ----------
  const { result: created } = await createProductsWorkflow(container).run({
    input: { products: productsInput },
  });
  logger.info(`[bulk-import] created ${created?.length ?? 0} products`);

  // ---------- 6. Link to shipping profile (each new product) ----------
  try {
    const links = (created ?? []).map((p: any) => ({
      [Modules.PRODUCT]: { product_id: p.id },
      [Modules.FULFILLMENT]: { shipping_profile_id: shippingProfile.id },
    }));
    if (links.length > 0) {
      await createLinksWorkflow(container).run({ input: links });
      logger.info(`[bulk-import] linked ${links.length} products to shipping profile`);
    }
  } catch (err) {
    // Don't block the rest of the import if link registration is missing —
    // operator can re-run after fixing the link config.
    logger.warn(
      `[bulk-import] shipping-profile link step skipped: ${(err as Error)?.message || err}`,
    );
  }

  // ---------- 7. Inventory levels (100u Tokyo by default) ----------
  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id", "sku"],
  });
  const skuToItemId = new Map<string, string>(
    inventoryItems.map((i: any) => [i.sku, i.id]),
  );

  const inventoryLevelsToCreate: Array<{
    inventory_item_id: string;
    location_id: string;
    stocked_quantity: number;
  }> = [];

  for (const p of toCreate) {
    const variants =
      p.variants && p.variants.length > 0
        ? p.variants
        : [
            {
              title: "Standard",
              sku: `${p.handle.toUpperCase().replace(/-/g, "_")}-STD`,
              price_usd: p.price_usd ?? 0,
              weight_g: p.weight_g ?? 0,
            } satisfies BulkVariant,
          ];

    for (const v of variants) {
      const inventoryItemId = skuToItemId.get(v.sku);
      if (!inventoryItemId) {
        logger.warn(
          `[bulk-import] inventory item not found for SKU ${v.sku} — skipping level`,
        );
        continue;
      }
      inventoryLevelsToCreate.push({
        inventory_item_id: inventoryItemId,
        location_id: tokyoLocation.id,
        stocked_quantity: v.inventory_quantity ?? 100,
      });
    }
  }

  if (inventoryLevelsToCreate.length > 0) {
    try {
      await createInventoryLevelsWorkflow(container).run({
        input: { inventory_levels: inventoryLevelsToCreate },
      });
      logger.info(
        `[bulk-import] created ${inventoryLevelsToCreate.length} inventory levels (100u/Tokyo each)`,
      );
    } catch (err) {
      logger.warn(
        `[bulk-import] inventory level creation partial failure: ${(err as Error)?.message || err}`,
      );
    }
  }

  logger.info("=== Sericia bulk product import complete ===");
}
