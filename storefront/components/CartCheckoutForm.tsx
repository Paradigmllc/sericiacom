"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { useCart } from "@/lib/cart-store";
import { Rule } from "@/components/ui";

const Schema = z.object({
  email: z.string().email("Valid email required"),
  full_name: z.string().min(1, "Name required"),
  address_line1: z.string().min(1, "Address required"),
  address_line2: z.string().optional(),
  city: z.string().min(1, "City required"),
  region: z.string().optional(),
  postal_code: z.string().min(1, "Postal code required"),
  country_code: z.string().length(2, "Country required"),
  phone: z.string().optional(),
});

const COUNTRIES: [string, string][] = [
  ["US", "United States"], ["GB", "United Kingdom"], ["DE", "Germany"],
  ["FR", "France"], ["AU", "Australia"], ["SG", "Singapore"],
  ["CA", "Canada"], ["HK", "Hong Kong"], ["JP", "Japan"],
  ["NL", "Netherlands"], ["SE", "Sweden"], ["NO", "Norway"],
  ["DK", "Denmark"], ["CH", "Switzerland"], ["IE", "Ireland"],
  ["NZ", "New Zealand"], ["IT", "Italy"], ["ES", "Spain"],
  ["BE", "Belgium"], ["AT", "Austria"], ["FI", "Finland"],
  ["TW", "Taiwan"], ["KR", "South Korea"],
];

type Defaults = Partial<{
  email: string;
  full_name: string;
  address_line1: string;
  address_line2: string;
  city: string;
  region: string;
  postal_code: string;
  country_code: string;
  phone: string;
}>;

