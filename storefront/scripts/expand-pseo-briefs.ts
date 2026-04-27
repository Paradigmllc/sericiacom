/**
 * Bulk pSEO brief expander.
 *
 * Generates the matrix of (Country × Product × Locale) briefs and bulk-inserts
 * into Supabase `sericia_pseo_briefs` so the existing `/api/pseo/generate`
 * worker can dequeue and produce articles at $0.014/1M (DeepSeek V3 cached).
 *
 * Why this script and not n8n: the matrix is structural — adding a country or
 * product is a one-line edit in this file, then re-run idempotent. n8n is great
 * for the per-article generation cron but bad for matrix expansion (the
 * cross-product is harder to reason about visually).
 *
 * Idempotency model:
 *   sericia_pseo_briefs has a partial unique index on (lower(topic), locale)
 *   for status in ('pending','processing','done'). On conflict we silently
 *   skip — re-running this script after adding a new country only inserts
 *   the new (country × N products × N locales) rows.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=...  \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *     npx tsx storefront/scripts/expand-pseo-briefs.ts
 *
 * Or via npm script (added to package.json):
 *   npm run pseo:expand
 *
 * Cost projection at full matrix (8 countries × 8 products × 10 locales = 640):
 *   - Brief insert: free (single bulk write).
 *   - Generation: 640 × $0.002 ≈ $1.28 total. Cache hit rate after the first
 *     ~5 articles is typically >85%, so the actual figure trends lower.
 */

import { createClient } from "@supabase/supabase-js";
import { COUNTRIES, PRODUCTS } from "../lib/pseo-matrix";

// All 10 supported locales — must match Payload + lib/pseo.ts PseoLocale union.
const LOCALES = ["en", "ja", "de", "fr", "es", "it", "ko", "zh-TW", "ru", "ar"] as const;
type Locale = (typeof LOCALES)[number];

// Per-locale localised topic phrasing. Native phrasing keeps the model in the
// right voice from sentence one rather than forcing it to translate a stiff
// English template. The brand and product names stay in Latin form.
const TOPIC_TEMPLATES: Record<Locale, (country: string, product: string) => string> = {
  en: (c, p) => `Buying authentic ${p} from Japan in ${c}: a guide`,
  ja: (c, p) => `${c}から本物の日本産${p}を購入するガイド`,
  de: (c, p) => `Echtes japanisches ${p} in ${c} kaufen: ein Leitfaden`,
  fr: (c, p) => `Acheter ${p} authentique du Japon en ${c} : un guide`,
  es: (c, p) => `Comprar ${p} auténtico de Japón en ${c}: una guía`,
  it: (c, p) => `Acquistare ${p} autentico dal Giappone in ${c}: una guida`,
  ko: (c, p) => `${c}에서 일본산 진짜 ${p} 구매하기 가이드`,
  "zh-TW": (c, p) => `在${c}購買日本正宗${p}的指南`,
  ru: (c, p) => `Покупка настоящего японского ${p} в ${c}: руководство`,
  ar: (c, p) => `شراء ${p} الياباني الأصلي في ${c}: دليل`,
};

type BriefRow = {
  topic: string;
  locale: Locale;
  keywords: string[];
  related_product_handle: string | null;
  cluster: string;
  grounding_facts: string[];
};

function buildMatrix(): BriefRow[] {
  const rows: BriefRow[] = [];
  for (const country of COUNTRIES) {
    for (const product of PRODUCTS) {
      for (const locale of LOCALES) {
        const topic = TOPIC_TEMPLATES[locale](country.name, product.name);
        rows.push({
          topic,
          locale,
          keywords: [
            product.slug,
            `japanese ${product.slug}`,
            `${product.slug} ${country.name}`,
            "import",
            "rescued",
            "sericia",
          ],
          // Map the matrix product slug → the Medusa handle that lives in the
          // catalogue. We map only when the bulk-import product has a clean
          // single match; the generator's grounding-facts block carries the
          // rest of the editorial context.
          related_product_handle: matchProductHandle(product.slug),
          // Cluster = "country×product" so Payload tags the article and the
          // article-list page can filter for cross-linking.
          cluster: `gtm-${country.code}-${product.slug}`,
          grounding_facts: groundingFacts(country.code, product.slug),
        });
      }
    }
  }
  return rows;
}

/** Best-effort mapping from matrix product slug → live Medusa product handle. */
function matchProductHandle(slug: string): string | null {
  switch (slug) {
    case "sencha":
      return "uji-sencha-100g";
    case "matcha":
      return "uji-matcha-ceremonial-30g";
    case "miso":
      return "aichi-mame-miso-500g";
    case "shiitake":
      return "oita-donko-shiitake-50g";
    case "dashi":
      return "kombu-rishiri-100g";
    case "yuzu":
      return "yuzu-kosho-green-100g";
    case "shichimi":
      return "shichimi-togarashi-50g";
    case "furikake":
      return null; // not in v1 catalogue — generator falls back to category context
    default:
      return null;
  }
}

/**
 * Concrete facts for each (country, product) cell. The generator's system prompt
 * forbids hallucination, so we feed shipping windows, regulatory notes, and
 * representative producer references the article can cite truthfully.
 */
