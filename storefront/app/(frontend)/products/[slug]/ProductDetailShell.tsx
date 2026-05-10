"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
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
  // ── F12 enrichment fields (all optional / pulled from Medusa metadata) ──
  /** Ingredient list — comma- or semicolon-separated string from product.metadata.ingredients. */
  ingredients?: string | null;
  /** Tasting / aroma notes from product.metadata.tasting_notes. */
  tastingNotes?: string | null;
  /** Brewing or preparation guidance from product.metadata.preparation. */
  preparation?: string | null;
  /** Allergen line (e.g. "Contains soybeans, wheat") from product.metadata.allergens. */
  allergens?: string | null;
  /** Best-before window note from product.metadata.shelf_life. */
  shelfLife?: string | null;
};

// Threshold chosen carefully: high enough that the badge appears on genuinely
// low-stock items (building FOMO), low enough to avoid false-alarming on
// medium-stock items (which would feel manipulative and break brand trust).
const LOW_STOCK_THRESHOLD = 10;

export default function ProductDetailShell({
  product,
  relatedCategoryLabel,
}: {
  product: ProductShape;
  relatedCategoryLabel: string;
}) {
  // F60 — PDP accordion + labels are now i18n'd via next-intl `pdp` namespace.
  // Was hardcoded English which Daisy reported as "i18nバグハードコードで言語切り替わらない箇所多数"
  // 2026-05-10. The static SHIPPING_COPY / RETURNS_COPY constants moved into
  // the translations file (en/ja hand-written, other 8 locales placeholder
  // for follow-up DeepSeek V4 batch translation).
  const t = useTranslations("pdp");
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

  // F12: split ingredient list on comma or semicolon so editors can type
  // "Sencha leaves, brown rice" or "Soybeans; salt; rice koji" and the
  // PDP renders it as a clean bulleted list (Aesop pattern). Trims whitespace
  // and discards empty fragments to be paste-tolerant.
  const ingredientItems = (product.ingredients ?? "")
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const accordionItems: AccordionItem[] = [
    {
      id: "origin",
      title: t("ingredients_origin"),
      body: (
        <div className="space-y-4">
          <p>
            <span className="label block mb-1">{t("category")}</span>
            {relatedCategoryLabel}
          </p>
          {product.origin_region ? (
            <p>
              <span className="label block mb-1">{t("origin")}</span>
              {product.origin_region}
            </p>
          ) : null}
          {product.producer_name ? (
            <p>
              <span className="label block mb-1">{t("producer")}</span>
              {product.producer_name}
            </p>
          ) : null}
          <p>
            <span className="label block mb-1">{t("weight")}</span>
            {t("weight_g_net_fmt", { grams: product.weight_g })}
          </p>
          {ingredientItems.length > 0 && (
            <div>
              <span className="label block mb-2">{t("ingredients")}</span>
              <ul className="list-disc list-inside space-y-1 text-[14px] leading-relaxed">
                {ingredientItems.map((ing, i) => (
                  <li key={i}>{ing}</li>
                ))}
              </ul>
            </div>
          )}
          {product.allergens && (
            <p>
              <span className="label block mb-1">{t("allergens")}</span>
              <span className="text-sericia-ink-soft">{product.allergens}</span>
            </p>
          )}
          {product.shelfLife && (
            <p>
              <span className="label block mb-1">{t("best_within")}</span>
              <span className="text-sericia-ink-soft">{product.shelfLife}</span>
            </p>
          )}
        </div>
      ),
    },
    {
      id: "shipping",
      title: t("shipping_returns"),
      body: (
        <div className="space-y-4">
          <p>{t("shipping_copy")}</p>
          <p>{t("returns_copy")}</p>
          <p>
            <Link href="/shipping" className="underline underline-offset-4 hover:text-sericia-ink">
              {t("shipping_link")}
            </Link>
          </p>
        </div>
      ),
    },
    {
      id: "producer",
      title: t("producer_story"),
      body: (
        <p className="whitespace-pre-line text-[14px] leading-[1.7] text-sericia-ink-soft">
          {product.story || t("story_fallback")}
        </p>
      ),
    },
    {
      id: "tasting",
      title: t("tasting_pairing"),
      body: (
        <div className="space-y-4">
          <p>{product.description}</p>
          {product.tastingNotes && (
            <p className="whitespace-pre-line text-[14px] leading-[1.7] text-sericia-ink-soft">
              {product.tastingNotes}
            </p>
          )}
          {product.preparation && (
            <div>
              <span className="label block mb-1">{t("preparation")}</span>
              <p className="whitespace-pre-line text-[14px] leading-[1.7] text-sericia-ink-soft">
                {product.preparation}
              </p>
            </div>
          )}
          {!product.tastingNotes && !product.preparation && (
            <p className="text-sericia-ink-mute">
              {t("tasting_fallback")}
            </p>
          )}
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
