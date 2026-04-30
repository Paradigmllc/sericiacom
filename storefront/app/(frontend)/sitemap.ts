import type { MetadataRoute } from "next";
import {
  COUNTRIES,
  PRODUCTS,
  USE_CASES,
  buildComparePairs,
} from "@/lib/pseo-matrix";
import { JOURNAL } from "@/lib/journal";
import { listActiveProducts } from "@/lib/products";

/**
 * XML sitemap — consumed by Google, Bing, and now AI search engines
 * (Perplexity, ChatGPT Browse, Gemini) which use sitemap.xml as a canonical
 * crawl seed. Paired with /sitemap (human-readable HTML) at app/sitemap/page.tsx.
 *
 * Resilience: Medusa fetches are wrapped in try/catch so a temporary catalog
 * outage never fails the build — sitemap ships with static routes at minimum.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://sericia.com";
  const now = new Date();

  // Dynamic — Medusa-backed product catalogue
  let productEntries: MetadataRoute.Sitemap = [];
  try {
    const products = await listActiveProducts();
    productEntries = products.map((p) => ({
      url: `${base}/products/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }));
  } catch (e) {
    // Medusa unreachable during build — ship sitemap with static entries only
    console.error("[sitemap] listActiveProducts failed:", e);
  }

  // pSEO guides — 8 countries × 8 products = 64 URLs
  const guides = COUNTRIES.flatMap((c) =>
    PRODUCTS.map((p) => ({
      url: `${base}/guides/${c.code}/${p.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
      alternates: {
        languages: Object.fromEntries(
          COUNTRIES.map((cc) => [cc.locale, `${base}/guides/${cc.code}/${p.slug}`])
        ),
      },
    }))
  );

  // Free tools
  const tools = [
    "ems-calculator",
    "matcha-grade",
    "miso-finder",
    "shelf-life",
    "dashi-ratio",
    "tea-brewer",
    "shiitake-rehydrate",
    "yuzu-substitute",
  ].map((t) => ({
    url: `${base}/tools/${t}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // Journal articles
  const journal = JOURNAL.map((a) => ({
    url: `${base}/journal/${a.slug}`,
    lastModified: new Date(a.published),
    changeFrequency: "monthly" as const,
    priority: 0.65,
  }));

  // Static brand pages
  const staticBrand = [
    { path: "/about", priority: 0.8, freq: "monthly" as const },
    { path: "/sitemap", priority: 0.5, freq: "weekly" as const },
    { path: "/accessibility", priority: 0.4, freq: "yearly" as const },
    { path: "/faq", priority: 0.7, freq: "monthly" as const },
  ].map((s) => ({
    url: `${base}${s.path}`,
    lastModified: now,
    changeFrequency: s.freq,
    priority: s.priority,
  }));

  // Legal / policy pages
  const staticLegal = [
    "/privacy",
    "/terms",
    "/refund",
    "/shipping",
    "/tokushoho",
  ].map((p) => ({
    url: `${base}${p}`,
    lastModified: now,
    changeFrequency: "yearly" as const,
    priority: 0.4,
  }));

  // F40 — Zapier-style pSEO permutation routes.
  //  /compare/[a]/[b]  pairwise product comparisons (66 base URLs)
  //  /uses/[product]/[case] use-case guides (12 × 6 = 72 base URLs)
  // Both render server-side from generateStaticParams, no Payload needed
  // at build time, no Postgres, no Crossmint. Pure permutation pages
  // designed to flood AI search engines with long-tail "X vs Y" /
  // "X for Y" intent matches.
  const compares = buildComparePairs().map(([a, b]) => ({
    url: `${base}/compare/${a}/${b}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  const uses = PRODUCTS.flatMap((p) =>
    USE_CASES.map((u) => ({
      url: `${base}/uses/${p.slug}/${u.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  );

  return [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${base}/products`, lastModified: now, changeFrequency: "daily", priority: 0.95 },
    { url: `${base}/guides`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/tools`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/journal`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    ...productEntries,
    ...tools,
    ...guides,
    ...compares,
    ...uses,
    ...journal,
    ...staticBrand,
    ...staticLegal,
  ];
}
