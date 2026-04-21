import type { Metadata } from "next";
import Link from "next/link";
import { COUNTRIES } from "@/lib/pseo-matrix";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import { Container, PageHero, SectionHeading, Rule } from "../../components/ui";

export const metadata: Metadata = {
  title: "Shipping Information",
  description: "EMS worldwide shipping from Japan — transit times, customs, and tracking.",
};

export default function ShippingPage() {
  return (
    <>
      <SiteHeader />
      <PageHero
        eyebrow="Shipping"
        title="From Japan to your door, within forty-eight hours of payment."
        lede="Every Sericia drop is packed and dispatched from Japan Post within forty-eight hours of payment confirmation. We ship exclusively via EMS — Japan Post International Express — the fastest and most tracked option available from Japan."
      />

      <Container size="wide" className="py-20 md:py-28">
        <SectionHeading eyebrow="Transit" title="How long it takes." />
        <div className="grid md:grid-cols-2 gap-x-16 gap-y-10">
          <div>
            <p className="label mb-3">Fastest lanes — two to four business days</p>
            <p className="text-[15px] text-sericia-ink-soft leading-relaxed">
              United States, Canada, Singapore, Hong Kong.
            </p>
          </div>
          <div>
            <p className="label mb-3">Europe — three to five business days</p>
            <p className="text-[15px] text-sericia-ink-soft leading-relaxed">
              United Kingdom, Germany, France, Netherlands, and the wider EU.
            </p>
          </div>
          <div>
            <p className="label mb-3">Oceania — three to five business days</p>
            <p className="text-[15px] text-sericia-ink-soft leading-relaxed">
              Australia and New Zealand.
            </p>
          </div>
          <div>
            <p className="label mb-3">Elsewhere — four to seven business days</p>
            <p className="text-[15px] text-sericia-ink-soft leading-relaxed">
              All other EMS-serviced destinations.
            </p>
          </div>
        </div>
        <p className="text-[13px] text-sericia-ink-mute mt-12 max-w-prose">
          Transit times are EMS published estimates. Customs delays can add one to five days.
        </p>
      </Container>

      <section className="border-t border-sericia-line bg-sericia-paper-card">
        <Container size="wide" className="py-20 md:py-28">
          <SectionHeading
            eyebrow="Cost"
            title="Shipping is included in the drop price."
            lede="Ninety-five United States dollars, flat. No surprise fees at checkout."
          />
        </Container>
      </section>

      <Container size="wide" className="py-20 md:py-28">
        <SectionHeading
          eyebrow="Customs"
          title="Duties and import taxes."
          lede="Your country may charge import duties, VAT, or food-import fees. These are paid by the recipient and are not included in the drop price."
        />
        <div className="grid md:grid-cols-2 gap-x-16 gap-y-8">
          <div>
            <p className="label mb-2">United States</p>
            <p className="text-[15px] text-sericia-ink-soft">Typically no duty below $800 — de minimis threshold.</p>
          </div>
          <div>
            <p className="label mb-2">United Kingdom</p>
            <p className="text-[15px] text-sericia-ink-soft">Twenty percent VAT plus potential duty above £135.</p>
          </div>
          <div>
            <p className="label mb-2">European Union</p>
            <p className="text-[15px] text-sericia-ink-soft">Import VAT plus potential duty above €150.</p>
          </div>
          <div>
            <p className="label mb-2">Australia</p>
            <p className="text-[15px] text-sericia-ink-soft">Ten percent GST.</p>
          </div>
        </div>
      </Container>

      <section className="border-t border-sericia-line bg-sericia-paper-card">
        <Container size="wide" className="py-20 md:py-28">
          <SectionHeading
            eyebrow="Tracking"
            title="Your EMS tracking number arrives by email."
            lede="Within forty-eight hours of payment. Track at trackingmore.com or your national postal service."
          />
          <p>
            <a href="https://global.trackingmore.com/" target="_blank" rel="noopener noreferrer" className="underline-link">
              global.trackingmore.com
            </a>
          </p>
        </Container>
      </section>

      <Container size="wide" className="py-20 md:py-28">
        <SectionHeading
          eyebrow="By country"
          title="Per-country shipping guides."
          lede="Detailed guides with transit times, allowed items, and producer notes for each destination we serve."
        />
        <ul className="grid md:grid-cols-3 gap-x-10 gap-y-4 max-w-3xl">
          {COUNTRIES.slice(0, 9).map((c) => (
            <li key={c.code}>
              <Link href={`/guides/${c.code}/sencha`} className="underline-link text-[15px]">
                Shipping to {c.name}
              </Link>
            </li>
          ))}
        </ul>
        <Rule className="mt-16" />
      </Container>
      <SiteFooter />
    </>
  );
}
