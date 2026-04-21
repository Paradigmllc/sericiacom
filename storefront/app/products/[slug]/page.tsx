import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Container, Rule } from "@/components/ui";
import { getProductBySlug, listActiveProducts, categoryLabel } from "@/lib/products";
import AddToCartButton from "./AddToCartButton";

export const dynamic = "force-dynamic";

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

const CATEGORY_GRADIENTS: Record<string, string> = {
  tea: "from-[#c8d4b0] to-[#6a7d4c]",
  miso: "from-[#d4c9b0] to-[#7a5c3c]",
  mushroom: "from-[#c8b8a8] to-[#5a4a3c]",
  seasoning: "from-[#e0d4a8] to-[#8a7a2c]",
};

export default async function ProductDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) notFound();

  const all = await listActiveProducts();
  const related = all.filter((x) => x.id !== p.id && x.category === p.category).slice(0, 3);
  const outOfStock = p.stock <= 0 || p.status === "sold_out";

  return (
    <>
      <SiteHeader />
      <Container size="wide" className="py-16 md:py-24">
        <Link href="/products" className="text-[12px] tracking-wider text-sericia-ink-mute hover:text-sericia-ink uppercase">
          ← All products
        </Link>
        <div className="grid md:grid-cols-12 gap-12 md:gap-20 mt-8">
          <div className="md:col-span-7">
            <div
              className={`aspect-[4/5] bg-gradient-to-br ${CATEGORY_GRADIENTS[p.category] ?? "from-sericia-line to-sericia-ink-mute"}`}
            />
          </div>
          <div className="md:col-span-5 md:sticky md:top-8 md:self-start">
            <p className="label mb-4">{categoryLabel(p.category)} · {p.origin_region ?? ""}</p>
            <h1 className="text-[32px] md:text-[40px] leading-[1.1] font-normal tracking-tight mb-6">{p.name}</h1>
            <p className="text-[17px] text-sericia-ink-soft leading-relaxed mb-8">{p.description}</p>
            <div className="flex items-baseline gap-6 mb-8">
              <span className="text-[28px] font-normal">${p.price_usd}</span>
              <span className="text-[12px] tracking-[0.18em] uppercase text-sericia-ink-mute">USD · {p.weight_g}g</span>
            </div>
            <AddToCartButton
              productId={p.id}
              name={p.name}
              slug={p.slug}
              priceUsd={p.price_usd}
              outOfStock={outOfStock}
            />
            <p className="text-[12px] text-sericia-ink-mute mt-6 leading-relaxed">
              {outOfStock
                ? "This item is currently sold out. Join the waitlist to be notified of restocks."
                : "Ships within 48 hours from Kyoto · EMS worldwide · tracking included"}
            </p>

            <Rule className="my-10" />
            <dl className="space-y-5 text-[13px]">
              <div className="flex justify-between">
                <dt className="label">Producer</dt>
                <dd className="text-sericia-ink">{p.producer_name ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="label">Origin</dt>
                <dd className="text-sericia-ink">{p.origin_region ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="label">Weight</dt>
                <dd className="text-sericia-ink">{p.weight_g}g</dd>
              </div>
              <div className="flex justify-between">
                <dt className="label">Category</dt>
                <dd className="text-sericia-ink">{categoryLabel(p.category)}</dd>
              </div>
            </dl>
          </div>
        </div>

        <Rule className="my-20" />

        <div className="grid md:grid-cols-12 gap-12 md:gap-20">
          <div className="md:col-span-4">
            <p className="label">The story</p>
          </div>
          <div className="md:col-span-8">
            <p className="text-[18px] md:text-[19px] leading-[1.7] text-sericia-ink whitespace-pre-line">{p.story}</p>
          </div>
        </div>
      </Container>

      {related.length > 0 && (
        <>
          <Rule />
          <Container size="wide" className="py-20 md:py-28">
            <p className="label mb-10">You may also like</p>
            <div className="grid grid-cols-1 md:grid-cols-3 bg-sericia-line gap-px">
              {related.map((r) => (
                <Link key={r.id} href={`/products/${r.slug}`} className="group bg-sericia-paper p-8 hover:bg-sericia-paper-card transition-colors">
                  <div className={`aspect-[4/5] bg-gradient-to-br ${CATEGORY_GRADIENTS[r.category] ?? ""} mb-5`} />
                  <p className="label mb-2">{categoryLabel(r.category)}</p>
                  <h3 className="text-[18px] font-normal leading-snug mb-3">{r.name}</h3>
                  <span className="text-[13px] text-sericia-ink-soft">${r.price_usd}</span>
                </Link>
              ))}
            </div>
          </Container>
        </>
      )}

      <SiteFooter />
    </>
  );
}
