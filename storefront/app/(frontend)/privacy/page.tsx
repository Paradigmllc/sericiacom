import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ContentSidebar from "@/components/ContentSidebar";
import { Container, PageHero, Rule } from "@/components/ui";

// 1-hour ISR — page is mostly static editorial / brand copy.
export const revalidate = 3600;
export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Sericia collects, uses, and protects your personal data.",
  alternates: { canonical: "https://sericia.com/privacy" },
};

export default async function PrivacyPage() {
  const t = await getTranslations("pages.privacy");
  return (
    <>
      <SiteHeader />
      <PageHero
        eyebrow={t("eyebrow")}
        title={t("title")}
        lede="How Sericia collects, uses, and protects your personal data. Last updated April 2026."
      />
      <Container size="wide" className="py-20 md:py-28">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          <div className="flex-1 min-w-0 max-w-[680px] prose-aesop">
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

        <Rule className="my-14" />

        <p className="label mb-4">Also on Sericia</p>
        <ul className="not-prose grid grid-cols-1 md:grid-cols-2 gap-3 text-[14px]">
          <li><Link href="/terms" className="text-sericia-ink-soft hover:text-sericia-ink">Terms of Service</Link></li>
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
