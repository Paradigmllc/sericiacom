import { CreateInventoryLevelInput, ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createApiKeysWorkflow,
  createInventoryLevelsWorkflow,
  createLinksWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows";

/**
 * Sericia seed — full bootstrap:
 *  - 9 regions (JP/US/EU/GB/CA/AU/SG/HK/ME)
 *  - Tax regions: all countries registered (rates default 0; JP 10% set via admin or separate call)
 *  - Sales channel: "Default Sericia"
 *  - Stock location: "Tokyo Fulfillment"
 *  - Shipping profile: "EMS Worldwide"
 *  - Shipping options per region: flat EMS rate + free-over-$200 tier
 *  - 4 products: Sencha / Miso / Shiitake (standalone) + Drop #1 bundle
 *  - Inventory: 100 units per variant at Tokyo
 *  - Publishable API key "Sericia Storefront" linked to default sales channel
 *
 * Idempotent: re-running will skip already-seeded entities where possible.
 *
 * Usage: npx medusa exec ./src/scripts/seed.ts
 */
export default async function seedSericia({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillmentModule = container.resolve(Modules.FULFILLMENT);
  const salesChannelModule = container.resolve(Modules.SALES_CHANNEL);
  const storeModule = container.resolve(Modules.STORE);
  const regionModule = container.resolve(Modules.REGION);
  const stockLocationModule = container.resolve(Modules.STOCK_LOCATION);
  const productModule = container.resolve(Modules.PRODUCT);

  logger.info("=== Sericia seed start ===");

  // ---------- 0. Store: sales channel + currencies ----------
  const [store] = await (storeModule as any).listStores();

  let defaultSalesChannels = await (salesChannelModule as any).listSalesChannels({
    name: "Default Sericia",
  });

  if (!defaultSalesChannels.length) {
    // Rename existing "Default Sales Channel" if present
    const existing = await (salesChannelModule as any).listSalesChannels({
      name: "Default Sales Channel",
    });
    if (existing.length) {
      await (salesChannelModule as any).updateSalesChannels(existing[0].id, {
        name: "Default Sericia",
      });
      defaultSalesChannels = [{ ...existing[0], name: "Default Sericia" }];
      logger.info("[store] renamed existing default sales channel to 'Default Sericia'");
    } else {
      const { result } = await createSalesChannelsWorkflow(container).run({
        input: {
          salesChannelsData: [{ name: "Default Sericia" }],
        },
      });
      defaultSalesChannels = result;
      logger.info("[store] created 'Default Sericia' sales channel");
    }
  }

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        supported_currencies: [
          { currency_code: "usd", is_default: true },
          { currency_code: "jpy" },
          { currency_code: "eur" },
          { currency_code: "gbp" },
          { currency_code: "cad" },
          { currency_code: "aud" },
          { currency_code: "sgd" },
          { currency_code: "hkd" },
        ],
        default_sales_channel_id: defaultSalesChannels[0].id,
      },
    },
  });
  logger.info("[store] supported_currencies + default sales channel set");

  // ---------- 1. Regions (9 total) ----------
  logger.info("[regions] seeding...");
  const regionSpecs = [
    { name: "Japan", currency_code: "jpy", countries: ["jp"] },
    { name: "United States", currency_code: "usd", countries: ["us"] },
    {
      name: "Europe",
      currency_code: "eur",
      countries: ["de", "fr", "it", "es", "nl", "be", "at", "pt", "ie", "fi", "gr"],
    },
    { name: "United Kingdom", currency_code: "gbp", countries: ["gb"] },
    { name: "Canada", currency_code: "cad", countries: ["ca"] },
    { name: "Australia", currency_code: "aud", countries: ["au", "nz"] },
    { name: "Singapore", currency_code: "sgd", countries: ["sg"] },
    { name: "Hong Kong", currency_code: "hkd", countries: ["hk"] },
    {
      name: "Middle East",
      currency_code: "usd",
      countries: ["ae", "sa", "qa", "kw", "bh", "om"],
    },
  ];

  const existingRegions = await (regionModule as any).listRegions({});
  const existingRegionNames = new Set(existingRegions.map((r: any) => r.name));

  const regionsToCreate = regionSpecs
    .filter((r) => !existingRegionNames.has(r.name))
    .map((r) => ({
      name: r.name,
      currency_code: r.currency_code,
      countries: r.countries,
      payment_providers: ["pp_system_default"],
    }));

  if (regionsToCreate.length > 0) {
    await createRegionsWorkflow(container).run({ input: { regions: regionsToCreate } });
    logger.info(`[regions] created ${regionsToCreate.length} new regions`);
  } else {
    logger.info("[regions] all 9 regions already exist, skipping");
  }
  const allRegions = await (regionModule as any).listRegions({});
  const regionByName = new Map<string, any>(allRegions.map((r: any) => [r.name, r]));

  // ---------- 2. Tax regions ----------
  logger.info("[tax] seeding tax regions...");
  const allCountries = regionSpecs.flatMap((r) => r.countries);
  try {
    await createTaxRegionsWorkflow(container).run({
      input: allCountries.map((country_code) => ({
        country_code,
        provider_id: "tp_system",
      })),
    });
    logger.info(`[tax] ${allCountries.length} tax regions created (0% default; set JP=10% via admin)`);
  } catch (e) {
    logger.warn(`[tax] partial/duplicate: ${(e as Error).message.slice(0, 200)}`);
  }

  // ---------- 3. Stock Location ----------
  logger.info("[location] seeding Tokyo Fulfillment...");
  let tokyoLocations = await (stockLocationModule as any).listStockLocations({
    name: "Tokyo Fulfillment",
  });
  if (!tokyoLocations.length) {
    const { result } = await createStockLocationsWorkflow(container).run({
      input: {
        locations: [
          {
            name: "Tokyo Fulfillment",
            address: {
              city: "Tokyo",
              country_code: "JP",
              address_1: "Origin",
            },
          },
        ],
      },
    });
    tokyoLocations = result;
    logger.info("[location] created Tokyo Fulfillment");
  }
  const tokyoLocation = tokyoLocations[0];

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: { default_location_id: tokyoLocation.id },
    },
  });

  // Link stock location -> manual fulfillment provider
  try {
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: tokyoLocation.id },
      [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
    });
  } catch (e) {
    // likely already linked; ignore
  }

  // ---------- 4. Shipping Profile ----------
  logger.info("[profile] seeding EMS Worldwide shipping profile...");
  let shippingProfiles = await (fulfillmentModule as any).listShippingProfiles({
    name: "EMS Worldwide",
  });
  if (!shippingProfiles.length) {
    const { result } = await createShippingProfilesWorkflow(container).run({
      input: {
        data: [{ name: "EMS Worldwide", type: "default" }],
      },
    });
    shippingProfiles = result;
    logger.info("[profile] created EMS Worldwide");
  }
  const shippingProfile = shippingProfiles[0];

  // ---------- 5. Fulfillment Set + Service Zones ----------
  logger.info("[fulfillment] ensuring fulfillment set + service zones...");
  let fulfillmentSets = await (fulfillmentModule as any).listFulfillmentSets(
    { name: "Sericia EMS Fulfillment" },
    { relations: ["service_zones"] }
  );
  let fulfillmentSet = fulfillmentSets[0];
  if (!fulfillmentSet) {
    fulfillmentSet = await (fulfillmentModule as any).createFulfillmentSets({
      name: "Sericia EMS Fulfillment",
      type: "shipping",
      service_zones: regionSpecs.map((r) => ({
        name: `EMS - ${r.name}`,
        geo_zones: r.countries.map((c) => ({ country_code: c, type: "country" })),
      })),
    });
    logger.info("[fulfillment] created Sericia EMS Fulfillment with 9 service zones");
  }
  const zoneByName = new Map<string, any>(
    (fulfillmentSet.service_zones || []).map((z: any) => [z.name, z])
  );

  try {
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: tokyoLocation.id },
      [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
    });
  } catch (e) {
    // ignore duplicate
  }

  // ---------- 6. Shipping Options ----------
  logger.info("[shipping] seeding shipping options per region...");
  const flatPriceMap: Record<string, number> = {
    usd: 1800, // $18
    eur: 1700,
    gbp: 1500,
    cad: 2400,
    aud: 2700,
    sgd: 2400,
    hkd: 14000,
    jpy: 0, // Japan internal: free
  };
  const freeThresholdMap: Record<string, number> = {
    usd: 20000,
    eur: 19000,
    gbp: 16000,
    cad: 27000,
    aud: 30000,
    sgd: 27000,
    hkd: 156000,
    jpy: 0,
  };

  const existingShippingOpts = await (fulfillmentModule as any).listShippingOptions({});
  const existingOptNames = new Set(existingShippingOpts.map((o: any) => o.name));
  const shippingOptionInputs: any[] = [];

  for (const r of regionSpecs) {
    const zone = zoneByName.get(`EMS - ${r.name}`);
    if (!zone) {
      logger.warn(`[shipping] no zone for ${r.name}, skipping`);
      continue;
    }
    const region = regionByName.get(r.name);
    if (!region) {
      logger.warn(`[shipping] no region obj for ${r.name}, skipping`);
      continue;
    }
    const flatPrice = flatPriceMap[r.currency_code] ?? 1800;

    const standardName = `EMS Standard - ${r.name}`;
    if (!existingOptNames.has(standardName)) {
      shippingOptionInputs.push({
        name: standardName,
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: zone.id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "EMS Standard",
          description: "EMS international shipping from Tokyo",
          code: "ems_standard",
        },
        prices: [
          { currency_code: r.currency_code, amount: flatPrice },
          { region_id: region.id, amount: flatPrice },
        ],
        rules: [
          { attribute: "enabled_in_store", value: "true", operator: "eq" },
          { attribute: "is_return", value: "false", operator: "eq" },
        ],
      });
    }

    // Free-over-$200 option (skip JP since JP is already free)
    if (r.currency_code !== "jpy") {
      const freeName = `EMS Free Shipping over $200 - ${r.name}`;
      if (!existingOptNames.has(freeName)) {
        shippingOptionInputs.push({
          name: freeName,
          price_type: "flat",
          provider_id: "manual_manual",
          service_zone_id: zone.id,
          shipping_profile_id: shippingProfile.id,
          type: {
            label: "Free Shipping (over $200)",
            description: "Free EMS shipping for orders over $200 equivalent",
            code: "ems_free_over_200",
          },
          prices: [
            { currency_code: r.currency_code, amount: 0 },
            { region_id: region.id, amount: 0 },
          ],
          rules: [
            { attribute: "enabled_in_store", value: "true", operator: "eq" },
            { attribute: "is_return", value: "false", operator: "eq" },
            {
              attribute: "item_total",
              value: String(freeThresholdMap[r.currency_code] || 20000),
              operator: "gte",
            },
          ],
        });
      }
    }
  }

  if (shippingOptionInputs.length > 0) {
    try {
      await createShippingOptionsWorkflow(container).run({ input: shippingOptionInputs });
      logger.info(`[shipping] created ${shippingOptionInputs.length} shipping options`);
    } catch (e) {
      logger.warn(`[shipping] error: ${(e as Error).message.slice(0, 300)}`);
    }
  } else {
    logger.info("[shipping] all shipping options already exist");
  }

  // Link default sales channel -> stock location
  try {
    await linkSalesChannelsToStockLocationWorkflow(container).run({
      input: {
        id: tokyoLocation.id,
        add: [defaultSalesChannels[0].id],
      },
    });
  } catch (e) {
    // ignore duplicate
  }

  // ---------- 7. Publishable API key ----------
  logger.info("[apiKey] ensuring publishable API key...");
  let publishableApiKey: any = null;
  const { data: apiKeyData } = await query.graph({
    entity: "api_key",
    fields: ["id", "title", "type", "token"],
    filters: { type: "publishable" },
  });
  publishableApiKey = apiKeyData?.[0];

  if (!publishableApiKey) {
    const { result } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [
          { title: "Sericia Storefront", type: "publishable", created_by: "" },
        ],
      },
    });
    publishableApiKey = result[0];
    logger.info(`[apiKey] created publishable API key: ${publishableApiKey.token}`);
  } else {
    logger.info(`[apiKey] re-using existing publishable API key: ${publishableApiKey.token}`);
  }

  try {
    await linkSalesChannelsToApiKeyWorkflow(container).run({
      input: {
        id: publishableApiKey.id,
        add: [defaultSalesChannels[0].id],
      },
    });
  } catch (e) {
    // ignore duplicate
  }

  // ---------- 8. Products (4 total) ----------
  logger.info("[products] seeding 4 products...");

  // Approximate FX rates vs USD (rounded, integer minor units per currency).
  // JPY is zero-decimal; others are minor units (cents).
  const priceForAll = (usdAmount: number) => [
    { currency_code: "usd", amount: usdAmount },
    { currency_code: "jpy", amount: Math.round(usdAmount * 150) },
    { currency_code: "eur", amount: Math.round(usdAmount * 0.92) },
    { currency_code: "gbp", amount: Math.round(usdAmount * 0.79) },
    { currency_code: "cad", amount: Math.round(usdAmount * 1.37) },
    { currency_code: "aud", amount: Math.round(usdAmount * 1.53) },
    { currency_code: "sgd", amount: Math.round(usdAmount * 1.35) },
    { currency_code: "hkd", amount: Math.round(usdAmount * 7.82) },
  ];

  const productSpecs = [
    {
      title: "Single-Origin Sencha (Rescued)",
      handle: "product-sencha",
      description:
        "Rescued near-expiry single-origin sencha from a small Shizuoka cooperative. Same vibrant first-flush quality, half the waste. Vacuum-sealed.",
      weight: 200,
      options: [{ title: "Size", values: ["100g", "200g"] }],
      variants: [
        {
          title: "100g",
          sku: "SENCHA-100G",
          manage_inventory: true,
          prices: priceForAll(38),
          options: { Size: "100g" },
          metadata: {
            origin: "Shizuoka",
            producer: "Small cooperative",
            shelf_life_days: 180,
            ems_bracket: "200g",
            weight_g: 100,
          },
        },
        {
          title: "200g",
          sku: "SENCHA-200G",
          manage_inventory: true,
          prices: priceForAll(68),
          options: { Size: "200g" },
          metadata: {
            origin: "Shizuoka",
            producer: "Small cooperative",
            shelf_life_days: 180,
            ems_bracket: "500g",
            weight_g: 200,
          },
        },
      ],
    },
    {
      title: "Barrel-Aged Miso (Rescued)",
      handle: "product-miso",
      description:
        "Two-year barrel-aged miso from Nagano. Unpasteurised, deeply umami. Rescued from retail disposal as it nears best-before.",
      weight: 750,
      options: [{ title: "Size", values: ["500g", "1kg"] }],
      variants: [
        {
          title: "500g",
          sku: "MISO-500G",
          manage_inventory: true,
          prices: priceForAll(28),
          options: { Size: "500g" },
          metadata: {
            age_months: 24,
            origin: "Nagano",
            shelf_life_days: 365,
            ems_bracket: "500g",
            weight_g: 500,
          },
        },
        {
          title: "1kg",
          sku: "MISO-1KG",
          manage_inventory: true,
          prices: priceForAll(48),
          options: { Size: "1kg" },
          metadata: {
            age_months: 24,
            origin: "Nagano",
            shelf_life_days: 365,
            ems_bracket: "1kg",
            weight_g: 1000,
          },
        },
      ],
    },
    {
      title: "Hand-Dried Donko Shiitake (Rescued)",
      handle: "product-shiitake",
      description:
        "Hand-dried Donko grade shiitake from Oita. Thick caps, deeply savoury. Rescued as graded 'irregular' by the cooperative.",
      weight: 100,
      options: [{ title: "Size", values: ["50g", "150g"] }],
      variants: [
        {
          title: "50g",
          sku: "SHIITAKE-50G",
          manage_inventory: true,
          prices: priceForAll(32),
          options: { Size: "50g" },
          metadata: {
            grade: "Donko",
            origin: "Oita",
            shelf_life_days: 365,
            ems_bracket: "200g",
            weight_g: 50,
          },
        },
        {
          title: "150g",
          sku: "SHIITAKE-150G",
          manage_inventory: true,
          prices: priceForAll(78),
          options: { Size: "150g" },
          metadata: {
            grade: "Donko",
            origin: "Oita",
            shelf_life_days: 365,
            ems_bracket: "500g",
            weight_g: 150,
          },
        },
      ],
    },
    {
      title: "Sericia Drop #1 - Sencha x Miso x Dried Shiitake",
      handle: "drop-001-tea-miso-shiitake",
      description:
        "Rescued from Japanese producers before disposal. Near-expiry craft sencha, barrel-aged miso, and hand-dried shiitake - same quality, half the waste. $95 fixed USD, limited drop.",
      weight: 480,
      options: [{ title: "Bundle", values: ["Standard"] }],
      variants: [
        {
          title: "Standard Bundle",
          sku: "DROP-001-STD",
          manage_inventory: true,
          prices: priceForAll(95),
          options: { Bundle: "Standard" },
          metadata: {
            weight_g: 480,
            ems_bracket: "500g",
            shipping_jpy: 2150,
            shelf_life_days: 90,
          },
        },
      ],
    },
  ];

  const existingProducts = await (productModule as any).listProducts({});
  const existingHandles = new Set(existingProducts.map((p: any) => p.handle));
  const productsToCreate = productSpecs.filter((p) => !existingHandles.has(p.handle));

  if (productsToCreate.length > 0) {
    const { result: createdProducts } = await createProductsWorkflow(container).run({
      input: {
        products: productsToCreate.map((p) => ({
          ...p,
          status: ProductStatus.PUBLISHED,
          // shipping_profile_id is NOT a column on the product table in Medusa v2.4.
          // The association is a module link (Modules.PRODUCT ↔ Modules.FULFILLMENT).
          // It's created below via createLinksWorkflow after the products exist.
          sales_channels: [{ id: defaultSalesChannels[0].id }],
        })),
      },
    });
    logger.info(`[products] created ${productsToCreate.length} products`);

    // Link each new product to the EMS Worldwide shipping profile.
    const productProfileLinks = (createdProducts ?? []).map((p: any) => ({
      [Modules.PRODUCT]: { product_id: p.id },
      [Modules.FULFILLMENT]: { shipping_profile_id: shippingProfile.id },
    }));
    if (productProfileLinks.length > 0) {
      await createLinksWorkflow(container).run({ input: productProfileLinks });
      logger.info(`[products] linked ${productProfileLinks.length} products to shipping profile`);
    }
  } else {
    logger.info("[products] all 4 products already present");

    // Idempotency: ensure each existing product is still linked to the shipping profile.
    // If the link already exists, createRemoteLinkStep is a no-op by design.
    try {
      const productProfileLinks = existingProducts
        .filter((p: any) => productSpecs.some((s) => s.handle === p.handle))
        .map((p: any) => ({
          [Modules.PRODUCT]: { product_id: p.id },
          [Modules.FULFILLMENT]: { shipping_profile_id: shippingProfile.id },
        }));
      if (productProfileLinks.length > 0) {
        await createLinksWorkflow(container).run({ input: productProfileLinks });
        logger.info(`[products] re-asserted ${productProfileLinks.length} product→shipping-profile links`);
      }
    } catch (e: any) {
      logger.warn(`[products] link re-assert skipped: ${e?.message || e}`);
    }
  }

  // ---------- 9. Inventory Levels ----------
  logger.info("[inventory] seeding inventory levels (100 per variant at Tokyo)...");
  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id", "sku"],
  });

  // Skip items that already have a level at Tokyo
  const { data: existingLevels } = await query.graph({
    entity: "inventory_level",
    fields: ["id", "location_id", "inventory_item_id"],
  });
  const existingAtTokyo = new Set(
    existingLevels
      .filter((l: any) => l.location_id === tokyoLocation.id)
      .map((l: any) => l.inventory_item_id)
  );

  const inventoryLevels: CreateInventoryLevelInput[] = [];
  for (const item of inventoryItems) {
    if (existingAtTokyo.has(item.id)) continue;
    inventoryLevels.push({
      location_id: tokyoLocation.id,
      stocked_quantity: 100,
      inventory_item_id: item.id,
    });
  }

  if (inventoryLevels.length > 0) {
    await createInventoryLevelsWorkflow(container).run({
      input: { inventory_levels: inventoryLevels },
    });
    logger.info(`[inventory] created ${inventoryLevels.length} inventory levels`);
  } else {
    logger.info("[inventory] all inventory items already leveled at Tokyo");
  }

  logger.info("=== Sericia seed done ===");
  logger.info(`Publishable API key for storefront: ${publishableApiKey.token || publishableApiKey.id}`);
}
