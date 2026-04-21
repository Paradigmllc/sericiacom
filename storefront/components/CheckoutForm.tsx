"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

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

type Props = {
  dropId: string;
  amountUSD: number;
  title: string;
  defaultCountry: string;
};

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

export default function CheckoutForm({ dropId, amountUSD, title, defaultCountry }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    full_name: "",
    address_line1: "",
    address_line2: "",
    city: "",
    region: "",
    postal_code: "",
    country_code: defaultCountry.toUpperCase(),
    phone: "",
  });

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = Schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please fill all required fields");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drop_id: dropId,
          ...parsed.data,
          quantity: 1,
          utm_source: params.get("utm_source"),
          utm_medium: params.get("utm_medium"),
          utm_campaign: params.get("utm_campaign"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error === "insufficient_inventory" ? "Sold out — this drop just sold its last unit" : "Could not create order. Please try again.");
        console.error("[checkout] order create failed", data);
        setLoading(false);
        return;
      }
      toast.success("Order reserved. Redirecting to payment…");
      router.push(`/pay/${data.order_id}`);
    } catch (err) {
      console.error("[checkout] network error", err);
      toast.error("Network error — please try again");
      setLoading(false);
    }
  }

  const inputCls = "w-full px-4 py-3 rounded-lg border border-sericia-ink/20 bg-white focus:outline-none focus:ring-2 focus:ring-sericia-accent";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-sericia-ink/70 mb-1">Email *</label>
        <input type="email" required value={form.email} onChange={update("email")} className={inputCls} placeholder="you@example.com" autoComplete="email" />
      </div>
      <div>
        <label className="block text-sm text-sericia-ink/70 mb-1">Full name *</label>
        <input type="text" required value={form.full_name} onChange={update("full_name")} className={inputCls} autoComplete="name" />
      </div>
      <div>
        <label className="block text-sm text-sericia-ink/70 mb-1">Address line 1 *</label>
        <input type="text" required value={form.address_line1} onChange={update("address_line1")} className={inputCls} autoComplete="address-line1" />
      </div>
      <div>
        <label className="block text-sm text-sericia-ink/70 mb-1">Address line 2</label>
        <input type="text" value={form.address_line2} onChange={update("address_line2")} className={inputCls} autoComplete="address-line2" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-sericia-ink/70 mb-1">City *</label>
          <input type="text" required value={form.city} onChange={update("city")} className={inputCls} autoComplete="address-level2" />
        </div>
        <div>
          <label className="block text-sm text-sericia-ink/70 mb-1">State / Region</label>
          <input type="text" value={form.region} onChange={update("region")} className={inputCls} autoComplete="address-level1" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-sericia-ink/70 mb-1">Postal code *</label>
          <input type="text" required value={form.postal_code} onChange={update("postal_code")} className={inputCls} autoComplete="postal-code" />
        </div>
        <div>
          <label className="block text-sm text-sericia-ink/70 mb-1">Country *</label>
          <select required value={form.country_code} onChange={update("country_code")} className={inputCls}>
            {COUNTRIES.map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm text-sericia-ink/70 mb-1">Phone (optional, for customs)</label>
        <input type="tel" value={form.phone} onChange={update("phone")} className={inputCls} autoComplete="tel" />
      </div>
      <button type="submit" disabled={loading} className="w-full bg-sericia-ink text-sericia-paper py-4 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50">
        {loading ? "Reserving…" : `Continue to payment — $${amountUSD}`}
      </button>
      <p className="text-xs text-sericia-ink/50 text-center">
        {title} · EMS worldwide · By continuing you agree to our{" "}
        <a href="/terms" className="underline">Terms</a> and{" "}
        <a href="/privacy" className="underline">Privacy Policy</a>.
      </p>
    </form>
  );
}
