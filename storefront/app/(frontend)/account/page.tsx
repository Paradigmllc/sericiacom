import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Eyebrow, Rule } from "@/components/ui";
import PushOptIn from "@/components/PushOptIn";
import { supabaseServer } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};

export default async function AccountOverviewPage() {
  const supa = await supabaseServer();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) redirect("/login?redirect=/account");

  const { data: profile } = await supabaseAdmin
    .from("sericia_profiles")
    .select("full_name, email, created_at, default_address")
    .eq("id", user.id)
    .maybeSingle();

  const { count: orderCount } = await supabaseAdmin
    .from("sericia_orders")
    .select("id", { count: "exact", head: true })
    .eq("email", user.email?.toLowerCase() ?? "");

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "today";

  return (
    <div>
      <Eyebrow>Account</Eyebrow>
      <h1 className="text-[36px] md:text-[44px] leading-[1.1] font-normal tracking-tight">
        {profile?.full_name || "Welcome"}.
      </h1>
      <p className="text-[15px] text-sericia-ink-soft mt-5 leading-relaxed max-w-prose">
        Manage your orders, shipping addresses and preferences. Your drops ship EMS from Kyoto within 48 hours of payment.
      </p>

      <Rule className="my-12" />

      <div className="grid md:grid-cols-3 gap-px bg-sericia-line">
        <div className="bg-sericia-paper p-8">
          <p className="label mb-3">Email</p>
          <p className="text-[15px] break-all">{profile?.email || user.email}</p>
        </div>
        <div className="bg-sericia-paper p-8">
          <p className="label mb-3">Member since</p>
          <p className="text-[15px]">{memberSince}</p>
        </div>
        <div className="bg-sericia-paper p-8">
          <p className="label mb-3">Orders</p>
          <p className="text-[15px]">{orderCount ?? 0}</p>
        </div>
      </div>

      <Rule className="my-12" />

      <div className="grid md:grid-cols-3 gap-8">
        <Link href="/account/orders" className="block border border-sericia-line p-8 hover:border-sericia-ink transition">
          <p className="label mb-3">Orders</p>
          <h2 className="text-[22px] font-normal leading-snug mb-3">Track and download receipts</h2>
          <p className="text-[13px] text-sericia-ink-soft">View order history and tracking numbers.</p>
        </Link>
        <Link href="/account/addresses" className="block border border-sericia-line p-8 hover:border-sericia-ink transition">
          <p className="label mb-3">Addresses</p>
          <h2 className="text-[22px] font-normal leading-snug mb-3">Default shipping</h2>
          <p className="text-[13px] text-sericia-ink-soft">Keep your ship-to address up to date.</p>
        </Link>
        <Link href="/account/settings" className="block border border-sericia-line p-8 hover:border-sericia-ink transition">
          <p className="label mb-3">Settings</p>
          <h2 className="text-[22px] font-normal leading-snug mb-3">Profile, email & language</h2>
          <p className="text-[13px] text-sericia-ink-soft">Edit your name, language, email or delete your account.</p>
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
