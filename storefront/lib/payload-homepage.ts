/**
 * Payload Homepage global — editor-controlled SEO & content.
 *
 * Scope: fetches the `homepage` global via Payload local API and returns
 * narrowly-typed slices (SEO, blocks) that Next.js page layers consume.
 *
 * Design:
 *   • Silent-fallback on all errors — a Payload outage should NEVER 500 the
 *     homepage. The hardcoded app/layout.tsx metadata is the fallback.
 *   • Thin shape: only expose the fields the storefront actually reads.
 *     Avoids leaking Payload's deep type tree into UI components.
 *   • `depth: 1` on the query so `ogImage` arrives as a resolved Media
 *     object (not just an ID).
 */

import type { Metadata } from "next";
import { getPayloadClient } from "./payload";

type HomepageMeta = {
  title: string | null;
  description: string | null;
  ogImageUrl: string | null;
};

export async function getHomepageMeta(): Promise<HomepageMeta> {
  try {
    const payload = await getPayloadClient();
    const doc = await payload.findGlobal({
      slug: "homepage",
      depth: 1,
    });

    const seo = doc?.seo ?? {};
    const ogImage = seo.ogImage;
    const ogImageUrl =
      typeof ogImage === "object" && ogImage !== null && "url" in ogImage
        ? ogImage.url ?? null
        : null;

    return {
      title: seo.metaTitle?.trim() || null,
      description: seo.metaDescription?.trim() || null,
      ogImageUrl,
    };
  } catch (err) {
    console.error("[getHomepageMeta] failed, using layout defaults", err);
    return { title: null, description: null, ogImageUrl: null };
  }
}

/**
 * Compose a Next.js Metadata overlay from editor-controlled Payload homepage SEO.
 * Returns an empty object if Payload has no overrides — letting layout.tsx
 * defaults take over.
 */
export async function buildHomepageMetadata(): Promise<Metadata> {
  const meta = await getHomepageMeta();
  const overlay: Metadata = {};
  if (meta.title) {
    overlay.title = meta.title;
  }
  if (meta.description) {
    overlay.description = meta.description;
  }
  if (meta.title || meta.description || meta.ogImageUrl) {
    overlay.openGraph = {
      ...(meta.title && { title: meta.title }),
      ...(meta.description && { description: meta.description }),
      ...(meta.ogImageUrl && {
        images: [{ url: meta.ogImageUrl, width: 1200, height: 630, alt: meta.title ?? "Sericia" }],
      }),
    };
    overlay.twitter = {
      card: "summary_large_image",
      ...(meta.title && { title: meta.title }),
      ...(meta.description && { description: meta.description }),
      ...(meta.ogImageUrl && { images: [meta.ogImageUrl] }),
    };
  }
  return overlay;
}
