import type { Metadata } from "next";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import { Container, PageHero } from "../../components/ui";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Sericia collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <PageHero
        eyebrow="Legal"
        title="Privacy Policy"
        lede="How Sericia collects, uses, and protects your personal data. Last updated April 2026."
      />
      <Container size="narrow" className="py-20 md:py-28 prose-aesop">
        <h2>One — Data we collect</h2>
        <ul>
          <li><strong>Order data.</strong> Name, email, shipping address, phone (optional), order contents.</li>
          <li><strong>Payment data.</strong> Processed by Crossmint — we receive only the last four digits of the card and a transaction identifier.</li>
          <li><strong>Waitlist data.</strong> Email, country, locale, UTM parameters.</li>
          <li><strong>Analytics.</strong> Page views, referrer, anonymous device identifier, approximate country via Cloudflare.</li>
        </ul>

        <h2>Two — How we use it</h2>
        <ul>
          <li>To fulfil your order — shipping, customs declaration, tracking.</li>
          <li>To send order status and drop notification emails.</li>
          <li>To measure and improve the site.</li>
          <li>To comply with legal obligations such as tax records.</li>
        </ul>

        <h2>Three — Who we share it with</h2>
        <ul>
          <li>Crossmint (payments), Resend (email), Supabase (database), Cloudflare (CDN), Japan Post (EMS carrier).</li>
          <li>We do not sell your data to third parties.</li>
        </ul>

        <h2>Four — Your rights</h2>
        <p>
          Under GDPR, CCPA, and APPI you have the right to access, correct, delete, or export your personal data.
          Write to <a href="mailto:contact@sericia.com" className="underline-link">contact@sericia.com</a> and we
          will respond within thirty days.
        </p>

        <h2>Five — Data retention</h2>
        <p>Order data is retained for seven years for accounting and tax purposes. Waitlist data is kept until you unsubscribe.</p>

        <h2>Six — Cookies</h2>
        <p>
          We use a first-party <code>country</code> cookie for thirty days to localise pricing. Analytics are
          privacy-preserving and do not rely on third-party tracking cookies.
        </p>

        <h2>Seven — International transfers</h2>
        <p>Your data is processed in the United States, Japan, and the European Union under appropriate safeguards, including standard contractual clauses where applicable.</p>

        <h2>Eight — Contact</h2>
        <p>
          Data controller — Paradigm LLC. Write to{" "}
          <a href="mailto:contact@sericia.com" className="underline-link">contact@sericia.com</a>.
        </p>
      </Container>
      <SiteFooter />
    </>
  );
}
