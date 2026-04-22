"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import ProductGallery from "./ProductGallery";
import AddToCartButton from "./AddToCartButton";
import Accordion, { type AccordionItem } from "@/components/Accordion";
import NotifyMeModal from "@/components/NotifyMeModal";
import { Rule } from "@/components/ui";

type ProductShape = {
  id: string;
  slug: string;
  name: string;
  description: string;
  story: string;
  price_usd: number;
  weight_g: number;
  category: string;
  images: string[];
  origin_region: string | null;
  producer_name: string | null;
  outOfStock: boolean;
  /**
   * Live inventory from Medusa (variant.inventory_quantity).
   * null → inventory untracked (don't show scarcity signal).
   * Scarcity messaging renders when 0 < stockRemaining <= LOW_STOCK_THRESHOLD.
   */
  stockRemaining: number | null;
};

// Threshold chosen carefully: high enough that the badge appears on genuinely
// low-stock items (building FOMO), low enough to avoid false-alarming on
// medium-stock items (which would feel manipulative and break brand trust).
const LOW_STOCK_THRESHOLD = 10;

const SHIPPING_COPY =
  "Hand-packed in Kyoto and shipped via EMS with tracking. Japan & Asia arrive in 3–5 business days; North America, Europe & Oceania in 5–9. Every parcel is temperature-considered, double-sealed, and includes a handwritten tasting card.";

const RETURNS_COPY =
  "Opened food cannot be returned for hygiene reasons, but we replace anything that arrives damaged or different to description — just send us a photo within 7 days of delivery. Unopened items in their original packaging may be returned within 14 days.";

export default function ProductDetailShell({
  product,
  relatedCategoryLabel,
}: {
  product: ProductShape;
  relatedCategoryLabel: string;
}) {
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const mainCtaRef = useRef<HTMLDivElement>(null);

  // Observe the main CTA area; show sticky mobile bar when it leaves the viewport
  useEffect(() => {
    const el = mainCtaRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          // Sticky bar visible only when primary CTA has fully scrolled out
          setShowStickyBar(!e.isIntersecting && e.boundingClientRect.top < 0);
        }
      },
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const accordionItems: AccordionItem[] = [
    {
      id: "origin",
      title: "Ingredients & origin",
      body: (
        <div className="space-y-3">
          <p>
            <span className="label block mb-1">Category</span>
            {relatedCategoryLabel}
          </p>
          {product.origin_region ? (
            <p>
              <span className="label block mb-1">Origin</span>
              {product.origin_region}
            </p>
          ) : null}
          {product.producer_name ? (
            <p>
              <span className="label block mb-1">Producer</span>
              {product.producer_name}
            </p>
          ) : null}
          <p>
            <span className="label block mb-1">Weight</span>
            {product.weight_g}g net
          </p>
        </div>
      ),
    },
    {
      id: "shipping",
      title: "Shipping & returns",
      body: (
        <div className="space-y-4">
          <p>{SHIPPING_COPY}</p>
          <p>{RETURNS_COPY}</p>
          <p>
            <Link href="/shipping" className="underline underline-offset-4 hover:text-sericia-ink">
              Full shipping details →
            </Link>
          </p>
        </div>
      ),
    },
    {
      id: "producer",
      title: "Producer story",
      body: (
        <p className="whitespace-pre-line text-[14px] leading-[1.7] text-sericia-ink-soft">
          {product.story || "We'll share the producer's full story here soon. Each Sericia maker is visited in person before their craft joins our collection."}
        </p>
      ),
    },
    {
      id: "tasting",
      title: "Tasting notes & pairing",
      body: (
        <div className="space-y-3">
          <p>{product.description}</p>
          <p className="text-sericia-ink-mute">
            Best enjoyed unhurried — steep at 70°C for 90 seconds, savour slowly, and let the flavour bloom. Pair with a plain-glazed ceramic vessel and good company.
          </p>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="grid md:grid-cols-12 gap-12 md:gap-20 mt-8">
        <div className="md:col-span-7">
          <ProductGallery images={product.images ?? []} category={product.category} name={product.name} />
        </div>
        <div className="md:col-span-5 md:sticky md:top-24 md:self-start">
          <p className="label mb-4">
            {relatedCategoryLabel}
            {product.origin_region ? ` · ${product.origin_region}` : ""}
          </p>
          <h1 className="text-[32px] md:text-[40px] leading-[1.1] font-normal tracking-tight mb-6">
            {product.name}
          </h1>
          <p className="text-[17px] text-sericia-ink-soft leading-relaxed mb-8">{product.description}</p>
          <div className="flex items-baseline gap-6 mb-8">
            <span className="text-[28px] font-normal">${product.price_usd}</span>
            <span className="text-[12px] tracking-[0.18em] uppercase text-sericia-ink-mute">
              USD · {product.weight_g}g
            </span>
          </div>
          {!product.outOfStock &&
            product.stockRemaining !== null &&
            product.stockRemaining > 0 &&
            product.stockRemaining <= LOW_STOCK_THRESHOLD && (
              <div
                role="status"
                aria-live="polite"
                className="flex items-center gap-2.5 mb-5 text-[12px] tracking-[0.12em] uppercase text-sericia-accent"
              >
                <span
                  aria-hidden="true"
                  className="relative inline-flex w-2 h-2 rounded-full bg-sericia-accent"
                >
                  <span className="absolute inset-0 rounded-full bg-sericia-accent animate-ping opacity-60" />
                </span>
                Only {product.stockRemaining}{" "}
                {product.stockRemaining === 1 ? "piece" : "pieces"} left
              </div>
            )}
          <div ref={mainCtaRef}>
            <AddToCartButton
              productId={product.id}
              name={product.name}
              slug={product.slug}
              priceUsd={product.price_usd}
              outOfStock={product.outOfStock}
              category={product.category}
              onNotifyClick={() => setNotifyOpen(true)}
            />
          </div>
          <p className="text-[12px] text-sericia-ink-mute mt-6 leading-relaxed">
            {product.outOfStock
              ? "This item is currently sold out. Join the waitlist to be notified of restocks."
              : "Ships within 48 hours from Kyoto · EMS worldwide · tracking included"}
          </p>

          <Rule className="my-10" />

          <Accordion items={accordionItems} defaultOpen="origin" />
        </div>
      </div>

      <NotifyMeModal
        open={notifyOpen}
        onClose={() => setNotifyOpen(false)}
        productId={product.id}
        productName={product.name}
        productSlug={product.slug}
      />

      {/* Mobile sticky add-to-cart bar */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-sericia-paper border-t border-sericia-line px-4 py-3 backdrop-blur-md"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[12px] tracking-[0.12em] uppercase text-sericia-ink-mute truncate">
                  {product.name}
                </p>
                <p className="text-[14px] text-sericia-ink">${product.price_usd} USD</p>
              </div>
              {product.outOfStock ? (
                <button
                  type="button"
                  onClick={() => setNotifyOpen(true)}
                  className="shrink-0 border border-sericia-ink py-3 px-5 text-[12px] tracking-[0.18em] uppercase hover:bg-sericia-ink hover:text-sericia-paper transition-colors"
                >
                  Notify me
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    mainCtaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                  className="shrink-0 bg-sericia-ink text-sericia-paper py-3 px-5 text-[12px] tracking-[0.18em] uppercase hover:bg-sericia-accent transition-colors"
                >
                  Add to cart
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
