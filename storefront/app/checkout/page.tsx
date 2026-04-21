import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import type { Metadata } from "next";
import CheckoutForm from "@/components/CheckoutForm";
import { getCurrentDrop } from "@/lib/drops";
import { formatPricePPP, PPP } from "@/lib/ppp";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const drop = await getCurrentDrop();
  if (!drop) notFound();
  const remaining = drop.total_units - drop.sold_units;
  if (remaining <= 0) notFound();

  const country = (await cookies()).get("country")?.value ?? "us";
  const localPrice = formatPricePPP(drop.price_usd, country);
  const isLocalized = country !== "us" && PPP[country];

  return (
    <main className="min-h-screen bg-sericia-paper text-sericia-ink">
      <header className="border-b border-sericia-ink/10">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="text-2xl font-serif tracking-tight">Sericia</Link>
          <span className="text-sm text-sericia-ink/60">Secure checkout</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12 grid md:grid-cols-5 gap-10">
        <div className="md:col-span-3">
          <h1 className="text-3xl font-serif mb-2">Shipping details</h1>
          <p className="text-sm text-sericia-ink/60 mb-8">
            We&apos;ll use this address for EMS worldwide shipping. Tracking emailed within 48h of payment.
          </p>
          <CheckoutForm
            dropId={drop.id}
            amountUSD={drop.price_usd}
            title={drop.title}
            defaultCountry={country}
          />
        </div>

        <aside className="md:col-span-2">
          <div className="sticky top-6 bg-white border border-sericia-ink/10 rounded-2xl p-6">
            <h2 className="text-sm text-sericia-accent uppercase tracking-[0.2em] mb-4">Order summary</h2>
            <p className="font-serif text-lg mb-2">{drop.title}</p>
            <p className="text-sm text-sericia-ink/60 mb-4">{drop.weight_g}g · Ships within {drop.ships_within_hours}h</p>
            <div className="flex justify-between py-2 border-t border-sericia-ink/10">
              <span>Subtotal</span>
              <span>${drop.price_usd}</span>
            </div>
            <div className="flex justify-between py-2 border-t border-sericia-ink/10">
              <span>Shipping (EMS)</span>
              <span className="text-sericia-accent">Included</span>
            </div>
            <div className="flex justify-between py-3 border-t border-sericia-ink/20 font-semibold">
              <span>Total</span>
              <span>${drop.price_usd} USD</span>
            </div>
            {isLocalized && (
              <p className="text-xs text-sericia-ink/50 mt-3">
                ≈ {localPrice} at today&apos;s rate · charged in USD
              </p>
            )}
            <p className="text-xs text-sericia-ink/50 mt-4">
              {remaining}/{drop.total_units} remaining.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
