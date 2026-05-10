import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Eyebrow, Rule } from "@/components/ui";
import PushOptIn from "@/components/PushOptIn";
import { supabaseServer } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};

// Locale tag mapping: convert next-intl locale ids to BCP-47 tags so
// toLocaleDateString picks the right month/year format per locale.
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

export default async function AccountOverviewPage() {
  const supa = await supabaseServer();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) redirect("/login?redirect=/account");

  // F63 — locale-aware account overview. All visible copy comes from the
  // `account.overview_page` namespace; member-since date uses the customer's
  // active locale for proper "April 2026" / "2026年4月" / "Avril 2026" format.
  const locale = await getLocale();
  const t = await getTranslations("account.overview_page");

  const [{ data: profile }, { count: orderCount }] = await Promise.all([
    supabaseAdmin
      .from("sericia_profiles")
      .select("full_name, email, created_at, default_address")
      .eq("id", user.id)
      .maybeSingle(),
    supabaseAdmin
      .from("sericia_orders")
      .select("id", { count: "exact", head: true })
      .eq("email", user.email?.toLowerCase() ?? ""),
  ]);

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(LOCALE_DATE_MAP[locale] ?? "en-US", {
        month: "long",
        year: "numeric",
      })
    : t("label_member_since_today");

  return (
    <div>
      <Eyebrow>{t("eyebrow")}</Eyebrow>
      <h1 className="text-[36px] md:text-[44px] leading-[1.1] font-normal tracking-tight">
        {profile?.full_name || t("welcome_default")}.
      </h1>
      <p className="text-[15px] text-sericia-ink-soft mt-5 leading-relaxed max-w-prose">
        {t("lede")}
      </p>

      <Rule className="my-12" />

      <div className="grid md:grid-cols-3 gap-px bg-sericia-line">
        <div className="bg-sericia-paper p-8">
          <p className="label mb-3">{t("label_email")}</p>
          <p className="text-[15px] break-all">{profile?.email || user.email}</p>
        </div>
        <div className="bg-sericia-paper p-8">
          <p className="label mb-3">{t("label_member_since")}</p>
          <p className="text-[15px]">{memberSince}</p>
        </div>
        <div className="bg-sericia-paper p-8">
          <p className="label mb-3">{t("label_orders_count")}</p>
          <p className="text-[15px]">{orderCount ?? 0}</p>
        </div>
      </div>

      <Rule className="my-12" />

      <div className="grid md:grid-cols-3 gap-8">
        <Link href="/account/orders" className="block border border-sericia-line p-8 hover:border-sericia-ink transition">
          <p className="label mb-3">{t("card_orders_label")}</p>
          <h2 className="text-[22px] font-normal leading-snug mb-3">{t("card_orders_title")}</h2>
          <p className="text-[13px] text-sericia-ink-soft">{t("card_orders_lede")}</p>
        </Link>
        <Link href="/account/addresses" className="block border border-sericia-line p-8 hover:border-sericia-ink transition">
          <p className="label mb-3">{t("card_addresses_label")}</p>
          <h2 className="text-[22px] font-normal leading-snug mb-3">{t("card_addresses_title")}</h2>
          <p className="text-[13px] text-sericia-ink-soft">{t("card_addresses_lede")}</p>
        </Link>
        <Link href="/account/settings" className="block border border-sericia-line p-8 hover:border-sericia-ink transition">
          <p className="label mb-3">{t("card_settings_label")}</p>
          <h2 className="text-[22px] font-normal leading-snug mb-3">{t("card_settings_title")}</h2>
          <p className="text-[13px] text-sericia-ink-soft">{t("card_settings_lede")}</p>
        </Link>
      </div>

      {/*
        Push opt-in slot on the account overview. Silently self-hides when
        the user has already subscribed / denied / dismissed in the last 60
        days, so returning visitors don't see repeated asks. See PushOptIn.
      */}
      <Rule className="my-12" />
      <PushOptIn
        variant="account"
        topics={["drops", "orders"]}
      />
    </div>
  );
}
