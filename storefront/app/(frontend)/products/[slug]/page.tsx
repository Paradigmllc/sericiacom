import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Container, Rule } from "@/components/ui";
import { getProductBySlug, listActiveProducts, categoryLabel } from "@/lib/products";
import { getCurrentDrop } from "@/lib/drops";
import ProductCard from "@/components/ProductCard";
import FadeIn from "@/components/FadeIn";
import DropCountdown from "@/components/DropCountdown";
import ProductDetailShell from "./ProductDetailShell";
import {
  RecentlyViewedTracker,
  RecentlyViewedSection,
} from "@/components/RecentlyViewed";
import SamplerBanner from "@/components/SamplerBanner";

const SITE_URL = "https://sericia.com";

// PDP cache window: 30s. Stock-remaining badges ("Only 3 left") tolerate a
// 30s lag — by the time anyone races to checkout the cart endpoint
// re-validates inventory live. Without this every PDP visit re-fetched both
// the product and listActiveProducts() (used for "Recommended pairings"),
// which exhausted the storefront's 3GB heap during traffic spikes.
export const revalidate = 30;

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Product not found" };
  return {
    title: `${p.name} — Sericia`,
    description: p.description,
    openGraph: { title: p.name, description: p.description },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const [p, all, drop] = await Promise.all([
    getProductBySlug(slug),
    listActiveProducts(),
    getCurrentDrop(),
  ]);
  if (!p) notFound();

  // Related: same category first (up to 3), then fall back to random siblings if short
  const sameCategory = all.filter((x) => x.id !== p.id && x.category === p.category);
  const others = all.filter((x) => x.id !== p.id && x.category !== p.category);
  const related = [...sameCategory, ...others].slice(0, 3);

  const outOfStock = p.stock <= 0 || p.status === "sold_out";

  // Product JSON-LD (T1-E) — one Product entity per PDP with Offer availability.
  // Google uses `availability` to decide whether to surface the product in shopping rich results.
  const productUrl = `${SITE_URL}/products/${p.slug}`;
  const productImages = (p.images ?? []).map((img) =>
    img.startsWith("http") ? img : `${SITE_URL}${img.startsWith("/") ? "" : "/"}${img}`,
  );
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    image: productImages.length > 0 ? productImages : undefined,
    sku: p.id,
    category: categoryLabel(p.category),
    brand: { "@type": "Brand", name: "Sericia" },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "USD",
      price: p.price_usd,
      availability: outOfStock
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      seller: { "@type": "Organization", name: "Sericia" },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: { "@type": "MonetaryAmount", value: "0", currency: "USD" },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: ["US", "GB", "DE", "FR", "AU", "SG", "CA", "HK", "JP"],
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          transitTime: { "@type": "QuantitativeValue", minValue: 2, maxValue: 7, unitCode: "DAY" },
        },
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <SiteHeader />
      <Container size="wide" className="py-16 md:py-24 pb-28 md:pb-24">
        <div className="flex items-center justify-between gap-6 flex-wrap mb-6">
          <Link
            href="/products"
            className="text-[12px] tracking-[0.18em] uppercase text-sericia-ink-mute hover:text-sericia-ink transition"
          >
            ← All products
          </Link>
          {drop?.closes_at && !outOfStock && (
            <DropCountdown
              closesAt={drop.closes_at}
              label="Drop closes in"
              variant="compact"
            />
          )}
        </div>

        <ProductDetailShell
          product={{
            id: p.id,
            slug: p.slug,
            name: p.name,
            description: p.description,
            story: p.story,
            price_usd: p.price_usd,
            weight_g: p.weight_g,
            category: p.category,
            images: p.images ?? [],
            origin_region: p.origin_region,
            producer_name: p.producer_name,
            outOfStock,
            // Medusa variant.inventory_quantity, fetched live per request
            // (page has `export const dynamic = "force-dynamic"`).
            stockRemaining: typeof p.stock === "number" ? p.stock : null,
          }}
          relatedCategoryLabel={categoryLabel(p.category)}
        />

        <Rule className="my-20" />

        <FadeIn>
          <div className="grid md:grid-cols-12 gap-12 md:gap-20">
            <div className="md:col-span-4">
              <p className="label mb-3">The story</p>
              <p className="text-[13px] text-sericia-ink-mute leading-relaxed">
                Every product in our collection is chosen for a reason — meet the people and place behind this one.
              </p>
            </div>
            <div className="md:col-span-8">
              <p className="text-[18px] md:text-[19px] leading-[1.7] text-sericia-ink whitespace-pre-line">
                {p.story}
              </p>
            </div>
          </div>
        </FadeIn>
      </Container>

      {/* RecentlyViewed tracker — invisible. Records the current PDP into the
          per-visitor "recently viewed" Zustand store (capped at 12, persists
          via localStorage). The section below pulls from the same store. */}
      <RecentlyViewedTracker
        product={{
          id: p.id,
          slug: p.slug,
          name: p.name,
          category: p.category,
          price_usd: p.price_usd,
          weight_g: p.weight_g,
          origin_region: p.origin_region,
          thumbnail: (p.images?.[0] as string | undefined) ?? null,
        }}
      />

      {related.length > 0 && (
        <>
          <Rule />
          <Container size="wide" className="py-20 md:py-28">
            <FadeIn>
              <div className="flex items-end justify-between mb-10">
                <div>
                  <p className="label mb-3">Recommended pairings</p>
                  <h2 className="text-[26px] md:text-[32px] font-normal leading-tight">
                    You may also like
                  </h2>
                </div>
                <Link
                  href="/products"
                  className="hidden md:inline text-[12px] tracking-[0.18em] uppercase text-sericia-ink-mute hover:text-sericia-ink transition"
                >
                  Explore all →
                </Link>
              </div>
            </FadeIn>
            <div className="grid grid-cols-1 md:grid-cols-3 bg-sericia-line gap-px">
              {related.map((r, i) => (
                <FadeIn key={r.id} delay={0.08 * i}>
                  <ProductCard product={r} />
                </FadeIn>
              ))}
            </div>
          </Container>
        </>
      )}

      {/* Aesop-style "complimentary sample" hairline strip + the
          continue-browsing recently viewed row. Both render only when they
          have content (sampler is always-on; recently-viewed silent until
          the visitor has browsed ≥1 other product). */}
      <SamplerBanner variant="compact" />
      <RecentlyViewedSection excludeId={p.id} />

      <SiteFooter />
    </>
  );
}
