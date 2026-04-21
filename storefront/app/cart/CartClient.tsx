"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-store";
import { Rule } from "@/components/ui";

export default function CartClient() {
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="text-sericia-ink-soft">Loading cart…</div>;
  }

  if (items.length === 0) {
    return (
      <div className="border border-sericia-line p-16 text-center">
        <p className="label mb-5">Empty cart</p>
        <p className="text-[17px] text-sericia-ink-soft mb-10 max-w-md mx-auto leading-relaxed">
          There is nothing in your cart yet. Browse the collection — every product is limited and ships from Kyoto.
        </p>
        <Link href="/products" className="inline-block bg-sericia-ink text-sericia-paper px-10 py-4 text-[14px] tracking-wider hover:bg-sericia-accent transition">
          Shop the collection
        </Link>
      </div>
    );
  }

  const subtotal = items.reduce((s, i) => s + i.price_usd * i.quantity, 0);

  return (
    <div className="grid md:grid-cols-12 gap-12 md:gap-20">
      <div className="md:col-span-8">
        <div className="border-t border-sericia-line">
          {items.map((item) => (
            <div key={item.productId} className="grid grid-cols-12 gap-4 py-6 border-b border-sericia-line items-center">
              <div className="col-span-3 md:col-span-2">
                <div className="aspect-square bg-gradient-to-br from-[#d4c9b0] to-[#7a5c3c]" />
              </div>
              <div className="col-span-9 md:col-span-5">
                <Link href={`/products/${item.slug}`} className="block">
                  <h3 className="text-[16px] font-normal leading-snug hover:text-sericia-accent transition">{item.name}</h3>
                </Link>
                <p className="text-[13px] text-sericia-ink-mute mt-2">${item.price_usd} each</p>
              </div>
              <div className="col-span-6 md:col-span-3">
                <div className="flex items-center border border-sericia-line w-max">
                  <button
                    type="button"
                    onClick={() => setQty(item.productId, item.quantity - 1)}
                    className="w-9 h-9 text-[16px] text-sericia-ink hover:bg-sericia-paper-card"
                    aria-label="Decrease"
                  >−</button>
                  <span className="w-10 text-center text-[13px]">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQty(item.productId, item.quantity + 1)}
                    className="w-9 h-9 text-[16px] text-sericia-ink hover:bg-sericia-paper-card"
                    aria-label="Increase"
                  >+</button>
                </div>
              </div>
              <div className="col-span-6 md:col-span-2 text-right">
                <div className="text-[15px]">${item.price_usd * item.quantity}</div>
                <button
                  type="button"
                  onClick={() => remove(item.productId)}
                  className="text-[11px] tracking-wider uppercase text-sericia-ink-mute hover:text-sericia-ink mt-2"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <aside className="md:col-span-4">
        <div className="md:sticky md:top-8 border border-sericia-line bg-sericia-paper-card p-8">
          <p className="label mb-6">Summary</p>
          <div className="flex justify-between py-3 text-[14px]">
            <span className="text-sericia-ink-soft">Subtotal</span>
            <span>${subtotal}</span>
          </div>
          <Rule />
          <div className="flex justify-between py-3 text-[14px]">
            <span className="text-sericia-ink-soft">Shipping (EMS worldwide)</span>
            <span>Included</span>
          </div>
          <Rule />
          <div className="flex justify-between py-4 text-[16px] font-medium">
            <span>Total</span>
            <span>${subtotal} USD</span>
          </div>
          <Link
            href="/checkout"
            className="block text-center w-full bg-sericia-ink text-sericia-paper py-5 text-[14px] tracking-wider hover:bg-sericia-accent transition-colors mt-6"
          >
            Continue to checkout
          </Link>
          <p className="text-[12px] text-sericia-ink-mute mt-5 leading-relaxed">
            Duties and taxes are collected by your local customs and may apply on arrival.
          </p>
        </div>
      </aside>
    </div>
  );
}
