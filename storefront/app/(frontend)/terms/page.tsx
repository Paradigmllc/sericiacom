import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ContentSidebar from "@/components/ContentSidebar";
import CategoryHero, { Breadcrumb } from "@/components/CategoryHero";
import { Container, Rule } from "@/components/ui";
import { webPageJsonLd } from "@/lib/page-jsonld";

// 1-hour ISR — page is mostly static editorial / brand copy.
export const revalidate = 3600;
export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Sericia Terms of Service — rules for using sericia.com and purchasing drops.",
  alternates: { canonical: "https://sericia.com/terms" },
};

export default async function TermsPage() {
  const t = await getTranslations("pages.terms");
  const jsonLd = webPageJsonLd({
    name: "Terms of service",
    description: "Terms governing the use of sericia.com and every drop Sericia releases — operator details, pricing, drop scheduling, refunds, and limitation of liability.",
    path: "/terms",
    breadcrumb: [{ label: "Home", path: "/" }, { label: "Terms of service", path: "/terms" }],
  });
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
          <Breadcrumb items={[{ label: "Home", url: "/" }, { label: "Terms of service" }]} />
        </div>
        <p className="mb-12 text-[16px] text-sericia-ink-soft max-w-prose leading-relaxed">
          The terms that govern your use of sericia.com and every drop we release. Last updated April 2026.
        </p>
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          <div className="flex-1 min-w-0 max-w-[680px] prose-aesop">
        <h2>One — Who we are</h2>
        <p>
          Sericia is operated by Paradigm LLC, a company registered in the United States
          (&ldquo;Sericia&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;). Write to{" "}
          <a href="mailto:contact@sericia.com" className="underline-link">contact@sericia.com</a>.
        </p>

        <h2>Two — Using this site</h2>
        <p>
          By accessing sericia.com you agree to these Terms. If you do not agree, please stop using the site.
          We may update these Terms at any time; continued use constitutes acceptance.
        </p>

        <h2>Three — Drops and purchases</h2>
        <p>
          Each drop is a limited, one-time release of Japanese craft food rescued from surplus. Quantities are
          capped and sold on a first-come-first-served basis. Once sold out, a drop will not be restocked.
          Pricing is in United States dollars. Local currency figures shown are indicative only; your card is
          charged in USD.
        </p>

        <h2>Four — Age and eligibility</h2>
        <p>You must be at least eighteen years old, or the age of majority in your country, to place an order.</p>

        <h2>Five — Shipping</h2>
        <p>
          Drops ship from Japan via Japan Post EMS within forty-eight hours of payment confirmation. Delivery
          time varies by destination, typically two to seven business days. You are responsible for any import
          duties, taxes, or customs fees levied by your country.
        </p>

        <h2>Six — Food safety and allergens</h2>
        <p>
          Every drop includes producer-labelled expiry dates and ingredient lists. If you have allergies, read
          these before consuming. We do not guarantee the absence of trace allergens originating in producers&apos;
          facilities.
        </p>

        <h2>Seven — Refunds</h2>
        <p>
          See our <a href="/refund" className="underline-link">refund policy</a>. Because drops are highly
          perishable and limited, refund conditions are narrower than typical e-commerce.
        </p>

        <h2>Eight — Payments</h2>
        <p>
          Payments are processed by Crossmint, Inc. — fiat to USDC settlement. Card data never touches our
          servers. By paying you also accept Crossmint&apos;s terms.
        </p>

        <h2>Nine — Intellectual property</h2>
        <p>
          All site content, imagery, and copy are © Paradigm LLC unless otherwise noted. Producer photographs
          and names are used with permission.
        </p>

        <h2>Ten — Disclaimer of warranties</h2>
        <p>
          The site and drops are provided &ldquo;as is&rdquo;. To the fullest extent permitted by law, we
          disclaim all implied warranties including merchantability and fitness for a particular purpose.
        </p>

        <h2>Eleven — Limitation of liability</h2>
        <p>Our maximum liability for any claim arising from a purchase shall not exceed the amount you paid for the order.</p>

        <h2>Twelve — Governing law</h2>
        <p>
          These Terms are governed by the laws of the State of Delaware, United States. Disputes shall be
          resolved in the courts of Delaware.
        </p>

        <h2>Thirteen — Contact</h2>
        <p>
          Questions? Write to{" "}
          <a href="mailto:contact@sericia.com" className="underline-link">contact@sericia.com</a>.
        </p>

        <Rule className="my-14" />

        <p className="label mb-4">Also on Sericia</p>
        <ul className="not-prose grid grid-cols-1 md:grid-cols-2 gap-3 text-[14px]">
          <li><Link href="/privacy" className="text-sericia-ink-soft hover:text-sericia-ink">Privacy policy</Link></li>
          <li><Link href="/refund" className="text-sericia-ink-soft hover:text-sericia-ink">Refund policy</Link></li>
          <li><Link href="/shipping" className="text-sericia-ink-soft hover:text-sericia-ink">Shipping information</Link></li>
          <li><Link href="/journal" className="text-sericia-ink-soft hover:text-sericia-ink">Journal</Link></li>
          <li><Link href="/tools" className="text-sericia-ink-soft hover:text-sericia-ink">Tools</Link></li>
          <li><Link href="/guides" className="text-sericia-ink-soft hover:text-sericia-ink">Country guides</Link></li>
        </ul>
          </div>
          <ContentSidebar />
        </div>
      </Container>
      <SiteFooter />
    </>
  );
}
