"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("cart.checkout_extras");
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
        toast.error(
          data?.error === "insufficient_inventory"
            ? t("toast_unavailable")
            : t("toast_interrupted"),
        );
        console.error("[checkout] order create failed", data);
        setLoading(false);
        return;
      }
      toast.success(t("toast_redirect"));
      router.push(`/pay/${data.order_id}`);
    } catch (err) {
      console.error("[checkout] network error", err);
      toast.error(t("toast_network"));
      setLoading(false);
    }
  }

  // 16px (not 15px) prevents iOS Safari auto-zoom on input focus.
  const inputCls =
    "w-full px-0 py-3 bg-transparent border-b border-sericia-line focus:border-sericia-ink focus:outline-none text-[16px] placeholder-sericia-ink-mute transition-colors";
  const labelCls = "label block mb-2";

  return (
    <form onSubmit={onSubmit} className="space-y-7">
      <div>
        <label className={labelCls}>{t("label_email")}</label>
        <input
          type="email"
          required
          value={form.email}
          onChange={update("email")}
          className={inputCls}
          placeholder={t("placeholder_email")}
          autoComplete="email"
        />
      </div>
      <div>
        <label className={labelCls}>{t("label_full_name")}</label>
        <input
          type="text"
          required
          value={form.full_name}
          onChange={update("full_name")}
          className={inputCls}
          placeholder={t("placeholder_full_name")}
          autoComplete="name"
        />
      </div>
      <div>
        <label className={labelCls}>{t("label_address1")}</label>
        <input
          type="text"
          required
          value={form.address_line1}
          onChange={update("address_line1")}
          className={inputCls}
          placeholder={t("placeholder_address1")}
          autoComplete="address-line1"
        />
      </div>
      <div>
        <label className={labelCls}>{t("label_address2")}</label>
        <input
          type="text"
          value={form.address_line2}
          onChange={update("address_line2")}
          className={inputCls}
          placeholder={t("placeholder_address2")}
          autoComplete="address-line2"
        />
      </div>
      <div className="grid grid-cols-2 gap-8">
        <div>
          <label className={labelCls}>{t("label_city")}</label>
          <input
            type="text"
            required
            value={form.city}
            onChange={update("city")}
            className={inputCls}
            placeholder={t("placeholder_city")}
            autoComplete="address-level2"
          />
        </div>
        <div>
          <label className={labelCls}>{t("label_state")}</label>
          <input
            type="text"
            value={form.region}
            onChange={update("region")}
            className={inputCls}
            placeholder={t("placeholder_state")}
            autoComplete="address-level1"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-8">
        <div>
          <label className={labelCls}>{t("label_postal")}</label>
          <input
            type="text"
            required
            value={form.postal_code}
            onChange={update("postal_code")}
            className={inputCls}
            placeholder={t("placeholder_postal")}
            autoComplete="postal-code"
          />
        </div>
        <div>
          <label className={labelCls}>{t("label_country")}</label>
          <select
            required
            value={form.country_code}
            onChange={update("country_code")}
            className={`${inputCls} cursor-pointer`}
          >
            {COUNTRIES.map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className={labelCls}>{t("label_phone")}</label>
        <input
          type="tel"
          value={form.phone}
          onChange={update("phone")}
          className={inputCls}
          placeholder={t("placeholder_phone")}
          autoComplete="tel"
        />
      </div>
      <div className="pt-6">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-sericia-ink text-sericia-paper py-5 text-[14px] tracking-wider hover:bg-sericia-accent transition-colors disabled:opacity-40"
        >
          {loading ? t("submit_reserving") : `${t("submit_reserve")} — $${amountUSD}`}
        </button>
        <p className="text-[12px] text-sericia-ink-mute text-center mt-5 leading-relaxed">
          {title} · EMS worldwide · By continuing you agree to our{" "}
          <a href="/terms" className="underline-link">Terms</a> and{" "}
          <a href="/privacy" className="underline-link">Privacy Policy</a>.
        </p>
      </div>
    </form>
  );
}
