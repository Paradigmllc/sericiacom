import { cookies } from "next/headers";
import CrossmintButton from "@/components/CrossmintButton";
import { formatPricePPP, PPP } from "@/lib/ppp";

const DROP = {
  id: "drop-001",
  title: "Drop #1 — Sencha × Miso × Dried Shiitake",
  price: 95,
  remaining: 50,
  total: 50,
  weight_g: 480,
  shipping_note: "EMS worldwide · ships within 48h",
  story:
    "Three small Japanese producers had 480g of surplus on their hands — craft sencha near peak, barrel-aged miso, and hand-dried shiitake. Rescued before disposal. Same quality. Half the waste.",
};

const productJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: DROP.title,
  description: DROP.story,
  brand: { "@type": "Brand", name: "Sericia" },
  offers: {
    "@type": "Offer",
    url: "https://sericia.com",
    priceCurrency: "USD",
    price: DROP.price,
    availability: DROP.remaining > 0 ? "https://schema.org/LimitedAvailability" : "https://schema.org/SoldOut",
    seller: { "@type": "Organization", name: "Sericia" },
    shippingDetails: {
      "@type": "OfferShippingDetails",
      shippingRate: { "@type": "MonetaryAmount", value: "0", currency: "USD" },
      shippingDestination: { "@type": "DefinedRegion", addressCountry: ["US","GB","DE","FR","AU","SG","CA","HK","JP"] },
      deliveryTime: { "@type": "ShippingDeliveryTime", transitTime: { "@type": "QuantitativeValue", minValue: 2, maxValue: 7, unitCode: "DAY" } },
    },
  },
};

export default async function Home() {
  const country = (await cookies()).get("country")?.value ?? "us";
  const localPrice = formatPricePPP(DROP.price, country);
  const isLocalized = country !== "us" && PPP[country];
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
            <h3 className="text-2xl font-serif">{DROP.title}</h3>
            <span className="text-sm text-sericia-accent">
              {DROP.remaining}/{DROP.total} left
            </span>
          </div>
          <p className="text-sericia-ink/80 leading-relaxed mb-8">{DROP.story}</p>
          <div className="grid grid-cols-3 gap-4 text-sm text-sericia-ink/70 mb-8">
            <div>
              <div className="font-semibold text-sericia-ink">
                {isLocalized ? `${localPrice}` : `$${DROP.price}`}
              </div>
              <div>{isLocalized ? `≈ $${DROP.price} · billed USD` : "Flat (USD)"}</div>
            </div>
            <div>
              <div className="font-semibold text-sericia-ink">{DROP.weight_g}g</div>
              <div>Total weight</div>
            </div>
            <div>
              <div className="font-semibold text-sericia-ink">48h</div>
              <div>Ships from JP</div>
            </div>
          </div>
          <CrossmintButton
            dropId={DROP.id}
            amountUSD={DROP.price}
            title={DROP.title}
          />
          <p className="text-xs text-sericia-ink/50 mt-4 text-center">
            {DROP.shipping_note} · Credit card checkout powered by Crossmint (USDC settled).
          </p>
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
        <div className="max-w-5xl mx-auto px-6 py-8 text-sm text-sericia-ink/50 flex justify-between">
          <span>© 2026 Sericia · Paradigm LLC</span>
          <a href="mailto:hi@sericia.com">hi@sericia.com</a>
        </div>
      </footer>
    </main>
  );
}
