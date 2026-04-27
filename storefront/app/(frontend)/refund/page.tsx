import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ContentSidebar from "@/components/ContentSidebar";
import CategoryHero, { Breadcrumb } from "@/components/CategoryHero";
import { Container, Rule } from "@/components/ui";
import { webPageJsonLd } from "@/lib/page-jsonld";

export const metadata: Metadata = {
  title: "Refund & Returns | Sericia",
  description: "Sericia refund policy for perishable Japanese craft food drops.",
  alternates: { canonical: "https://sericia.com/refund" },
};

export default function RefundPage() {
  const jsonLd = webPageJsonLd({
    name: "Refund & returns",
    description: "Sericia refund policy for perishable Japanese craft food drops — eligibility for full refund, store credit, and the request workflow.",
    path: "/refund",
    breadcrumb: [{ label: "Home", path: "/" }, { label: "Refund & returns", path: "/refund" }],
  });
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />
      <CategoryHero eyebrow="Legal" title="Refund & returns." tone="paper" />
      <Container size="wide" className="pt-10 md:pt-14 pb-20 md:pb-28">
        <div className="mb-8">
          <Breadcrumb items={[{ label: "Home", url: "/" }, { label: "Refund & returns" }]} />
        </div>
        <p className="mb-12 text-[16px] text-sericia-ink-soft max-w-prose leading-relaxed">
          Sericia drops are rescued, limited-quantity food products. Our policy is designed to be fair to both customers and producers. Last updated April 2026.
        </p>
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          <div className="flex-1 min-w-0 max-w-[680px] prose-aesop">
        <h2>Eligible for a full refund</h2>
        <ul>
          <li>Package damaged in transit, with a photograph sent within forty-eight hours of delivery.</li>
          <li>Product spoiled on arrival.</li>
          <li>Wrong item shipped.</li>
          <li>Package lost by EMS, confirmed by Japan Post tracking.</li>
        </ul>

        <h2>Eligible for store credit</h2>
        <ul>
          <li>Not delivered within thirty days of dispatch due to customs delays, at our discretion.</li>
        </ul>

        <h2>Not eligible for refund</h2>
        <ul>
          <li>Change of mind after dispatch.</li>
          <li>Flavour preferences — products are described in detail on the drop page.</li>
          <li>Customs duties or import fees charged by your country.</li>
          <li>Incorrect address provided at checkout.</li>
        </ul>

        <h2>How to request</h2>
        <ol>
          <li>
            Write to{" "}
            <a href="mailto:contact@sericia.com" className="underline-link">contact@sericia.com</a>{" "}
            within seven days of delivery.
          </li>
          <li>Include your order reference and clear photographs.</li>
          <li>We respond within forty-eight hours and process approved refunds within seven business days to the original payment method.</li>
        </ol>

        <p className="text-[13px] text-sericia-ink-mute mt-8">
          Refunds are issued in United States dollars. Currency conversion differences are not refundable.
        </p>

        <Rule className="my-14" />

        <p className="label mb-4">Also on Sericia</p>
        <ul className="not-prose grid grid-cols-1 md:grid-cols-2 gap-3 text-[14px]">
          <li><Link href="/terms" className="text-sericia-ink-soft hover:text-sericia-ink">Terms of Service</Link></li>
          <li><Link href="/privacy" className="text-sericia-ink-soft hover:text-sericia-ink">Privacy policy</Link></li>
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
