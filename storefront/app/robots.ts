import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/checkout", "/pay/", "/thank-you"],
      },
    ],
    sitemap: "https://sericia.com/sitemap.xml",
    host: "https://sericia.com",
  };
}
