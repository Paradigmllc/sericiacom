import { cookies } from "next/headers";
import Link from "next/link";
import WaitlistForm from "../components/WaitlistForm";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import { Container, Eyebrow, Button, SectionHeading, StatBlock, Rule } from "../components/ui";
import { formatPricePPP, PPP } from "../lib/ppp";
import { getCurrentDrop } from "../lib/drops";

export const revalidate = 60;

export default async function Home() {
  const country = (await cookies()).get("country")?.value ?? "us";
  const drop = await getCurrentDrop();
  const dropData = drop ?? {
    id: "drop-001",
    title: "Drop No. 01 — Sencha, Miso & Hand-dried Shiitake",
    price_usd: 95,
    sold_units: 0,
    total_units: 50,
    weight_g: 480,
    ships_within_hours: 48,
    story:
      "Three small Japanese producers had 480g of surplus between them: a single-origin sencha picked at peak, a barrel-aged miso from a 120-year-old shed, and shiitake hand-dried on bamboo racks. Rescued before disposal — the same craft, half the waste.",
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
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: ["US", "GB", "DE", "FR", "AU", "SG", "CA", "HK", "JP"],
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          transitTime: { "@type": "QuantitativeValue", minValue: 2, maxValue: 7, unitCode: "DAY" },
        },
      },
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <SiteHeader />

      {/* Hero */}
      <section className="relative bg-sericia-paper">
        <Container size="wide" className="pt-24 md:pt-32 pb-20 md:pb-28">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-end">
            <div className="md:col-span-7">
              <Eyebrow>Drop No. 01 — Limited release</Eyebrow>
              <h1 className="text-[44px] md:text-[68px] leading-[1.05] font-normal tracking-tight">
                Rescued Japanese<br />craft food,<br />
                <span className="text-sericia-accent">shipped worldwide.</span>
              </h1>
            </div>
            <div className="md:col-span-5">
              <p className="text-[17px] text-sericia-ink-soft leading-[1.7] max-w-md">
                Each drop is a single curated bundle of near-expiry Japanese producers' surplus —
                tea, miso, shiitake, and more. When it is gone, it is gone.
              </p>
              <div className="mt-8 flex items-center gap-6 text-[13px] text-sericia-ink-soft tracking-wider">
                <span>Kyoto, Japan</span>
                <span className="h-px w-6 bg-sericia-line" />
                <span>EMS worldwide</span>
                <span className="h-px w-6 bg-sericia-line" />
                <span>{dropData.total_units} units only</span>
              </div>
            </div>
          </div>
        </Container>
        <div className="h-[42vh] min-h-[320px] max-h-[520px] w-full bg-gradient-to-br from-[#e8e1d3] via-[#d8cfbd] to-[#b8a987] relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-40 mix-blend-multiply"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 40%, rgba(92,93,69,0.3) 0px, transparent 40%), radial-gradient(circle at 80% 60%, rgba(33,35,29,0.2) 0px, transparent 45%)",
            }}
          />
          <div className="absolute inset-0 flex items-end">
            <Container size="wide" className="pb-10 w-full">
              <p className="label text-sericia-paper/80">Photographed in Kyoto · Spring 2026</p>
            </Container>
          </div>
        </div>
      </section>

      {/* Drop detail */}
      <section id="drop" className="border-b border-sericia-line">
        <Container size="wide" className="py-24 md:py-32">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-16">
            <div className="md:col-span-5">
              <Eyebrow>The current drop</Eyebrow>
              <h2 className="text-[36px] md:text-[44px] leading-[1.15] font-normal tracking-tight mb-8">
                {dropData.title}
              </h2>
              <p className="text-[17px] text-sericia-ink-soft leading-[1.8] mb-10">{dropData.story}</p>

              <Rule className="mb-10" />

              <dl className="grid grid-cols-3 gap-6 mb-10">
                <div>
                  <dt className="label mb-2">Price</dt>
                  <dd className="text-[22px] font-normal">
                    {isLocalized ? localPrice : `$${dropData.price_usd}`}
                  </dd>
                  {isLocalized && <p className="text-[11px] text-sericia-ink-mute mt-1">≈ ${dropData.price_usd} billed USD</p>}
                </div>
                <div>
                  <dt className="label mb-2">Weight</dt>
                  <dd className="text-[22px] font-normal">{dropData.weight_g}g</dd>
                </div>
                <div>
                  <dt className="label mb-2">Ships within</dt>
                  <dd className="text-[22px] font-normal">{dropData.ships_within_hours}h</dd>
                </div>
              </dl>

              <div className="mb-6">
                <p className="label mb-2">Availability</p>
                <p className="text-[15px]">
                  {soldOut
                    ? "Sold out — join the waitlist for the next drop"
                    : `${remaining} of ${dropData.total_units} remaining`}
                </p>
                <div className="mt-3 h-px bg-sericia-line relative overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-sericia-ink"
                    style={{ width: `${Math.max(4, (dropData.sold_units / dropData.total_units) * 100)}%` }}
                  />
                </div>
              </div>

              {soldOut ? (
                <div className="space-y-5">
                  <div className="border border-sericia-line p-6 text-center text-sericia-ink-soft text-[14px]">
                    This drop has sold out.
                  </div>
                  <WaitlistForm source="sold-out" country={country} />
                </div>
              ) : (
                <Button href={`/checkout?drop=${dropData.id}`} size="large" fullWidth>
                  Purchase — ${dropData.price_usd}
                </Button>
              )}

              <p className="text-[12px] text-sericia-ink-mute mt-5 leading-relaxed">
                EMS worldwide · ships within {dropData.ships_within_hours}h from Kyoto · Card checkout in USD.
                Duties & taxes calculated at destination.
              </p>
            </div>

            <div className="md:col-span-7">
              <div className="grid grid-cols-2 gap-4">
                <div className="aspect-[4/5] bg-gradient-to-br from-[#d4c9b0] to-[#8a7d5c] col-span-2" />
                <div className="aspect-square bg-gradient-to-br from-[#c9bfa3] to-[#6f6443]" />
                <div className="aspect-square bg-gradient-to-br from-[#e0d7bf] to-[#9f8f69]" />
              </div>
              <p className="label mt-5">Clockwise · Sencha · Miso · Shiitake</p>
            </div>
          </div>
        </Container>
      </section>

      {/* Makers */}
      <section className="border-b border-sericia-line bg-sericia-paper-card">
        <Container size="wide" className="py-24 md:py-32">
          <SectionHeading
            eyebrow="The makers"
            title="Three producers, one bundle."
            lede="Each drop brings together small Japanese craft producers whose surplus would otherwise be discarded. We pay them full price, photograph their work, and ship the bundle to a curious table around the world."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
            {[
              {
                name: "Yamane-en",
                craft: "Single-origin sencha",
                region: "Uji, Kyoto",
                note: "Fourth-generation grower. Surplus from the first flush of 2026.",
              },
              {
                name: "Kurashige Jozoten",
                craft: "Barrel-aged miso",
                region: "Aichi",
                note: "120-year-old cedar sheds. Over-ferment batch rescued from recycling.",
              },
              {
                name: "Yamagata Mori",
                craft: "Hand-dried shiitake",
                region: "Yamagata",
                note: "Bamboo-rack dried over five days. Sorted-out small caps with deeper flavour.",
              },
            ].map((m) => (
              <article key={m.name}>
                <div className="aspect-[4/5] bg-gradient-to-br from-[#cfc5aa] to-[#716649] mb-6" />
                <p className="label mb-2">{m.region}</p>
                <h3 className="text-[22px] font-normal mb-2">{m.name}</h3>
                <p className="text-[14px] text-sericia-ink-soft mb-3">{m.craft}</p>
                <p className="text-[14px] text-sericia-ink-soft leading-relaxed">{m.note}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      {/* Philosophy */}
      <section id="story" className="border-b border-sericia-line">
        <Container size="default" className="py-28 md:py-36 text-center">
          <Eyebrow>Our philosophy</Eyebrow>
          <p className="text-[24px] md:text-[32px] leading-[1.45] font-normal max-w-3xl mx-auto text-sericia-ink">
            Japan&apos;s craft food makers produce exceptional goods on small margins.
            Near-expiry or overrun stock often ends up discarded.
            Sericia finds that stock, curates it into a single drop, and ships it to
            tables around the world — at a price that is kind to everyone in the chain.
          </p>
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16 max-w-4xl mx-auto text-left">
            <StatBlock value="23+" label="Countries shipped" />
            <StatBlock value="48h" label="Dispatch from Kyoto" />
            <StatBlock value="100%" label="Producers paid full price" />
          </div>
        </Container>
      </section>

      {/* Waitlist */}
      <section id="waitlist" className="border-b border-sericia-line bg-sericia-paper-deep">
        <Container size="narrow" className="py-24 md:py-28 text-center">
          <Eyebrow>Early access</Eyebrow>
          <h2 className="text-[32px] md:text-[40px] leading-[1.15] font-normal tracking-tight mb-5">
            The next drop, twenty-four hours early.
          </h2>
          <p className="text-[15px] text-sericia-ink-soft leading-relaxed mb-10 max-w-prose mx-auto">
            Drops sell out in hours. Subscribers receive the release twenty-four hours before public sale,
            a photographed maker&apos;s note, and a small tasting card.
          </p>
          <WaitlistForm source="homepage" country={country} />
          <p className="text-[11px] text-sericia-ink-mute mt-5 tracking-wider uppercase">
            One email per drop · Unsubscribe in a click
          </p>
        </Container>
      </section>

      {/* How it works */}
      <section className="border-b border-sericia-line">
        <Container size="wide" className="py-24 md:py-32">
          <SectionHeading eyebrow="How it works" title="From Kyoto to your door in four steps." />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {[
              { n: "01", t: "Browse the drop", d: "One curated bundle per release. Every piece photographed, every producer named." },
              { n: "02", t: "Checkout", d: "Card or stablecoin via Crossmint. USD pricing, duties shown at destination." },
              { n: "03", t: "Dispatch", d: "Packed and posted from Kyoto within 48 hours by EMS with tracking." },
              { n: "04", t: "Delivered", d: "2–7 working days to most countries. Tasting card included." },
            ].map((s) => (
              <div key={s.n}>
                <p className="label mb-4">{s.n}</p>
                <h3 className="text-[18px] font-normal mb-3">{s.t}</h3>
                <p className="text-[14px] text-sericia-ink-soft leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* FAQ teaser */}
      <section id="faq" className="border-b border-sericia-line bg-sericia-paper-card">
        <Container size="default" className="py-24 md:py-28">
          <SectionHeading eyebrow="Frequently asked" title="Questions & considerations." />
          <div className="divide-y divide-sericia-line">
            {[
              {
                q: "Does “rescued” mean expired or second-grade?",
                a: "No. We only source surplus that is well within best-before, and from the exact same batches the producer sells at retail. Rescued refers to stock the producer could not sell before release windows closed — not quality.",
              },
              {
                q: "Can I buy individual items rather than the full bundle?",
                a: "Not at this time. Drops are photographed, labeled, and shipped as one curated set so that we can keep the per-unit logistics viable for small producers.",
              },
              {
                q: "Which countries do you currently ship to?",
                a: "Most of North America, the EU, UK, Australia, Singapore, Hong Kong, Canada, and Japan. See the shipping page for the full list and transit times.",
              },
              {
                q: "What happens if the drop is sold out when I arrive?",
                a: "Join the waitlist — subscribers are notified twenty-four hours before the next public release. We typically release a new drop every three to four weeks.",
              },
            ].map((item) => (
              <details key={item.q} className="group py-6">
                <summary className="flex items-start justify-between cursor-pointer list-none">
                  <span className="text-[17px] pr-8">{item.q}</span>
                  <span className="text-sericia-ink-mute text-[20px] leading-none group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="mt-4 text-[15px] text-sericia-ink-soft leading-relaxed max-w-prose">{item.a}</p>
              </details>
            ))}
          </div>
          <div className="mt-12">
            <Button href="/shipping" variant="link">Read the full shipping policy</Button>
          </div>
        </Container>
      </section>

      <SiteFooter />
    </>
  );
}
