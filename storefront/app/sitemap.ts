import type { MetadataRoute } from "next";
import { COUNTRIES, PRODUCTS } from "@/lib/pseo-matrix";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://sericia.com";
  const now = new Date();

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

  const tools = [
    "ems-calculator",
    "matcha-grade",
    "miso-finder",
    "shelf-life",
  ].map((t) => ({
    url: `${base}/tools/${t}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${base}/guides`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/tools`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    ...tools,
    ...guides,
  ];
}
