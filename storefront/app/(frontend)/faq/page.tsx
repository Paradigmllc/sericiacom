import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ContentSidebar from "@/components/ContentSidebar";
import CategoryHero, { Breadcrumb } from "@/components/CategoryHero";
import { Container, Rule } from "@/components/ui";

// 1-hour ISR — page is mostly static editorial / brand copy.
export const revalidate = 3600;
/**
 * /faq — Frequently asked questions.
 *
 * Aesop-style single-column FAQ organised by customer journey (Drops,
 * Shipping, Payment, Food, Returns, Company). Each answer is plain-spoken
 * and links into the authoritative source (shipping page, refund page,
 * tokushoho, etc.) rather than repeating policy verbatim — so we only
 * maintain facts in one place.
 *
 * JSON-LD FAQPage schema is emitted for Google rich-result eligibility and
 * for AI search engine consumption (Perplexity/ChatGPT cite FAQ markup).
 */

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description:
    "Straight answers on drops, EMS shipping, Crossmint payments, food storage, refunds, and how Sericia works. Rescued Japanese craft food, shipped worldwide.",
  alternates: { canonical: "https://sericia.com/faq" },
};

type QA = { q: string; a: React.ReactNode; plain: string };
type Section = { eyebrow: string; items: QA[] };

const SECTIONS: Section[] = [
  {
    eyebrow: "Drops",
    items: [
      {
        q: "What is a drop?",
        plain:
          "A drop is a limited, one-time release of rescued Japanese craft food. Each drop is curated from three to five small producers and sold on a first-come-first-served basis until sold out.",
        a: (
          <>
            A drop is a limited, one-time release of rescued Japanese craft
            food. Each drop is curated from three to five small producers
            and sold on a first-come-first-served basis until sold out. We
            rescue near-expiry stock from small makers and pay them their
            full wholesale price — the full story lives on our{" "}
            <Link href="/about" className="underline-link">
              about page
            </Link>
            .
          </>
        ),
      },
      {
        q: "Why are drops so small?",
        plain:
          "Rescued stock is finite by nature. We only list what a producer actually has on the shelf that would otherwise expire — there is no warehouse to refill from.",
        a: (
          <>
            Rescued stock is finite by nature. We only list what a producer
            actually has on the shelf that would otherwise expire — there
            is no warehouse to refill from. If a drop sells out, we wait for
            the next producer surplus rather than ordering more.
          </>
        ),
      },
      {
        q: "How do I know when a new drop is released?",
        plain:
          "Join the next-drop waitlist from the home page. Subscribers receive the release 24 hours before public sale.",
        a: (
          <>
            Join the next-drop waitlist from the{" "}
            <Link href="/" className="underline-link">
              home page
            </Link>
            . Subscribers receive the release 24 hours before public sale,
            plus a photographed maker&apos;s note and tasting card.
          </>
        ),
      },
    ],
  },
  {
    eyebrow: "Shipping",
    items: [
      {
        q: "Where do you ship?",
        plain:
          "Sericia ships from Japan to 23+ countries via Japan Post EMS. Coverage includes North America, UK, EU, Australia, Singapore, Hong Kong, and most of East Asia.",
        a: (
          <>
            Sericia ships from Japan to 23+ countries via Japan Post EMS.
            Coverage includes North America, UK, EU, Australia, Singapore,
            Hong Kong, and most of East Asia. Country-by-country details
            live on the{" "}
            <Link href="/shipping" className="underline-link">
              shipping page
            </Link>
            .
          </>
        ),
      },
      {
        q: "How long does delivery take?",
        plain:
          "Typically 2–7 business days from Kyoto. EMS tracking is included on every order.",
        a: (
          <>
            Typically 2–7 business days from Kyoto. EMS tracking is
            included on every order. Our{" "}
            <Link href="/tools/ems-calculator" className="underline-link">
              EMS calculator
            </Link>{" "}
            gives a real-time estimate for your destination.
          </>
        ),
      },
      {
        q: "Who pays customs duties?",
        plain:
          "The recipient is responsible for any import duties, taxes, or customs fees levied by their country. We pre-fill the EMS paperwork to minimise delays.",
        a: (
          <>
            The recipient is responsible for any import duties, taxes, or
            customs fees levied by their country. We pre-fill the EMS
            paperwork to minimise delays. The{" "}
            <Link href="/shipping" className="underline-link">
              shipping page
            </Link>{" "}
            lists typical duty ranges by destination.
          </>
        ),
      },
    ],
  },
  {
    eyebrow: "Payment",
    items: [
      {
        q: "What payment methods do you accept?",
        plain:
          "Credit and debit cards via Crossmint. Your card is charged in USD; card data never touches our servers.",
        a: (
          <>
            Credit and debit cards via Crossmint. Your card is charged in
            USD and settled to us in USDC by Crossmint; card data never
            touches our servers. Local currency figures shown during
            browsing are indicative only.
          </>
        ),
      },
      {
        q: "Is the site secure?",
        plain:
          "Yes. All traffic is TLS-encrypted, payments are tokenised by Crossmint, and we do not store full card numbers.",
        a: (
          <>
            Yes. All traffic is TLS-encrypted, payments are tokenised by
            Crossmint, and we do not store full card numbers. Our{" "}
            <Link href="/privacy" className="underline-link">
              privacy policy
            </Link>{" "}
            has the full data-handling detail.
          </>
        ),
      },
    ],
  },
  {
    eyebrow: "Food",
    items: [
      {
        q: "How long does the food keep?",
        plain:
          "Each item carries the producer's original expiry date on the label. Typical ranges: sencha 6 months sealed, miso 12+ months refrigerated, dried shiitake 12+ months dry.",
        a: (
          <>
            Each item carries the producer&apos;s original expiry date on
            the label. Typical ranges: sencha 6 months sealed, miso 12+
            months refrigerated, dried shiitake 12+ months dry. Our{" "}
            <Link href="/tools/shelf-life" className="underline-link">
              shelf-life checker
            </Link>{" "}
            has the full matrix.
          </>
        ),
      },
      {
        q: "Are allergens labelled?",
        plain:
          "Yes — every drop includes producer-labelled ingredient lists and allergen declarations. If you have an allergy, read these before consuming.",
        a: (
          <>
            Yes — every drop includes producer-labelled ingredient lists
            and allergen declarations. If you have an allergy, read these
            before consuming. We cannot guarantee the absence of trace
            allergens originating in the producer&apos;s facility.
          </>
        ),
      },
      {
        q: "Is the food organic?",
        plain:
          "Varies by producer. Each product page lists certifications (JAS Organic, specific prefecture marks) where applicable.",
        a: (
          <>
            Varies by producer. Each product page lists certifications
            (JAS Organic, specific prefecture marks) where applicable.
            Not every producer we rescue from is certified organic — many
            small makers practise organic methods without the cost of
            certification.
          </>
        ),
      },
    ],
  },
  {
    eyebrow: "Returns",
    items: [
      {
        q: "Can I return a drop?",
        plain:
          "Because drops are perishable and limited, refund conditions are narrower than typical e-commerce. If an item arrives damaged or defective, we replace or refund.",
        a: (
          <>
            Because drops are perishable and limited, refund conditions are
            narrower than typical e-commerce. If an item arrives damaged or
            defective, we replace or refund — full detail on the{" "}
            <Link href="/refund" className="underline-link">
              refund policy
            </Link>{" "}
            page.
          </>
        ),
      },
      {
        q: "What if my parcel is lost?",
        plain:
          "Every EMS shipment is tracked and insured. If tracking shows no movement for more than ten days, write to us and we will investigate and replace at no cost.",
        a: (
          <>
            Every EMS shipment is tracked and insured. If tracking shows no
            movement for more than ten days, write to{" "}
            <a
              href="mailto:contact@sericia.com"
              className="underline-link"
            >
              contact@sericia.com
            </a>{" "}
            and we will investigate and replace at no cost.
          </>
        ),
      },
    ],
  },
  {
    eyebrow: "Company",
    items: [
      {
        q: "Who operates Sericia?",
        plain:
          "Sericia is operated by Paradigm LLC, a Delaware-registered company with Japan operations in Tokyo and a dispatch node in Kyoto.",
        a: (
          <>
            Sericia is operated by Paradigm LLC, a Delaware-registered
            company with Japan operations in Tokyo and a dispatch node in
            Kyoto. Full legal detail on the{" "}
            <Link href="/tokushoho" className="underline-link">
              特定商取引法 page
            </Link>
            .
          </>
        ),
      },
      {
        q: "How do I contact you?",
        plain:
          "Write to contact@sericia.com. Every message is read and replied to personally within two business days.",
        a: (
          <>
            Write to{" "}
            <a
              href="mailto:contact@sericia.com"
              className="underline-link"
            >
              contact@sericia.com
            </a>
            . Every message is read and replied to personally within two
            business days. For accessibility-specific questions, use{" "}
            <a
              href="mailto:accessibility@sericia.com"
              className="underline-link"
            >
              accessibility@sericia.com
            </a>
            .
          </>
        ),
      },
    ],
  },
];