export default function CartCheckoutForm({
  defaultCountry,
  profileDefaults,
}: {
  defaultCountry: string;
  profileDefaults: Defaults;
}) {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: profileDefaults.email ?? "",
    full_name: profileDefaults.full_name ?? "",
    address_line1: profileDefaults.address_line1 ?? "",
    address_line2: profileDefaults.address_line2 ?? "",
    city: profileDefaults.city ?? "",
    region: profileDefaults.region ?? "",
    postal_code: profileDefaults.postal_code ?? "",
    country_code: profileDefaults.country_code ?? defaultCountry.toUpperCase(),
    phone: profileDefaults.phone ?? "",
  });

  useEffect(() => setMounted(true), []);

  const inputCls = "w-full px-0 py-3 bg-transparent border-b border-sericia-line focus:border-sericia-ink focus:outline-none text-[15px] placeholder-sericia-ink-mute transition-colors";
  const labelCls = "label block mb-2";

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const subtotal = items.reduce((s, i) => s + i.price_usd * i.quantity, 0);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Your cart is empty");
      router.push("/products");
      return;
    }
    const parsed = Schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please fill all required fields");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const res = await fetch("/api/orders/create-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
          ...parsed.data,
          utm_source: params.get("utm_source"),
          utm_medium: params.get("utm_medium"),
          utm_campaign: params.get("utm_campaign"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const map: Record<string, string> = {
          insufficient_stock: "One of the items in your cart just sold out. Please refresh.",
          product_inactive: "One of your items is no longer available.",
          product_not_found: "One of your items is no longer available.",
        };
        toast.error(map[data?.error as string] ?? "Could not create order. Please try again.");
        console.error("[cart-checkout] failed", data);
        setLoading(false);
        return;
      }
      toast.success("Order reserved. Redirecting to payment…");
      clear();
      router.push(`/pay/${data.order_id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[cart-checkout] exception", err);
      toast.error(msg);
      setLoading(false);
    }
  }

  if (!mounted) {
    return <div className="text-sericia-ink-soft">Loading checkout…</div>;
  }

  if (items.length === 0) {
    return (
      <div className="border border-sericia-line p-16 text-center">
        <p className="label mb-5">Empty cart</p>
        <p className="text-[17px] text-sericia-ink-soft mb-10 max-w-md mx-auto leading-relaxed">
          Add something to your cart before checking out.
        </p>
        <Link href="/products" className="inline-block bg-sericia-ink text-sericia-paper px-10 py-4 text-[14px] tracking-wider hover:bg-sericia-accent transition">
          Shop the collection
        </Link>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-12 gap-12 md:gap-20">
      <div className="md:col-span-7">
        <form onSubmit={onSubmit} className="space-y-7">
          <div>
            <label className={labelCls}>Email address</label>
            <input type="email" required value={form.email} onChange={update("email")} className={inputCls} placeholder="you@example.com" autoComplete="email" />
          </div>
          <div>
            <label className={labelCls}>Full name</label>
            <input type="text" required value={form.full_name} onChange={update("full_name")} className={inputCls} placeholder="First and last" autoComplete="name" />
          </div>
          <div>
            <label className={labelCls}>Address line 1</label>
            <input type="text" required value={form.address_line1} onChange={update("address_line1")} className={inputCls} placeholder="Street, number" autoComplete="address-line1" />
          </div>
          <div>
            <label className={labelCls}>Address line 2 <span className="text-sericia-ink-mute normal-case tracking-normal">— optional</span></label>
            <input type="text" value={form.address_line2} onChange={update("address_line2")} className={inputCls} placeholder="Apartment, suite, unit" autoComplete="address-line2" />
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <label className={labelCls}>City</label>
              <input type="text" required value={form.city} onChange={update("city")} className={inputCls} autoComplete="address-level2" />
            </div>
            <div>
              <label className={labelCls}>State / Region</label>
              <input type="text" value={form.region} onChange={update("region")} className={inputCls} autoComplete="address-level1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <label className={labelCls}>Postal code</label>
              <input type="text" required value={form.postal_code} onChange={update("postal_code")} className={inputCls} autoComplete="postal-code" />
            </div>
            <div>
              <label className={labelCls}>Country</label>
              <select required value={form.country_code} onChange={update("country_code")} className={`${inputCls} cursor-pointer`}>
                {COUNTRIES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Phone <span className="text-sericia-ink-mute normal-case tracking-normal">— for customs</span></label>
            <input type="tel" value={form.phone} onChange={update("phone")} className={inputCls} autoComplete="tel" />
          </div>
          <div className="pt-6">
            <button type="submit" disabled={loading} className="w-full bg-sericia-ink text-sericia-paper py-5 text-[14px] tracking-wider hover:bg-sericia-accent transition-colors disabled:opacity-40">
              {loading ? "Reserving…" : `Continue to payment — $${subtotal}`}
            </button>
            <p className="text-[12px] text-sericia-ink-mute text-center mt-5 leading-relaxed">
              EMS worldwide · By continuing you agree to our{" "}
              <a href="/terms" className="underline-link">Terms</a> and{" "}
              <a href="/privacy" className="underline-link">Privacy Policy</a>.
            </p>
          </div>
        </form>
      </div>

      <aside className="md:col-span-5">
        <div className="md:sticky md:top-8 border border-sericia-line bg-sericia-paper-card p-8">
          <p className="label mb-6">Order summary</p>
          <div className="space-y-4 mb-6">
            {items.map((it) => (
              <div key={it.productId} className="flex justify-between text-[14px]">
                <div>
                  <div>{it.name}</div>
                  <div className="text-[12px] text-sericia-ink-mute mt-0.5">Qty {it.quantity}</div>
                </div>
                <div>${it.price_usd * it.quantity}</div>
              </div>
            ))}
          </div>
          <Rule />
          <div className="flex justify-between py-4 text-[14px]">
            <span className="text-sericia-ink-soft">Subtotal</span>
            <span>${subtotal}</span>
          </div>
          <Rule />
          <div className="flex justify-between py-4 text-[14px]">
            <span className="text-sericia-ink-soft">Shipping (EMS worldwide)</span>
            <span>Included</span>
          </div>
          <Rule />
          <div className="flex justify-between py-5 text-[16px] font-medium">
            <span>Total</span>
            <span>${subtotal} USD</span>
          </div>
          <Rule />
          <p className="text-[12px] text-sericia-ink-mute mt-5 leading-relaxed">
            Duties and taxes are calculated by your local customs and may apply on arrival.
            See our <a href="/shipping" className="underline-link">shipping policy</a>.
          </p>
        </div>
      </aside>
    </div>
  );
}
