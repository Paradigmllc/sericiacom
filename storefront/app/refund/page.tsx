import type { Metadata } from "next";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import { Container, PageHero } from "../../components/ui";

export const metadata: Metadata = {
  title: "Refund & Returns",
  description: "Sericia refund policy for perishable Japanese craft food drops.",
};

export default function RefundPage() {
  return (
    <>
      <SiteHeader />
      <PageHero
        eyebrow="Legal"
        title="Refund & Returns"
        lede="Sericia drops are rescued, limited-quantity food products. Our policy is designed to be fair to both customers and producers. Last updated April 2026."
      />
      <Container size="narrow" className="py-20 md:py-28 prose-aesop">
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
      </Container>
      <SiteFooter />
    </>
  );
}