export default async function FaqPage() {
  const t = await getTranslations("pages.faq");
  // Flat FAQPage JSON-LD for Google rich results + Perplexity/ChatGPT citation.
  // `inLanguage` + `isPartOf` are GEO quality signals: they help AI search engines
  // attribute the FAQ to Sericia as a primary source when quoting answers.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": "https://sericia.com/faq#faqpage",
    url: "https://sericia.com/faq",
    inLanguage: "en",
    isPartOf: {
      "@type": "WebSite",
      "@id": "https://sericia.com/#website",
      name: "Sericia",
      url: "https://sericia.com",
    },
    mainEntity: SECTIONS.flatMap((s) =>
      s.items.map((qa) => ({
        "@type": "Question",
        name: qa.q,
        acceptedAnswer: { "@type": "Answer", text: qa.plain },
      }))
    ),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />
      <CategoryHero eyebrow={t("eyebrow")} title={t("title")} tone="paper" />
      <Container size="wide" className="pt-10 md:pt-14 pb-20 md:pb-28">
        <div className="mb-8">
          <Breadcrumb items={[{ label: "Home", url: "/" }, { label: "FAQ" }]} />
        </div>
        <p className="mb-12 text-[16px] text-sericia-ink-soft max-w-prose leading-relaxed">
          Drops, EMS shipping, Crossmint payments, food storage, and refunds — laid out plainly. If your question isn&apos;t here, write to us.
        </p>
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          <div className="flex-1 min-w-0 max-w-[760px]">
            {SECTIONS.map((section, idx) => (
              <section
                key={section.eyebrow}
                className={idx > 0 ? "mt-16 md:mt-20" : ""}
              >
                <p className="label mb-6">{section.eyebrow}</p>
                <dl className="divide-y divide-sericia-line border-y border-sericia-line">
                  {section.items.map((qa) => (
                    <div key={qa.q} className="py-8 md:py-10">
                      <dt className="text-[20px] md:text-[22px] font-normal leading-snug tracking-tight mb-4">
                        {qa.q}
                      </dt>
                      <dd className="text-[15px] md:text-[16px] text-sericia-ink-soft leading-relaxed max-w-prose">
                        {qa.a}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}

            <Rule className="my-14" />

            <p className="label mb-4">Still stuck?</p>
            <p className="text-[16px] text-sericia-ink-soft leading-relaxed max-w-prose mb-6">
              Write to{" "}
              <a
                href="mailto:contact@sericia.com"
                className="underline-link"
              >
                contact@sericia.com
              </a>
              . One of us will reply personally — usually same day in
              Tokyo business hours.
            </p>

            <p className="label mb-4">Also on Sericia</p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[14px]">
              <li>
                <Link
                  href="/shipping"
                  className="text-sericia-ink-soft hover:text-sericia-ink"
                >
                  Shipping information
                </Link>
              </li>
              <li>
                <Link
                  href="/refund"
                  className="text-sericia-ink-soft hover:text-sericia-ink"
                >
                  Refund policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sericia-ink-soft hover:text-sericia-ink"
                >
                  Terms of service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-sericia-ink-soft hover:text-sericia-ink"
                >
                  Privacy policy
                </Link>
              </li>
              <li>
                <Link
                  href="/accessibility"
                  className="text-sericia-ink-soft hover:text-sericia-ink"
                >
                  Accessibility
                </Link>
              </li>
              <li>
                <Link
                  href="/sitemap"
                  className="text-sericia-ink-soft hover:text-sericia-ink"
                >
                  Sitemap
                </Link>
              </li>
            </ul>
          </div>
          <ContentSidebar />
        </div>
      </Container>
      <SiteFooter />
    </>
  );
}
