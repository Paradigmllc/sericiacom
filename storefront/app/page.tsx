import { cookies } from "next/headers";
import Link from "next/link";
import WaitlistForm from "@/components/WaitlistForm";
import { formatPricePPP, PPP } from "@/lib/ppp";
import { getCurrentDrop } from "@/lib/drops";

export const revalidate = 60;

export default async function Home() {
  const country = (await cookies()).get("country")?.value ?? "us";
  const drop = await getCurrentDrop();
  const dropData = drop ?? {
    id: "drop-001",
    title: "Drop #1 — Sencha × Miso × Dried Shiitake",
    price_usd: 95,
    sold_units: 0,
    total_units: 50,
    weight_g: 480,
    ships_within_hours: 48,
    story: "Three small Japanese producers had 480g of surplus on their hands — craft sencha near peak, barrel-aged miso, and hand-dried shiitake. Rescued before disposal. Same quality. Half the waste.",
  };
  const remaining = dropData.total_units - dropData.sold_units;
  const soldOut = remaining <= 0;
  const localPrice = formatPricePPP(dropData.price_usd, country);
  const isLocalized = country !== "us" && PPP[country];

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: dropData.title,
    description: dropData.story,
    brand: { "@type": "Brand", name: "Sericia" },
    offers: {
      "@type": "Offer",
      url: "https://sericia.com",
      priceCurrency: "USD",
      price: dropData.price_usd,
      availability: soldOut ? "https://schema.org/SoldOut" : "https://schema.org/LimitedAvailability",
      seller: { "@type": "Organization", name: "Sericia" },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: { "@type": "MonetaryAmount", value: "0", currency: "USD" },
        shippingDestination: { "@type": "DefinedRegion", addressCountry: ["US","GB","DE","FR","AU","SG","CA","HK","JP"] },
        deliveryTime: { "@type": "ShippingDeliveryTime", transitTime: { "@type": "QuantitativeValue", minValue: 2, maxValue: 7, unitCode: "DAY" } },
      },
    },
  };
  return (
    <main className="min-h-screen bg-sericia-paper text-sericia-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <header className="border-b border-sericia-ink/10">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <h1 className="text-2xl font-serif tracking-tight">Sericia</h1>
          <nav className="text-sm text-sericia-ink/70">
            <a href="#drop" className="mr-6 hover:text-sericia-ink">Drop</a>
            <a href="#story" className="mr-6 hover:text-sericia-ink">Story</a>
            <a href="#faq" className="hover:text-sericia-ink">FAQ</a>
          </nav>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-6 py-20 text-center">
        <p className="text-sericia-accent uppercase tracking-[0.2em] text-xs mb-4">
          Drop · Limited release
        </p>
        <h2 className="text-5xl md:text-6xl font-serif leading-tight mb-6">
          Rescued Japanese craft food,<br />shipped worldwide.
        </h2>
        <p className="text-sericia-ink/70 max-w-2xl mx-auto mb-10">
          Each drop is a single curated bundle of near-expiry Japanese producers&apos; surplus —
          tea, miso, shiitake, and more. When it&apos;s gone, it&apos;s gone.
        </p>
      </section>

      <section id="drop" className="max-w-3xl mx-auto px-6 pb-20">
        <div className="border border-sericia-ink/10 rounded-2xl p-10 bg-white shadow-sm">
          <div className="flex items-baseline justify-between mb-6">
            <h3 className="text-2xl font-serif">{dropData.title}</h3>
            <span className="text-sm text-sericia-accent">
              {soldOut ? "Sold out" : `${remaining}/${dropData.total_units} left`}
            </span>
          </div>
          <p className="text-sericia-ink/80 leading-relaxed mb-8">{dropData.story}</p>
          <div className="grid grid-cols-3 gap-4 text-sm text-sericia-ink/70 mb-8">
            <div>
              <div className="font-semibold text-sericia-ink">
                {isLocalized ? `${localPrice}` : `$${dropData.price_usd}`}
              </div>
              <div>{isLocalized ? `≈ $${dropData.price_usd} · billed USD` : "Flat (USD)"}</div>
            </div>
            <div>
              <div className="font-semibold text-sericia-ink">{dropData.weight_g}g</div>
              <div>Total weight</div>
            </div>
            <div>
              <div className="font-semibold text-sericia-ink">{dropData.ships_within_hours}h</div>
              <div>Ships from JP</div>
            </div>
          </div>
          {soldOut ? (
            <div className="space-y-4">
              <div className="text-center py-4 border border-sericia-ink/20 rounded-lg text-sericia-ink/60">
                This drop has sold out.
              </div>
              <WaitlistForm source="sold-out" country={country} />
            </div>
          ) : (
            <Link
              href="/checkout"
              className="block w-full bg-sericia-ink text-sericia-paper py-4 rounded-lg font-medium hover:opacity-90 transition text-center"
            >
              Buy now — ${dropData.price_usd}
            </Link>
          )}
          <p className="text-xs text-sericia-ink/50 mt-4 text-center">
            EMS worldwide · ships within {dropData.ships_within_hours}h · Card checkout powered by Crossmint.
          </p>
        </div>
      </section>

      <section id="waitlist" className="max-w-xl mx-auto px-6 pb-20">
        <div className="bg-white border border-sericia-ink/10 rounded-2xl p-8 text-center">
          <p className="text-sericia-accent uppercase tracking-[0.2em] text-xs mb-2">Early access</p>
          <h3 className="text-2xl font-serif mb-3">Get next drop 24h before public release.</h3>
          <p className="text-sm text-sericia-ink/70 mb-5">Drops sell out in hours. Email list goes first.</p>
          <WaitlistForm source="homepage" country={country} />
        </div>
      </section>

      <section id="story" className="max-w-3xl mx-auto px-6 pb-20 text-center">
        <h3 className="text-3xl font-serif mb-4">Why Sericia</h3>
        <p className="text-sericia-ink/70 leading-relaxed">
          Japan&apos;s craft food makers produce exceptional goods on small margins.
          Near-expiry or overrun stock often ends up discarded. Sericia finds that
          stock, curates it into a single drop, and ships it to curious tables
          around the world — at a price that is kind to everyone in the chain.
        </p>
      </section>

      <footer className="border-t border-sericia-ink/10">
        <div className="max-w-5xl mx-auto px-6 py-8 text-sm text-sericia-ink/50 flex flex-wrap items-center justify-between gap-3">
          <span>© 2026 Sericia · Paradigm LLC</span>
          <nav className="flex gap-5">
            <Link href="/guides" className="hover:text-sericia-ink">Guides</Link>
            <Link href="/shipping" className="hover:text-sericia-ink">Shipping</Link>
            <Link href="/refund" className="hover:text-sericia-ink">Refunds</Link>
            <Link href="/terms" className="hover:text-sericia-ink">Terms</Link>
            <Link href="/privacy" className="hover:text-sericia-ink">Privacy</Link>
            <a href="mailto:contact@sericia.com" className="hover:text-sericia-ink">contact@sericia.com</a>
          </nav>
        </div>
      </footer>
    </main>
  );
}
