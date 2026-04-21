import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Eyebrow, Rule } from "@/components/ui";
import { supabaseServer } from "@/lib/supabase-server";
import SettingsForm from "./SettingsForm";

export const metadata: Metadata = {
  title: "Account settings",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const supa = await supabaseServer();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) redirect("/login?redirect=/account/settings");

  return (
    <div>
      <Eyebrow>Settings</Eyebrow>
      <h1 className="text-[36px] md:text-[44px] leading-[1.1] font-normal tracking-tight">Account settings.</h1>
      <p className="text-[15px] text-sericia-ink-soft mt-5 leading-relaxed max-w-prose">
        Change your email, password or delete the account and all associated data.
      </p>
      <Rule className="my-10" />
      <SettingsForm initialEmail={user.email ?? ""} />
    </div>
  );
}
