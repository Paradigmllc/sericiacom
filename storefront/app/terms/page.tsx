import type { Metadata } from "next";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import { Container, PageHero } from "../../components/ui";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Sericia Terms of Service — rules for using sericia.com and purchasing drops.",
};

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <PageHero
        eyebrow="Legal"
        title="Terms of Service"
        lede="The terms that govern your use of sericia.com and every drop we release. Last updated April 2026."
      />
      <Container size="narrow" className="py-20 md:py-28 prose-aesop">
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
      </Container>
      <SiteFooter />
    </>
  );
}
