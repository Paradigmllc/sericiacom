"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Drawer } from "vaul";
import autoAnimate from "@formkit/auto-animate";
import { toast } from "sonner";
import { useCart } from "@/lib/cart-store";
import { CloseIcon, MinusIcon, PlusIcon } from "./Icons";
import SamplerBanner from "./SamplerBanner";

type CartDrawerProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

export default function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const [mounted, setMounted] = useState(false);
  const listRef = useRef<HTMLUListElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (listRef.current) autoAnimate(listRef.current);
  }, [mounted]);

  const subtotal = items.reduce((s, i) => s + i.price_usd * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  function handleRemove(productId: string, name: string) {
    try {
      remove(productId);
      toast.success(`Removed — ${name}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[cart-drawer] remove failed", err);
      toast.error(msg);
    }
  }

  return (
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
      direction="right"
      modal
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[70] bg-sericia-ink/30 backdrop-blur-[2px]" />
        <Drawer.Content
          className="fixed right-0 top-0 bottom-0 z-[80] flex w-full max-w-[440px] flex-col bg-sericia-paper text-sericia-ink outline-none"
          aria-describedby={undefined}
        >
          <Drawer.Title className="sr-only">Shopping cart</Drawer.Title>
          <div className="flex items-center justify-between border-b border-sericia-line px-6 py-5">
            <div>
              <p className="label">Your cart</p>
              <p className="mt-1 text-[14px] text-sericia-ink-soft">
                {mounted ? `${count} item${count === 1 ? "" : "s"}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Close cart"
              className="p-2 text-sericia-ink hover:text-sericia-accent transition"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Progress / shipping strip */}
          <div className="border-b border-sericia-line bg-sericia-paper-card px-6 py-3">
            <p className="text-[11px] tracking-[0.18em] uppercase text-sericia-ink-soft">
              Ships EMS worldwide · tracked · hand-packed in Kyoto within 48h
            </p>
            <div className="mt-2 h-px w-full bg-sericia-line overflow-hidden">
              <div className="h-full bg-sericia-ink w-full" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            {!mounted ? (
              <div className="space-y-4">
                {[0, 1].map((i) => (
                  <div key={i} className="flex gap-4 animate-pulse">
                    <div className="h-20 w-20 bg-sericia-paper-card" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-2/3 bg-sericia-paper-card" />
                      <div className="h-3 w-1/3 bg-sericia-paper-card" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center py-16">
                <p className="label mb-4">Empty cart</p>
                <p className="text-[14px] text-sericia-ink-soft mb-8 max-w-[260px]">
                  Browse the collection — every drop is limited and ships from Kyoto.
                </p>
                <Link
                  href="/products"
                  onClick={() => onOpenChange(false)}
                  className="inline-block border border-sericia-ink px-8 py-3 text-[13px] tracking-wider hover:bg-sericia-ink hover:text-sericia-paper transition-colors"
                >
                  Shop the collection
                </Link>
              </div>
            ) : (
              <ul ref={listRef} className="space-y-5">
                {items.map((item) => (
                  <li key={item.productId} className="flex gap-4">
                    <Link
                      href={`/products/${item.slug}`}
                      onClick={() => onOpenChange(false)}
                      className="block h-24 w-20 shrink-0 bg-gradient-to-br from-[#d4c9b0] to-[#7a5c3c]"
                      aria-label={item.name}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <Link
                          href={`/products/${item.slug}`}
                          onClick={() => onOpenChange(false)}
                          className="block"
                        >
                          <h3 className="text-[14px] font-normal leading-snug hover:text-sericia-accent transition">
                            {item.name}
                          </h3>
                        </Link>
                        <span className="text-[13px] tabular-nums shrink-0">
                          ${item.price_usd * item.quantity}
                        </span>
                      </div>
                      <p className="text-[11px] text-sericia-ink-mute mt-1">
                        ${item.price_usd} each
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center border border-sericia-line">
                          <button
                            type="button"
                            onClick={() => setQty(item.productId, item.quantity - 1)}
                            aria-label="Decrease"
                            className="p-2 text-sericia-ink hover:bg-sericia-paper-card"
                          >
                            <MinusIcon className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center text-[12px] tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => setQty(item.productId, item.quantity + 1)}
                            aria-label="Increase"
                            className="p-2 text-sericia-ink hover:bg-sericia-paper-card"
                          >
                            <PlusIcon className="h-3 w-3" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemove(item.productId, item.name)}
                          className="text-[11px] tracking-wider uppercase text-sericia-ink-mute hover:text-sericia-ink transition"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {mounted && items.length > 0 && (
            <div className="border-t border-sericia-line bg-sericia-paper-card px-6 py-5 space-y-4">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-sericia-ink-soft">Subtotal</span>
                <span className="tabular-nums">${subtotal} USD</span>
              </div>
              {/* Shipping line is conditional. Medusa shipping option
                  `EMS Free Shipping over $100 - <country>` triggers at
                  item_total ≥ $100; otherwise the per-region EMS standard
                  rate is computed at checkout. The previous "Included
                  worldwide" was an unconditional claim that the live
                  config doesn't honour. */}
              <div className="flex items-center justify-between text-[11px] tracking-[0.18em] uppercase text-sericia-ink-soft">
                <span>Shipping</span>
                <span>{subtotal >= 100 ? "Free EMS over $100" : "EMS at checkout"}</span>
              </div>
              {/* Duties disclosure — Sericia ships DDU from Japan; the
                  customer is the importer of record. Surface this once at
                  the cart edge so a FedEx / customs invoice on arrival
                  doesn't read as a surprise. Aesop, who registers VAT
                  per region, doesn't show this; we do because we don't. */}
              <p className="text-[10px] tracking-wider text-sericia-ink-mute leading-relaxed pt-1">
                Duties &amp; taxes calculated by your local customs at delivery.
              </p>
              <Link
                href="/checkout"
                onClick={() => onOpenChange(false)}
                className="block w-full bg-sericia-ink text-sericia-paper py-4 text-center text-[13px] tracking-wider hover:bg-sericia-accent transition-colors"
              >
                Continue to checkout
              </Link>
              <Link
                href="/cart"
                onClick={() => onOpenChange(false)}
                className="block text-center text-[12px] tracking-[0.18em] uppercase text-sericia-ink-soft hover:text-sericia-ink transition"
              >
                View cart
              </Link>
            </div>
          )}

          {/* Aesop-tier "small gift" reassurance — only when the cart isn't empty.
              Reinforces the complimentary sample promise at the highest-intent
              surface (about to checkout). */}
          {mounted && items.length > 0 && <SamplerBanner variant="drawer" />}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
