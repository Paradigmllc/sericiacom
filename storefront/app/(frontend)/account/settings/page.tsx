import type { Metadata } from "next";
import { redirect } from "next/navigation";
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

  // Use the admin client to read profile so we don't get tripped up by RLS
  // edge cases on first load (the policy is permissive, but service-role
  // is the established pattern across /account/*). Falls back to empty
  // strings — the form copes with either initial state.
  const { data: profile } = await supabaseAdmin
    .from("sericia_profiles")
    .select("full_name, locale")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div>
      <Eyebrow>Settings</Eyebrow>
      <h1 className="text-[36px] md:text-[44px] leading-[1.1] font-normal tracking-tight">Account settings.</h1>
      <p className="text-[15px] text-sericia-ink-soft mt-5 leading-relaxed max-w-prose">
        Edit your name, language, email, and shipping details. Card information
        is handled by our payment partner and never stored on our servers.
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
