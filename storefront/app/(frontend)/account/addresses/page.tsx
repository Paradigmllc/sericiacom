import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Eyebrow, Rule } from "@/components/ui";
import { supabaseServer } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import AddressForm from "./AddressForm";

export const metadata: Metadata = {
  title: "Shipping addresses",
  robots: { index: false, follow: false },
};

export default async function AddressesPage() {
  const supa = await supabaseServer();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) redirect("/login?redirect=/account/addresses");

  // F63 — Promise.all so i18n + DB fetch share one waterfall hop.
  const [{ data: profile }, t] = await Promise.all([
    supabaseAdmin
      .from("sericia_profiles")
      .select("default_address, phone")
      .eq("id", user.id)
      .maybeSingle(),
    getTranslations("account.addresses_page"),
  ]);

  return (
    <div>
      <Eyebrow>{t("eyebrow")}</Eyebrow>
      <h1 className="text-[36px] md:text-[44px] leading-[1.1] font-normal tracking-tight">{t("title")}</h1>
      <p className="text-[15px] text-sericia-ink-soft mt-5 leading-relaxed max-w-prose">
        {t("lede")}
      </p>
      <Rule className="my-10" />
      <AddressForm
        initialAddress={profile?.default_address ?? null}
        initialPhone={profile?.phone ?? ""}
      />
    </div>
  );
}
