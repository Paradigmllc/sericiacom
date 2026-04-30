import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { buildHomepageMetadata } from "@/lib/payload-homepage";
import { getSiteSettings } from "@/lib/payload-settings";
import type { Locale } from "@/i18n/routing";
import WaitlistForm from "@/components/WaitlistForm";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Container, Eyebrow, Button, SectionHeading, Rule } from "@/components/ui";
import { formatPricePPP, PPP } from "@/lib/ppp";
import { getCurrentDrop } from "@/lib/drops";
import CinematicHero from "@/components/CinematicHero";
import CinematicVideo from "@/components/CinematicVideo";
import FadeIn from "@/components/FadeIn";
import { listActiveProducts } from "@/lib/products";
import ProductCard from "@/components/ProductCard";
import StatCountUp from "@/components/StatCountUp";
import DropCountdown from "@/components/DropCountdown";
import TestimonialsWall from "@/components/TestimonialsWall";
import PressStrip from "@/components/PressStrip";
import HomepageBlocks from "@/components/HomepageBlocks";
import SamplerBanner from "@/components/SamplerBanner";

// 60-second ISR. Pre-F5 we forced dynamic to keep the country cookie fresh,
// but cookies() already opts the page into per-request rendering at runtime,
// so removing force-dynamic just lets Next.js cache the post-cookie payload
// for repeat visitors at the same edge. That eliminates the 502 storm seen
// during deploy transitions when /products+/ both hit Medusa simultaneously.
export const revalidate = 60;

/**
 * generateMetadata — overlays editor-controlled Payload homepage SEO on top of
 * the layout.tsx defaults. If Payload is empty or unavailable, the layout
 * defaults win (silent fallback by design).
 */
export async function generateMetadata(): Promise<Metadata> {
  return buildHomepageMetadata();
}

