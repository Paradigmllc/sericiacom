import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Container, PageHero } from "@/components/ui";
import { listActiveProducts, categoryLabel } from "@/lib/products";

export const metadata: Metadata = {
  title: "Shop — Rescued Japanese craft",
  description: "Small-batch tea, miso, mushrooms and seasonings rescued from Japan's finest producers. Ships EMS worldwide from Kyoto.",
};

export const revalidate = 60;

const CATEGORY_GRADIENTS: Record<string, string> = {
  tea: "from-[#c8d4b0] to-[#6a7d4c]",
  miso: "from-[#d4c9b0] to-[#7a5c3c]",
  mushroom: "from-[#c8b8a8] to-[#5a4a3c]",
  seasoning: "from-[#e0d4a8] to-[#8a7a2c]",
};

export default async function ProductsIndexPage() {
  const products = await listActiveProducts();

  return (
    <>
      <SiteHeader />
      <PageHero
        eyebrow="The collection"
        title="Rescued Japanese craft, shipped from Kyoto."
        lede="Single-origin tea, barrel-aged miso, sun-dried mushrooms and small-batch seasonings — limited stock, honest stories, EMS worldwide."
      />
      <Container size="wide" className="py-20 md:py-28">
        {products.length === 0 ? (
          <p className="text-sericia-ink-soft">No products available right now.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 bg-sericia-line gap-px">
            {products.map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.slug}`}
                className="group bg-sericia-paper p-10 hover:bg-sericia-paper-card transition-colors"
              >
                <div
                  className={`aspect-[4/5] bg-gradient-to-br ${CATEGORY_GRADIENTS[p.category] ?? "from-sericia-line to-sericia-ink-mute"} mb-6 transition-transform group-hover:scale-[1.01]`}
                />
                <p className="label mb-3">{categoryLabel(p.category)} · {p.origin_region ?? ""}</p>
                <h2 className="text-[22px] md:text-[24px] font-normal leading-snug mb-3">{p.name}</h2>
                <p className="text-[13px] text-sericia-ink-soft leading-relaxed line-clamp-2 mb-6">{p.description}</p>
                <div className="flex items-baseline justify-between pt-4 border-t border-sericia-line">
                  <span className="text-[15px]">${p.price_usd} USD</span>
                  <span className="text-[11px] tracking-[0.18em] uppercase text-sericia-ink-mute">
                    {p.weight_g}g
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Container>
      <SiteFooter />
    </>
  );
}
