"use client";
import { useState } from "react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart-store";
import { useUi } from "@/lib/ui-store";
import { useWishlist } from "@/lib/wishlist-store";
import { MinusIcon, PlusIcon } from "@/components/Icons";
import AnimatedHeart from "@/components/AnimatedHeart";

export default function AddToCartButton({
  productId,
  name,
  slug,
  priceUsd,
  outOfStock,
  category,
  onNotifyClick,
}: {
  productId: string;
  name: string;
  slug: string;
  priceUsd: number;
  outOfStock: boolean;
  category: string;
  onNotifyClick?: () => void;
}) {
  const add = useCart((s) => s.add);
  const openCart = useUi((s) => s.openCart);
  const toggleWish = useWishlist((s) => s.toggle);
  const wished = useWishlist((s) => s.has(productId));
  const [qty, setQty] = useState(1);

  function handleAdd() {
    try {
      add({ productId, name, slug, price_usd: priceUsd, quantity: qty, image: null });
      toast.success(`Added to cart — ${name}`);
      // Brief delay so the toast is perceivable before drawer opens
      setTimeout(() => openCart(), 120);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[add-to-cart]", err);
      toast.error(msg);
    }
  }

  function handleWish() {
    try {
      const added = toggleWish({ productId, slug, name, price_usd: priceUsd, category });
      toast.success(added ? `Saved — ${name}` : `Removed — ${name}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[wishlist] toggle", err);
      toast.error(msg);
    }
  }

  if (outOfStock) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={onNotifyClick}
          className="w-full border border-sericia-ink bg-sericia-paper py-5 text-[14px] tracking-[0.18em] uppercase hover:bg-sericia-ink hover:text-sericia-paper transition-colors"
        >
          Notify me when available
        </button>
        <button
          type="button"
          onClick={handleWish}
          aria-label={wished ? "Remove from wishlist" : "Save to wishlist"}
          className="w-full flex items-center justify-center gap-2 text-[12px] tracking-[0.18em] uppercase text-sericia-ink-mute hover:text-sericia-ink transition"
        >
          <AnimatedHeart filled={wished} className="h-4 w-4" />
          {wished ? "Saved" : "Save to wishlist"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-6">
        <span className="label">Quantity</span>
        <div className="flex items-center border border-sericia-line">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
            className="w-10 h-10 flex items-center justify-center text-sericia-ink hover:bg-sericia-paper-card transition"
          >
            <MinusIcon className="h-3 w-3" />
          </button>
          <span className="w-12 text-center text-[14px] tabular-nums" aria-live="polite">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(99, q + 1))}
            aria-label="Increase quantity"
            className="w-10 h-10 flex items-center justify-center text-sericia-ink hover:bg-sericia-paper-card transition"
          >
            <PlusIcon className="h-3 w-3" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <button
          type="button"
          onClick={handleAdd}
          data-pdp-add-to-cart
          className="bg-sericia-ink text-sericia-paper py-5 text-[14px] tracking-[0.18em] uppercase hover:bg-sericia-accent transition-colors"
        >
          Add to cart — ${(priceUsd * qty).toFixed(2)}
        </button>
        <button
          type="button"
          onClick={handleWish}
          aria-label={wished ? "Remove from wishlist" : "Save to wishlist"}
          className={`px-5 border transition-colors ${wished ? "border-sericia-heart" : "border-sericia-line text-sericia-ink-mute hover:border-sericia-ink hover:text-sericia-ink"}`}
        >
          <AnimatedHeart filled={wished} className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