export default async function Home() {
  // F39: parallelise independent awaits. Pre-F39 these were 6 sequential
  // awaits costing ~4.8s cold render (each network/IO round-trip stacked
  // serially). cookies() and getLocale() can run together; once locale is
  // known, the four data fetches (settings, translations, drop, products)
  // are independent and run together via Promise.all. Result: cold render
  // bounded by the slowest single fetch (~1s) instead of the sum.
  const [cookieStore, localeRaw] = await Promise.all([cookies(), getLocale()]);
  const country = cookieStore.get("country")?.value ?? "us";
  const locale = localeRaw as Locale;

  // Three-tier resolution: CMS (editor) → next-intl messages (locale) →
  // hardcoded English (emergency). `getTranslations("home_sections")` is
  // the second tier and is required for /ja /fr /ar etc. to render local
  // copy when the editor hasn't filled CMS yet.
  // `getSiteSettings` is cached per-request — same instance the layout's
  // SettingsProvider got, so this is free if layout already resolved it.
  const [settings, tHome, drop, products] = await Promise.all([
    getSiteSettings(locale),
    getTranslations("home_sections"),
    getCurrentDrop(),
    listActiveProducts(),
  ]);
  const hc = settings?.homepageCopy;
  const currentDropProducts = products.slice(0, 3);
  const mostLoved = products.slice(3, 6);

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
    // Fallback has no close_at — DropCountdown null-safe degrades to hidden state.
    // The Supabase row supplies the real closes_at when the drop is provisioned.
    closes_at: null as string | null,
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
      <CinematicHero />

      {/* Aesop-style complimentary sample strip. Always visible — converts
          the editorial promise (CLAUDE.md s14-14 Phase 1 plan) into an on-site
          surface that every visitor sees on first scroll. */}
      <SamplerBanner variant="wide" />

      {/* Press strip — "As mentioned in" row. Silent-fails to null when the
          Payload collection is empty, so the layout stays clean pre-seed. */}
      <PressStrip />

      {/* Current drop featured products */}
      {currentDropProducts.length > 0 && (
        <section className="border-b border-sericia-line">
          <Container size="wide" className="py-24 md:py-32">
            <FadeIn>
              <SectionHeading
                eyebrow={hc?.currentDrop?.eyebrow?.trim() || tHome("current_drop_eyebrow")}
                title={hc?.currentDrop?.title?.trim() || tHome("current_drop_title")}
                lede={hc?.currentDrop?.lede?.trim() || tHome("current_drop_lede")}
              />
            </FadeIn>
            <div className="grid grid-cols-1 md:grid-cols-3 bg-sericia-line gap-px">
              {currentDropProducts.map((p, i) => (
                <FadeIn key={p.id} delay={i * 0.08}>
                  <ProductCard product={p} />
                </FadeIn>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Drop detail */}
      <section id="drop" className="border-b border-sericia-line bg-sericia-paper-card">
        <Container size="wide" className="py-24 md:py-32">
          {dropData.closes_at && !soldOut && (
            <FadeIn>
              <div className="mb-16 md:mb-20 pb-12 border-b border-sericia-line">
                <DropCountdown closesAt={dropData.closes_at} label="Drop closes in" />
              </div>
            </FadeIn>
          )}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-16">
            <FadeIn as="div" className="md:col-span-5">
              <Eyebrow>{hc?.featuredBundle?.eyebrow?.trim() || tHome("featured_bundle_eyebrow")}</Eyebrow>
              <h2 className="text-[36px] md:text-[44px] leading-[1.15] font-normal tracking-tight mb-8">
                {dropData.title}
              </h2>
              <p className="text-[17px] text-sericia-ink-soft leading-[1.8] mb-10">{dropData.story}</p>

              <Rule className="mb-10" />

              <dl className="grid grid-cols-3 gap-6 mb-10">
                <div>
                  <dt className="label mb-2">Price</dt>
                  <dd className="text-[22px] font-normal tabular-nums">
                    {isLocalized ? localPrice : `$${dropData.price_usd}`}
                  </dd>
                  {isLocalized && <p className="text-[11px] text-sericia-ink-mute mt-1">≈ ${dropData.price_usd} billed USD</p>}
                </div>
                <div>
                  <dt className="label mb-2">Weight</dt>
                  <dd className="text-[22px] font-normal tabular-nums">{dropData.weight_g}g</dd>
                </div>
                <div>
                  <dt className="label mb-2">Ships within</dt>
                  <dd className="text-[22px] font-normal tabular-nums">{dropData.ships_within_hours}h</dd>
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
            </FadeIn>

            <FadeIn delay={0.1} className="md:col-span-7">
              {/* F1 Cinematic — gradient placeholders replaced with optional
                  loop videos. Editor adds URLs in Payload (Site Settings →
                  homepageCopy.featuredBundle); empty = brand gradient + grain. */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <CinematicVideo
                    src={hc?.featuredBundle?.heroVideoUrl}
                    poster={hc?.featuredBundle?.heroPosterUrl}
                    ratio="4/5"
                    tone="drop"
                    caption="Drop No. 01"
                  />
                </div>
                <CinematicVideo
                  src={hc?.featuredBundle?.secondaryVideoUrlA}
                  poster={hc?.featuredBundle?.secondaryPosterUrlA}
                  ratio="square"
                  tone="tea"
                  parallax={false}
                />
                <CinematicVideo
                  src={hc?.featuredBundle?.secondaryVideoUrlB}
                  poster={hc?.featuredBundle?.secondaryPosterUrlB}
                  ratio="square"
                  tone="seasoning"
                  parallax={false}
                />
              </div>
              <p className="label mt-5">Clockwise · Sencha · Miso · Shiitake</p>
            </FadeIn>
          </div>
        </Container>
      </section>

      {/* Most loved */}
      {mostLoved.length > 0 && (
        <section className="border-b border-sericia-line">
          <Container size="wide" className="py-24 md:py-32">
            <FadeIn>
              <SectionHeading
                eyebrow={hc?.mostLoved?.eyebrow?.trim() || tHome("most_loved_eyebrow")}
                title={hc?.mostLoved?.title?.trim() || tHome("most_loved_title")}
              />
            </FadeIn>
            <div className="grid grid-cols-1 md:grid-cols-3 bg-sericia-line gap-px">
              {mostLoved.map((p, i) => (
                <FadeIn key={p.id} delay={i * 0.08}>
                  <ProductCard product={p} />
                </FadeIn>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Makers */}
      <section className="border-b border-sericia-line bg-sericia-paper-card">
        <Container size="wide" className="py-24 md:py-32">
          <FadeIn>
            <SectionHeading
              eyebrow={hc?.makers?.eyebrow?.trim() || tHome("makers_eyebrow")}
              title={hc?.makers?.title?.trim() || tHome("makers_title")}
              lede={hc?.makers?.lede?.trim() || tHome("makers_lede")}
            />
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
            {(hc?.makers?.items && hc.makers.items.length > 0
              ? hc.makers.items.map((m) => ({
                  name: m.name,
                  craft: m.craft,
                  region: m.region,
                  note: m.note,
                  videoUrl: m.videoUrl ?? null,
                  posterUrl: m.posterUrl ?? null,
                  tone: (m.tone ?? "tea") as
                    | "tea"
                    | "miso"
                    | "mushroom"
                    | "seasoning"
                    | "paper"
                    | "ink",
                }))
              : [
                  {
                    name: "Yamane-en",
                    craft: "Single-origin sencha",
                    region: "Uji, Kyoto",
                    note: "Fourth-generation grower. Surplus from the first flush of 2026.",
                    videoUrl: null,
                    posterUrl: null,
                    tone: "tea" as const,
                  },
                  {
                    name: "Kurashige Jozoten",
                    craft: "Barrel-aged miso",
                    region: "Aichi",
                    note: "120-year-old cedar sheds. Over-ferment batch rescued from recycling.",
                    videoUrl: null,
                    posterUrl: null,
                    tone: "miso" as const,
                  },
                  {
                    name: "Yamagata Mori",
                    craft: "Hand-dried shiitake",
                    region: "Yamagata",
                    note: "Bamboo-rack dried over five days. Sorted-out small caps with deeper flavour.",
                    videoUrl: null,
                    posterUrl: null,
                    tone: "mushroom" as const,
                  },
                ]
            ).map((m, i) => (
              <FadeIn as="article" key={m.name} delay={i * 0.08}>
                {/* F1 Cinematic per maker — empty videoUrl falls back to a
                    tone-tuned gradient + grain (no broken layout). */}
                <CinematicVideo
                  src={m.videoUrl}
                  poster={m.posterUrl}
                  ratio="4/5"
                  tone={m.tone}
                  playWhenInView
                  className="mb-6"
                />
                <p className="label mb-2">{m.region}</p>
                <h3 className="text-[22px] font-normal mb-2">{m.name}</h3>
                <p className="text-[14px] text-sericia-ink-soft mb-3">{m.craft}</p>
                <p className="text-[14px] text-sericia-ink-soft leading-relaxed">{m.note}</p>
              </FadeIn>
            ))}
          </div>
        </Container>
      </section>

      {/* F1 Cinematic interstitial — full-bleed video break between Makers and
          Philosophy. Renders only if editor has set a videoUrl in Payload
          (Site Settings → homepageCopy.interstitial). Empty = section omitted
          entirely (no empty band shipped, by design). */}
      {hc?.interstitial?.videoUrl && (
        <section
          aria-label="Cinematic interstitial"
          className="relative border-b border-sericia-line"
        >
          <CinematicVideo
            src={hc.interstitial.videoUrl}
            poster={hc.interstitial.posterUrl}
            ratio="21/9"
            tone="ink"
            caption={hc.interstitial.caption ?? undefined}
            darken={false}
          />
        </section>
      )}

      {/* Philosophy */}
      <section id="story" className="border-b border-sericia-line">
        <Container size="default" className="py-28 md:py-36 text-center">
          <FadeIn>
            <Eyebrow>{hc?.philosophy?.eyebrow?.trim() || tHome("philosophy_eyebrow")}</Eyebrow>
            <p className="text-[24px] md:text-[32px] leading-[1.45] font-normal max-w-3xl mx-auto text-sericia-ink">
              {hc?.philosophy?.body?.trim() || tHome("philosophy_body")}
            </p>
          </FadeIn>
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16 max-w-4xl mx-auto text-left">
            <FadeIn>
              <div className="text-[28px] md:text-[36px] font-normal leading-none mb-2 tabular-nums">
                <StatCountUp value={23} suffix="+" />
              </div>
              <div className="label">Countries shipped</div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div className="text-[28px] md:text-[36px] font-normal leading-none mb-2 tabular-nums">
                <StatCountUp value={48} suffix="h" />
              </div>
              <div className="label">Dispatch from Kyoto</div>
            </FadeIn>
            <FadeIn delay={0.2}>
              <div className="text-[28px] md:text-[36px] font-normal leading-none mb-2 tabular-nums">
                <StatCountUp value={100} suffix="%" />
              </div>
              <div className="label">Producers paid full price</div>
            </FadeIn>
          </div>
        </Container>
      </section>

      {/* Editor-controlled middle (Payload-driven blocks). Slots between
          Philosophy (belief, coded) and TestimonialsWall (proof, Payload-driven
          from testimonials collection). Empty/failed fetch → silently no-ops. */}
      <HomepageBlocks country={country} />

      {/* Testimonials — between philosophy (belief) and waitlist (invitation).
          Quiet social proof after we've told our story. */}
      <TestimonialsWall />

      {/* Waitlist */}
      <section id="waitlist" className="border-b border-sericia-line bg-sericia-paper-deep">
        <Container size="narrow" className="py-24 md:py-28 text-center">
          <FadeIn>
            <Eyebrow>{hc?.waitlist?.eyebrow?.trim() || tHome("waitlist_eyebrow")}</Eyebrow>
            <h2 className="text-[32px] md:text-[40px] leading-[1.15] font-normal tracking-tight mb-5">
              {hc?.waitlist?.title?.trim() || tHome("waitlist_title")}
            </h2>
            <p className="text-[15px] text-sericia-ink-soft leading-relaxed mb-10 max-w-prose mx-auto">
              {hc?.waitlist?.body?.trim() || tHome("waitlist_body")}
            </p>
            <WaitlistForm source="homepage" country={country} />
            <p className="text-[11px] text-sericia-ink-mute mt-5 tracking-wider uppercase">
              {hc?.waitlist?.footnote?.trim() || tHome("waitlist_footnote")}
            </p>
          </FadeIn>
        </Container>
      </section>

      {/* How it works */}
      <section className="border-b border-sericia-line">
        <Container size="wide" className="py-24 md:py-32">
          <FadeIn>
            <SectionHeading
              eyebrow={hc?.howItWorks?.eyebrow?.trim() || tHome("how_it_works_eyebrow")}
              title={hc?.howItWorks?.title?.trim() || tHome("how_it_works_title")}
            />
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {(hc?.howItWorks?.steps && hc.howItWorks.steps.length > 0
              ? hc.howItWorks.steps.map((step) => ({
                  n: step.number,
                  t: step.title,
                  d: step.body,
                }))
              : [
                  { n: "01", t: "Browse the drop", d: "One curated bundle per release. Every piece photographed, every producer named." },
                  { n: "02", t: "Checkout", d: "Card or stablecoin via Crossmint. USD pricing, duties shown at destination." },
                  { n: "03", t: "Dispatch", d: "Packed and posted from Kyoto within 48 hours by EMS with tracking." },
                  { n: "04", t: "Delivered", d: "2–7 working days to most countries. Tasting card included." },
                ]
            ).map((s, i) => (
              <FadeIn key={s.n} delay={i * 0.08}>
                <p className="label mb-4">{s.n}</p>
                <h3 className="text-[18px] font-normal mb-3">{s.t}</h3>
                <p className="text-[14px] text-sericia-ink-soft leading-relaxed">{s.d}</p>
              </FadeIn>
            ))}
          </div>
        </Container>
      </section>

      {/* FAQ teaser */}
      <section id="faq" className="border-b border-sericia-line bg-sericia-paper-card">
        <Container size="default" className="py-24 md:py-28">
          <FadeIn>
            <SectionHeading
              eyebrow={hc?.faq?.eyebrow?.trim() || tHome("faq_eyebrow")}
              title={hc?.faq?.title?.trim() || tHome("faq_title")}
            />
          </FadeIn>
          <div className="divide-y divide-sericia-line">
            {(hc?.faq?.items && hc.faq.items.length > 0
              ? hc.faq.items.map((item) => ({ q: item.q, a: item.a }))
              : [
                  {
                    q: "Does \"rescued\" mean expired or second-grade?",
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
                ]
            ).map((item) => (
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
            <Button href={hc?.faq?.ctaUrl?.trim() || "/shipping"} variant="link">
              {hc?.faq?.ctaLabel?.trim() || tHome("faq_cta")}
            </Button>
          </div>
        </Container>
      </section>

      <SiteFooter />
    </>
  );
}
