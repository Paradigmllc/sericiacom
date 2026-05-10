import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Eyebrow, Rule } from "@/components/ui";
import { supabaseServer } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import SettingsForm from "./SettingsForm";

export const metadata: Metadata = {
  title: "Account settings",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const supa = await supabaseServer();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) redirect("/login?redirect=/account/settings");

  // F65 — i18n + parallel fetch
  const [{ data: profile }, t] = await Promise.all([
    supabaseAdmin
      .from("sericia_profiles")
      .select("full_name, locale")
      .eq("id", user.id)
      .maybeSingle(),
    getTranslations("account.settings_page"),
  ]);

  return (
    <div>
      <Eyebrow>{t("eyebrow")}</Eyebrow>
      <h1 className="text-[36px] md:text-[44px] leading-[1.1] font-normal tracking-tight">{t("title")}</h1>
      <p className="text-[15px] text-sericia-ink-soft mt-5 leading-relaxed max-w-prose">
        {t("lede")}
      </p>
      <Rule className="my-10" />
      <SettingsForm
        initialEmail={user.email ?? ""}
        initialProfile={{
          full_name: profile?.full_name ?? null,
          locale: profile?.locale ?? null,
        }}
      />
    </div>
  );
}
