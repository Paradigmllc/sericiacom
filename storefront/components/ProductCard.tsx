"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useWishlist } from "@/lib/wishlist-store";
import AnimatedHeart from "./AnimatedHeart";

type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price_usd: number;
  weight_g: number;
  category: string;
  origin_region: string | null;
  /** Optional — if passed and low, shows "Only X left" pill on the card */
  stock?: number | null;
};

// Matches ProductDetailShell threshold so listing + PDP stay in sync
const LOW_STOCK_THRESHOLD = 10;

const CATEGORY_GRADIENTS: Record<string, string> = {
  tea: "from-[#c8d4b0] to-[#6a7d4c]",
  miso: "from-[#d4c9b0] to-[#7a5c3c]",
  mushroom: "from-[#c8b8a8] to-[#5a4a3c]",
  seasoning: "from-[#e0d4a8] to-[#8a7a2c]",
};

const CATEGORY_GRADIENTS_ALT: Record<string, string> = {
  tea: "from-[#6a7d4c] to-[#3f4a28]",
  miso: "from-[#7a5c3c] to-[#3f2c1a]",
  mushroom: "from-[#5a4a3c] to-[#2f241c]",
  seasoning: "from-[#8a7a2c] to-[#4a3f10]",
};

export default function ProductCard({
  product,
  className = "",
  padding = "p-10",
}: {
  product: Product;
  className?: string;
  padding?: string;
}) {
  const toggle = useWishlist((s) => s.toggle);
  const has = useWishlist((s) => s.has(product.id));

  function onWish(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      const added = toggle({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price_usd: product.price_usd,
        category: product.category,
      });
      toast.success(added ? `Saved — ${product.name}` : `Removed — ${product.name}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[wishlist] toggle", err);
      toast.error(msg);
    }
  }

  const primary = CATEGORY_GRADIENTS[product.category] ?? "from-sericia-line to-sericia-ink-mute";
  const secondary = CATEGORY_GRADIENTS_ALT[product.category] ?? "from-sericia-ink-mute to-sericia-ink";
  const showLowStock =
    typeof product.stock === "number" &&
    product.stock > 0 &&
    product.stock <= LOW_STOCK_THRESHOLD;

  return (
    <Link
      href={`/products/${product.slug}`}
      data-cursor="link"
      className={`group relative block bg-sericia-paper hover:bg-sericia-paper-card transition-colors ${padding} ${className}`}
    >
      <button
        type="button"
        onClick={onWish}
        aria-label={has ? "Remove from wishlist" : "Add to wishlist"}
        className="absolute top-4 right-4 z-10 p-2 text-sericia-ink-mute hover:text-sericia-ink transition"
      >
        <AnimatedHeart filled={has} className="h-5 w-5" />
      </button>
      <div className="relative aspect-[4/5] mb-6 overflow-hidden">
        {showLowStock && (
          <div className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 bg-sericia-paper/90 backdrop-blur-sm border border-sericia-line px-2.5 py-1 text-[9px] tracking-[0.18em] uppercase text-sericia-accent">
            <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-sericia-accent" />
            Only {product.stock} left
          </div>
        )}
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${primary}`}
          initial={{ opacity: 1 }}
          whileHover={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        />
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${secondary}`}
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        />
        {/* grain overlay */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.14] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.5'/></svg>\")",
          }}
        />
        <motion.div
          className="absolute inset-0"
          whileHover={{ scale: 1.03 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <p className="label mb-3">
        {product.category}
        {product.origin_region ? ` · ${product.origin_region}` : ""}
      </p>
      <h2 className="text-[20px] md:text-[22px] font-normal leading-snug mb-3">{product.name}</h2>
      <p className="text-[13px] text-sericia-ink-soft leading-relaxed line-clamp-2 mb-6">
        {product.description}
      </p>
      <div className="flex items-baseline justify-between pt-4 border-t border-sericia-line">
        <span className="text-[15px] tabular-nums">${product.price_usd} USD</span>
        <span className="text-[11px] tracking-[0.18em] uppercase text-sericia-ink-mute">
          {product.weight_g}g
        </span>
      </div>
    </Link>
  );
}
