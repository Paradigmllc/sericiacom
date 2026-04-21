"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCart } from "@/lib/cart-store";

export default function AddToCartButton({
  productId,
  name,
  slug,
  priceUsd,
  outOfStock,
}: {
  productId: string;
  name: string;
  slug: string;
  priceUsd: number;
  outOfStock: boolean;
}) {
  const router = useRouter();
  const add = useCart((s) => s.add);
  const [qty, setQty] = useState(1);

  function handleAdd() {
    try {
      add({ productId, name, slug, price_usd: priceUsd, quantity: qty, image: null });
      toast.success(`Added to cart — ${name}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[add-to-cart]", err);
      toast.error(msg);
    }
  }

  function handleBuy() {
    handleAdd();
    router.push("/cart");
  }

  if (outOfStock) {
    return (
      <button
        type="button"
        disabled
        className="w-full bg-sericia-ink-mute text-sericia-paper py-5 text-[14px] tracking-wider disabled:cursor-not-allowed"
      >
        Sold out
      </button>
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
            className="w-10 h-10 text-[18px] text-sericia-ink hover:bg-sericia-paper-card transition"
          >
            −
          </button>
          <span className="w-12 text-center text-[14px]" aria-live="polite">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(99, q + 1))}
            aria-label="Increase quantity"
            className="w-10 h-10 text-[18px] text-sericia-ink hover:bg-sericia-paper-card transition"
          >
            +
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handleAdd}
          className="border border-sericia-ink py-5 text-[14px] tracking-wider hover:bg-sericia-ink hover:text-sericia-paper transition-colors"
        >
          Add to cart
        </button>
        <button
          type="button"
          onClick={handleBuy}
          className="bg-sericia-ink text-sericia-paper py-5 text-[14px] tracking-wider hover:bg-sericia-accent transition-colors"
        >
          Buy now
        </button>
      </div>
    </div>
  );
}