function groundingFacts(country: string, productSlug: string): string[] {
  const facts: string[] = [];

  // Country-specific
  const countryFacts: Record<string, string[]> = {
    us: [
      "Sericia ships to all 50 US states via EMS, transit time 4–7 business days.",
      "FDA Prior Notice is filed automatically by Sericia for every US-bound parcel.",
      "Duties are calculated at destination; the storefront price is duty-exclusive.",
    ],
    uk: [
      "Post-Brexit imports require an EORI on commercial parcels; Sericia handles this for personal-volume orders.",
      "VAT is collected at import; the customer is the importer of record.",
      "Transit time London 3–6 business days via EMS to Royal Mail.",
    ],
    de: [
      "EU food import rules apply; dry, plant-based items are routinely cleared.",
      "DHL handles the last mile from Frankfurt customs; tracking continues uninterrupted.",
      "Transit time 4–7 business days.",
    ],
    fr: [
      "La Poste handles the last mile after EU customs in Roissy.",
      "VAT is settled at import; the customer is the importer of record.",
      "Transit time 4–7 business days.",
    ],
    au: [
      "Australian Quarantine and Inspection Service (AQIS) inspects food imports; Sericia ships only AQIS-eligible items.",
      "Australia Post completes the last mile from Sydney customs.",
      "Transit time 5–8 business days.",
    ],
    sg: [
      "Singapore Food Agency (SFA) clears commercial food imports; personal-volume orders pass without licence.",
      "SingPost completes the last mile.",
      "Transit time 3–5 business days.",
    ],
    ca: [
      "CFIA inspects food imports; dry, plant-based items pass routinely.",
      "Canada Post completes the last mile.",
      "Transit time 5–8 business days.",
    ],
    hk: [
      "FEHD oversees food imports; personal-volume parcels pass without licence.",
      "Hongkong Post completes the last mile.",
      "Transit time 2–4 business days.",
    ],
  };

  // Product-specific — kept conservative so the model has truthful anchors.
  const productFacts: Record<string, string[]> = {
    sencha: [
      "Sericia's sencha is sourced primarily from Yamane-en in Uji, Kyoto.",
      "Single-cultivar Yabukita, first-flush 2026 (ichibancha).",
      "Brewing: 70°C water, 2g leaf per 80ml, 45-second first infusion.",
    ],
    matcha: [
      "Stone-ground tencha from Uji, Kyoto.",
      "Ceremonial grade: shaded 21+ days; culinary grade: 14 days.",
      "Storage: airtight, refrigerated, used within 60 days of opening.",
    ],
    miso: [
      "Sericia's mame-miso is barrel-aged 24 months in cedar at Kurashige Jozoten in Aichi.",
      "Hatcho-miso (3-year aged) and shiro-miso (rice-koji, sweet) are stocked alongside.",
      "Best-before windows are 4+ months on every export shipment.",
    ],
    shiitake: [
      "Hand-dried on bamboo racks for five days at Yamagata Mori on the Kunisaki peninsula.",
      "Donko grade is thick-capped and slow-grown; Koshin grade is thinner and faster.",
      "Reconstitute in cold water for 4–8 hours for maximum umami extraction.",
    ],
    dashi: [
      "Rishiri kombu and Rausu kombu are the two main kelps Sericia stocks.",
      "Hand-shaved katsuobushi from Kagoshima is paired for awase-dashi.",
      "Vegan dashi: cold-water mushroom-stock cubes from Akita.",
    ],
    yuzu: [
      "Yuzu-kosho (green and red) is fermented with chili in Oita and Tokushima.",
      "Yuzu marmalade and yuzu-miso paste are stocked seasonally.",
      "Yuzu peel adds aroma at finishing temperature; never boil.",
    ],
    shichimi: [
      "Sericia's shichimi is house-blended weekly in Kyoto.",
      "Seven-spice composition: red chili, sansho, dried orange peel, sesame, nori, hemp seed, ginger.",
      "Sansho (Japanese pepper) is the citrus-tongue-tingling element non-Japanese blends miss.",
    ],
    furikake: [
      "Furikake is rice-seasoning sprinkle: nori flakes, sesame, dried bonito, salt.",
      "Stored airtight, away from humidity.",
      "Shelf life 6–12 months unopened.",
    ],
  };

  facts.push(...(countryFacts[country] ?? []));
  facts.push(...(productFacts[productSlug] ?? []));

  // Brand-baseline facts attached to every brief.
  facts.push(
    "Sericia is a Kyoto-based D2C that pays producers full retail price for rescued surplus.",
    "Drops are limited; once a drop is sold, the next is photographed within 3–4 weeks.",
  );

  return facts;
}

async function main(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "[expand-pseo-briefs] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
    );
    process.exit(1);
  }
  const supa = createClient(url, key);
  const rows = buildMatrix();

  console.log(`[expand-pseo-briefs] Matrix size: ${rows.length} briefs`);
  console.log(
    `[expand-pseo-briefs] (${COUNTRIES.length} countries × ${PRODUCTS.length} products × ${LOCALES.length} locales)`,
  );

  // Bulk insert. The unique partial index on (lower(topic), locale) for active
  // statuses returns a 23505 conflict per duplicate row — `ignoreDuplicates`
  // makes Supabase swallow them silently so re-runs are no-ops.
  const { data, error } = await supa
    .from("sericia_pseo_briefs")
    .upsert(
      rows.map((r) => ({
        topic: r.topic,
        locale: r.locale,
        keywords: r.keywords,
        related_product_handle: r.related_product_handle,
        cluster: r.cluster,
        grounding_facts: r.grounding_facts,
        status: "pending",
      })),
      { onConflict: "topic,locale", ignoreDuplicates: true },
    )
    .select("id");

  if (error) {
    console.error("[expand-pseo-briefs] Supabase upsert failed:", error.message);
    process.exit(1);
  }

  console.log(
    `[expand-pseo-briefs] OK. Inserted ${(data ?? []).length} new briefs (rest were duplicates).`,
  );
  console.log(
    `[expand-pseo-briefs] Next step: trigger n8n cron OR loop /api/pseo/generate to drain the queue.`,
  );
}

main().catch((e) => {
  console.error("[expand-pseo-briefs] fatal:", e);
  process.exit(1);
});
