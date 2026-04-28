import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { COUNTRIES } from "@/lib/pseo-matrix";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ContentSidebar from "@/components/ContentSidebar";
import CategoryHero, { Breadcrumb } from "@/components/CategoryHero";
import { Container, SectionHeading, Rule } from "@/components/ui";
import { webPageJsonLd } from "@/lib/page-jsonld";

export const metadata: Metadata = {
  title: "Shipping Information",
  description: "EMS worldwide shipping from Japan — transit times, customs, and tracking.",
  alternates: { canonical: "https://sericia.com/shipping" },
};

export default async function ShippingPage() {
  const t = await getTranslations("pages.shipping");
  const jsonLd = webPageJsonLd({
    name: "Shipping — EMS worldwide from Kyoto",
    description: "Sericia ships every drop from Japan via EMS within 48 hours of payment. Transit windows, customs paperwork, and tracking by destination country.",
    path: "/shipping",
    breadcrumb: [{ label: "Home", path: "/" }, { label: "Shipping", path: "/shipping" }],
  });
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />
      <CategoryHero
        eyebrow={t("hero_eyebrow")}
        title={t("hero_title")}
        tone="ink"
      />
      <Container size="wide" className="pt-10 md:pt-14 pb-20 md:pb-28">
        <div className="mb-8">
          <Breadcrumb items={[{ label: "Home", url: "/" }, { label: "Shipping" }]} />
        </div>
        <p className="mb-16 text-[17px] text-sericia-ink-soft max-w-prose leading-relaxed">
          Every Sericia drop is packed and dispatched from Japan Post within forty-eight hours of payment confirmation. We ship exclusively via EMS — Japan Post International Express — the fastest and most tracked option available from Japan.
        </p>
        <SectionHeading eyebrow={t("transit_eyebrow")} title={t("transit_title")} />
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
            eyebrow={t("cost_eyebrow")}
            title={t("cost_title")}
            lede="Ninety-five United States dollars, flat. No surprise fees at checkout."
          />
        </Container>
      </section>

      <Container size="wide" className="py-20 md:py-28">
        <SectionHeading
          eyebrow={t("customs_eyebrow")}
          title={t("customs_title")}
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
            eyebrow={t("tracking_eyebrow")}
            title={t("tracking_title")}
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
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          <div className="flex-1 min-w-0">
            <SectionHeading
              eyebrow={t("country_eyebrow")}
              title={t("country_title")}
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
          </div>
          <ContentSidebar
            relatedTools={[
              { href: "/tools/ems-calculator", label: "EMS shipping calculator" },
              { href: "/tools/shelf-life", label: "Shelf-life checker" },
              { href: "/tools/matcha-grade", label: "Matcha grade decoder" },
              { href: "/tools/miso-finder", label: "Miso type finder" },
            ]}
          />
        </div>
      </Container>
      <SiteFooter />
    </>
  );
}
