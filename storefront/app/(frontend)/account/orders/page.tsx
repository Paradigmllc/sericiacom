import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Eyebrow, Rule } from "@/components/ui";
import { supabaseServer } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const metadata: Metadata = {
  title: "Your orders",
  robots: { index: false, follow: false },
};

type OrderRow = {
  id: string;
  status: string;
  amount_usd: number;
  created_at: string;
  order_type: string | null;
  drop_id: string | null;
  tracking_number: string | null;
};

const LOCALE_DATE_MAP: Record<string, string> = {
  en: "en-US",
  ja: "ja-JP",
  de: "de-DE",
  fr: "fr-FR",
  es: "es-ES",
  it: "it-IT",
  ko: "ko-KR",
  "zh-TW": "zh-TW",
  ru: "ru-RU",
  ar: "ar-AE",
};

export default async function OrdersPage() {
  const supa = await supabaseServer();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) redirect("/login?redirect=/account/orders");

  // F63 — i18n + Promise.all batch.
  const locale = await getLocale();
  const [{ data, error }, t] = await Promise.all([
    supabaseAdmin
      .from("sericia_orders")
      .select("id, status, amount_usd, created_at, order_type, drop_id, tracking_number")
      .eq("email", (user.email || "").toLowerCase())
      .order("created_at", { ascending: false })
      .limit(100),
    getTranslations("account.orders_page"),
  ]);

  if (error) console.error("[account/orders] list failed", error);
  const orders = (data ?? []) as OrderRow[];
  const dateLocale = LOCALE_DATE_MAP[locale] ?? "en-US";

  return (
    <div>
      <Eyebrow>{t("eyebrow")}</Eyebrow>
      <h1 className="text-[36px] md:text-[44px] leading-[1.1] font-normal tracking-tight">{t("title")}</h1>
      <p className="text-[15px] text-sericia-ink-soft mt-5 leading-relaxed max-w-prose">
        {t("lede_fmt", { email: user.email ?? "" })}
      </p>
      <Rule className="my-10" />

      {orders.length === 0 ? (
        <div className="border border-sericia-line p-12 text-center">
          <p className="label mb-4">{t("empty_label")}</p>
          <p className="text-[15px] text-sericia-ink-soft mb-8 max-w-md mx-auto leading-relaxed">
            {t("empty_lede")}
          </p>
          <Link href="/products" className="inline-block border-b border-sericia-ink text-[13px] tracking-wider pb-0.5 hover:text-sericia-accent hover:border-sericia-accent transition">
            {t("browse_collection")}
          </Link>
        </div>
      ) : (
        <div className="border-t border-sericia-line">
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/account/orders/${o.id}`}
              className="grid grid-cols-12 gap-4 py-5 border-b border-sericia-line text-[14px] hover:bg-sericia-paper-card transition-colors"
            >
              <div className="col-span-4 md:col-span-3 text-sericia-ink-mute font-mono text-[12px] tracking-wider">
                {o.id.slice(0, 8)}
              </div>
              <div className="col-span-4 md:col-span-3 text-sericia-ink-soft">
                {new Date(o.created_at).toLocaleDateString(dateLocale, { day: "numeric", month: "short", year: "numeric" })}
              </div>
              <div className="col-span-4 md:col-span-2">
                <span className="label">{o.status}</span>
              </div>
              <div className="hidden md:block md:col-span-2 text-sericia-ink-soft text-[12px] tracking-wider uppercase">
                {o.tracking_number ? t("table_status_tracked") : t("table_status_dash")}
              </div>
              <div className="col-span-12 md:col-span-2 text-right md:text-right">
                ${o.amount_usd} USD
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
