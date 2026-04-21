import { cookies } from "next/headers";
import type { Metadata } from "next";
import CheckoutForm from "@/components/CheckoutForm";
import CartCheckoutForm from "@/components/CartCheckoutForm";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Container, Eyebrow, Rule } from "@/components/ui";
import { getCurrentDrop } from "@/lib/drops";
import { formatPricePPP, PPP } from "@/lib/ppp";
import { supabaseServer } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ drop?: string }>;
}) {
  const sp = await searchParams;
  const country = (await cookies()).get("country")?.value ?? "us";

  // Pre-fill data from profile if logged in
  let profileDefaults: {
    email?: string;
    full_name?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    region?: string;
    postal_code?: string;
    country_code?: string;
    phone?: string;
  } = {};
  try {
    const supa = await supabaseServer();
    const { data: { user } } = await supa.auth.getUser();
    if (user) {
      const { data: profile } = await supabaseAdmin
        .from("sericia_profiles")
        .select("email, full_name, default_address, phone")
        .eq("id", user.id)
        .maybeSingle();
      if (profile) {
        const addr = (profile.default_address ?? {}) as Record<string, string | undefined>;
        profileDefaults = {
          email: profile.email ?? user.email ?? undefined,
          full_name: profile.full_name ?? addr.full_name ?? undefined,
          address_line1: addr.address_line1,
          address_line2: addr.address_line2,
          city: addr.city,
          region: addr.region,
          postal_code: addr.postal_code,
          country_code: addr.country_code,
          phone: profile.phone ?? undefined,
        };
      } else {
        profileDefaults.email = user.email ?? undefined;
      }
    }
  } catch (err) {
    console.error("[checkout] profile load failed (non-fatal)", err);
  }

  // ---- Drop checkout path (legacy) ----
  if (sp.drop) {
    const drop = await getCurrentDrop();
    if (!drop || drop.id !== sp.drop) {
      return (
        <>
          <SiteHeader />
          <Container size="wide" className="py-24"><p>Drop not available.</p></Container>
          <SiteFooter />
        </>
      );
    }
    const remaining = drop.total_units - drop.sold_units;
    const localPrice = formatPricePPP(drop.price_usd, country);
    const isLocalized = country !== "us" && PPP[country];
    return (
      <>
        <SiteHeader />
        <section className="border-b border-sericia-line bg-sericia-paper-card">
          <Container size="wide" className="py-16 md:py-20">
            <Eyebrow>Step 1 of 2 — Shipping</Eyebrow>
            <h1 className="text-[36px] md:text-[48px] leading-[1.1] font-normal tracking-tight">Shipping details.</h1>
            <p className="text-[15px] text-sericia-ink-soft mt-4 max-w-prose">
              We will use this address for EMS worldwide shipping. Tracking is emailed within 48 hours of payment.
            </p>
          </Container>
        </section>
        <Container size="wide" className="py-16 md:py-24">
          <div className="grid md:grid-cols-12 gap-12 md:gap-20">
            <div className="md:col-span-7">
              <CheckoutForm dropId={drop.id} amountUSD={drop.price_usd} title={drop.title} defaultCountry={country} />
            </div>
            <aside className="md:col-span-5">
              <div className="md:sticky md:top-8 border border-sericia-line bg-sericia-paper-card p-8">
                <p className="label mb-6">Order summary</p>
                <div className="aspect-[4/3] bg-gradient-to-br from-[#d4c9b0] to-[#8a7d5c] mb-6" />
                <h2 className="text-[20px] font-normal mb-2 leading-snug">{drop.title}</h2>
                <p className="text-[13px] text-sericia-ink-mute mb-6 tracking-wide">
                  {drop.weight_g}g · Ships within {drop.ships_within_hours}h from Kyoto
                </p>
                <Rule />
                <div className="flex justify-between py-4 text-[14px]">
                  <span className="text-sericia-ink-soft">Subtotal</span>
                  <span>${drop.price_usd}.00</span>
                </div>
                <Rule />
                <div className="flex justify-between py-4 text-[14px]">
                  <span className="text-sericia-ink-soft">Shipping (EMS worldwide)</span>
                  <span>Included</span>
                </div>
                <Rule />
                <div className="flex justify-between py-5 text-[16px] font-medium">
                  <span>Total</span>
                  <span>${drop.price_usd}.00 USD</span>
                </div>
                {isLocalized && (
                  <p className="text-[12px] text-sericia-ink-mute mt-1">
                    ≈ {localPrice} at today&apos;s rate · charged in USD
                  </p>
                )}
                <Rule className="mt-2" />
                <p className="text-[12px] text-sericia-ink-mute mt-5 tracking-wider uppercase">
                  {remaining} of {drop.total_units} remaining
                </p>
              </div>
            </aside>
          </div>
        </Container>
        <SiteFooter />
      </>
    );
  }

  // ---- Cart checkout path ----
  return (
    <>
      <SiteHeader />
      <section className="border-b border-sericia-line bg-sericia-paper-card">
        <Container size="wide" className="py-16 md:py-20">
          <Eyebrow>Checkout</Eyebrow>
          <h1 className="text-[36px] md:text-[48px] leading-[1.1] font-normal tracking-tight">Shipping details.</h1>
          <p className="text-[15px] text-sericia-ink-soft mt-4 max-w-prose">
            We will use this address for EMS worldwide shipping. Tracking is emailed within 48 hours of payment.
          </p>
        </Container>
      </section>
      <Container size="wide" className="py-16 md:py-24">
        <CartCheckoutForm defaultCountry={country} profileDefaults={profileDefaults} />
      </Container>
      <SiteFooter />
    </>
  );
}
