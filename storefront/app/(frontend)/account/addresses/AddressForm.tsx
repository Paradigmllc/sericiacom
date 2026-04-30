"use client";
import { useState } from "react";
import { toast } from "sonner";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Address = {
  full_name?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  region?: string;
  postal_code?: string;
  country_code?: string;
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

export default function AddressForm({
  initialAddress,
  initialPhone,
}: {
  initialAddress: Address | null;
  initialPhone: string;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Address & { phone: string }>({
    full_name: initialAddress?.full_name ?? "",
    address_line1: initialAddress?.address_line1 ?? "",
    address_line2: initialAddress?.address_line2 ?? "",
    city: initialAddress?.city ?? "",
    region: initialAddress?.region ?? "",
    postal_code: initialAddress?.postal_code ?? "",
    country_code: initialAddress?.country_code ?? "US",
    phone: initialPhone ?? "",
  });

  // 16px prevents iOS Safari auto-zoom on input focus.
  const input = "w-full px-0 py-3 bg-transparent border-b border-sericia-line focus:border-sericia-ink focus:outline-none text-[16px] placeholder-sericia-ink-mute transition-colors";
  const label = "label block mb-2";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const supa = supabaseBrowser();
      const { data: { user } } = await supa.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const { phone, ...address } = form;
      const { error } = await supa
        .from("sericia_profiles")
        .update({
          default_address: address,
          phone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
      if (error) throw error;
      toast.success("Address saved");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[addresses] save failed", err);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  const set = <K extends keyof typeof form>(k: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm({ ...form, [k]: e.target.value });

  return (
    <form onSubmit={onSubmit} className="space-y-7 max-w-xl">
      <div>
        <label className={label}>Full name</label>
        <input type="text" value={form.full_name ?? ""} onChange={set("full_name")} className={input} autoComplete="name" />
      </div>
      <div>
        <label className={label}>Address line 1</label>
        <input type="text" value={form.address_line1 ?? ""} onChange={set("address_line1")} className={input} autoComplete="address-line1" />
      </div>
      <div>
        <label className={label}>Address line 2 <span className="text-sericia-ink-mute normal-case tracking-normal">— optional</span></label>
        <input type="text" value={form.address_line2 ?? ""} onChange={set("address_line2")} className={input} autoComplete="address-line2" />
      </div>
      <div className="grid grid-cols-2 gap-8">
        <div>
          <label className={label}>City</label>
          <input type="text" value={form.city ?? ""} onChange={set("city")} className={input} autoComplete="address-level2" />
        </div>
        <div>
          <label className={label}>State / Region</label>
          <input type="text" value={form.region ?? ""} onChange={set("region")} className={input} autoComplete="address-level1" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-8">
        <div>
          <label className={label}>Postal code</label>
          <input type="text" value={form.postal_code ?? ""} onChange={set("postal_code")} className={input} autoComplete="postal-code" />
        </div>
        <div>
          <label className={label}>Country</label>
          <select value={form.country_code ?? "US"} onChange={set("country_code")} className={`${input} cursor-pointer`}>
            {COUNTRIES.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className={label}>Phone <span className="text-sericia-ink-mute normal-case tracking-normal">— for customs</span></label>
        <input type="tel" value={form.phone} onChange={set("phone")} className={input} autoComplete="tel" />
      </div>
      <div className="pt-4">
        <button type="submit" disabled={loading}
          className="bg-sericia-ink text-sericia-paper py-4 px-10 text-[14px] tracking-wider hover:bg-sericia-accent transition-colors disabled:opacity-40">
          {loading ? "Saving…" : "Save address"}
        </button>
      </div>
    </form>
  );
}
