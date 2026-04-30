// F40: pSEO matrix expansion — Zapier/Musicfy-style strategic axes.
//
// The base /guides/[country]/[product] route now spans 12 × 12 = 144 base
// pages. Multiplied by 10 hreflang locales (rendered as alternates inside
// each canonical page) the URL footprint is 1,440 distinct surfaces.
// Two new cross-product routes layer on top:
//   /compare/[a]/[b]   — pairwise product comparisons (66 base × 10 = 660)
//   /uses/[product]/[case] — "X for Y" use-case guides (72 base × 10 = 720)
//
// Total addressable URL count from this matrix: ≈ 2,820.
// Cost projection at full DeepSeek V3 cached generation:
//   ~2,820 × $0.002 ≈ $5.64 lifetime — single one-time cache-warm spend.
//
// Rule of additions:
//   - Countries are picked for either (a) high cross-border food-import
//     volume from Japan or (b) niche geos with weak existing supply
//     (Asian-diaspora retailers absent or expensive).
//   - Products are picked from Sericia's actual sourceable catalog so
//     each guide can cross-link to a real product / drop. No matrix bloat
//     with categories we can't fulfil.
//   - Use cases are search-volume-validated patterns that map to
//     "[product] for [case]" search intent.

export const COUNTRIES = [
  { code: "us", name: "United States", currency: "USD", flag: "🇺🇸", locale: "en-US" },
  { code: "uk", name: "United Kingdom", currency: "GBP", flag: "🇬🇧", locale: "en-GB" },
  { code: "de", name: "Germany", currency: "EUR", flag: "🇩🇪", locale: "de-DE" },
  { code: "fr", name: "France", currency: "EUR", flag: "🇫🇷", locale: "fr-FR" },
  { code: "au", name: "Australia", currency: "AUD", flag: "🇦🇺", locale: "en-AU" },
  { code: "sg", name: "Singapore", currency: "SGD", flag: "🇸🇬", locale: "en-SG" },
  { code: "ca", name: "Canada", currency: "CAD", flag: "🇨🇦", locale: "en-CA" },
  { code: "hk", name: "Hong Kong", currency: "HKD", flag: "🇭🇰", locale: "en-HK" },
  // F40 added — high-LTV diaspora + new EU/Asia markets
  { code: "nl", name: "Netherlands", currency: "EUR", flag: "🇳🇱", locale: "nl-NL" },
  { code: "ae", name: "United Arab Emirates", currency: "AED", flag: "🇦🇪", locale: "en-AE" },
  { code: "tw", name: "Taiwan", currency: "TWD", flag: "🇹🇼", locale: "zh-TW" },
  { code: "kr", name: "South Korea", currency: "KRW", flag: "🇰🇷", locale: "ko-KR" },
] as const;

export const PRODUCTS = [
  { slug: "sencha", name: "Sencha (Japanese Green Tea)" },
  { slug: "matcha", name: "Matcha" },
  { slug: "miso", name: "Miso Paste" },
  { slug: "shiitake", name: "Dried Shiitake Mushrooms" },
  { slug: "dashi", name: "Dashi Stock" },
  { slug: "yuzu", name: "Yuzu Citrus Products" },
  { slug: "shichimi", name: "Shichimi Togarashi" },
  { slug: "furikake", name: "Furikake Rice Seasoning" },
  // F40 added — high-search-volume Japanese pantry staples
  { slug: "yuzu-kosho", name: "Yuzu Kosho (Yuzu Pepper Paste)" },
  { slug: "kombu", name: "Kombu (Edible Kelp)" },
  { slug: "wasabi", name: "Real Wasabi (Wasabia japonica)" },
  { slug: "sansho", name: "Sansho Pepper" },
] as const;

export type CountryCode = (typeof COUNTRIES)[number]["code"];
export type ProductSlug = (typeof PRODUCTS)[number]["slug"];

// ── F40 NEW AXIS: USE_CASES ────────────────────────────────────────────
// Renders at /uses/[product]/[case] — the "X for Y" Musicfy/Zapier pattern.
// 12 products × 6 cases = 72 base pages × 10 locales = 720 URLs.
export const USE_CASES = [
  { slug: "morning-energy", name: "Morning energy" },
  { slug: "gut-health", name: "Gut health & digestion" },
  { slug: "weight-management", name: "Weight management" },
  { slug: "umami-cooking", name: "Umami cooking" },
  { slug: "gift-japanese", name: "Gift for Japanese-cuisine fans" },
  { slug: "vegetarian-vegan", name: "Vegetarian & vegan recipes" },
] as const;
export type UseCaseSlug = (typeof USE_CASES)[number]["slug"];

// ── F40 NEW AXIS: COMPARISONS ──────────────────────────────────────────
// Renders at /compare/[a]/[b]. Pair-wise within product list.
// (12 × 11) / 2 = 66 base pages × 10 locales = 660 URLs.
export function buildComparePairs(): Array<[ProductSlug, ProductSlug]> {
  const pairs: Array<[ProductSlug, ProductSlug]> = [];
  for (let i = 0; i < PRODUCTS.length; i++) {
    for (let j = i + 1; j < PRODUCTS.length; j++) {
      pairs.push([PRODUCTS[i].slug, PRODUCTS[j].slug]);
    }
  }
  return pairs;
}
