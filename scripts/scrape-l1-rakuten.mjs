#!/usr/bin/env node
/**
 * L1 Scraper: Rakuten Ichiba Item Search API for Japanese surplus/訳あり craft food.
 * Cheapest + cleanest source. Runs daily at 05:00 JST via n8n cron.
 * Uses affiliate ID so clickthroughs earn residual income.
 */
import { createClient } from "@supabase/supabase-js";

const APP_ID = process.env.RAKUTEN_APP_ID;
const AFFILIATE = process.env.RAKUTEN_AFFILIATE_ID;
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const QUERIES = [
  "訳あり 煎茶",
  "訳あり 抹茶",
  "訳あり 味噌",
  "訳あり 干し椎茸",
  "訳あり 出汁",
  "訳あり 柚子胡椒",
  "訳あり 七味",
  "訳あり ふりかけ",
  "食品ロス 日本茶",
  "賞味期限間近 味噌",
];

const ENDPOINT = "https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601";

async function searchRakuten(keyword) {
  const url = new URL(ENDPOINT);
  url.searchParams.set("applicationId", APP_ID);
  url.searchParams.set("affiliateId", AFFILIATE);
  url.searchParams.set("keyword", keyword);
  url.searchParams.set("genreId", "100227"); // 食品
  url.searchParams.set("hits", "30");
  url.searchParams.set("sort", "+itemPrice");
  url.searchParams.set("maxPrice", "3000");
  url.searchParams.set("availability", "1");
  url.searchParams.set("format", "json");

  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) {
    console.error(`[rakuten] ${keyword} failed ${res.status}`);
    return [];
  }
  const data = await res.json();
  return data.Items ?? [];
}

async function main() {
  let total = 0;
  for (const q of QUERIES) {
    const items = await searchRakuten(q);
    for (const { Item } of items) {
      if (!Item?.itemUrl || !Item?.itemName) continue;
      await supabase.from("sericia_candidates").upsert(
        {
          source: "rakuten",
          external_url: Item.affiliateUrl || Item.itemUrl,
          title: Item.itemName,
          price_jpy: Item.itemPrice,
          image_url: Item.mediumImageUrls?.[0]?.imageUrl ?? null,
          shop_name: Item.shopName,
          raw_data: Item,
          scraped_at: new Date().toISOString(),
        },
        { onConflict: "external_url" }
      );
      total++;
    }
    console.log(`[rakuten] ${q} → ${items.length}`);
    await new Promise((r) => setTimeout(r, 1100)); // Rakuten: 1 req/sec
  }
  console.log(`[rakuten] total ${total} candidates upserted`);
}

main().catch((e) => {
  console.error("[rakuten] fatal", e);
  process.exit(1);
});
