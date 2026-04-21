import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Sericia collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 font-serif text-sericia-ink prose prose-lg">
      <h1>Privacy Policy</h1>
      <p><em>Last updated: April 2026</em></p>

      <h2>1. Data we collect</h2>
      <ul>
        <li><strong>Order data</strong>: name, email, shipping address, phone (optional), order contents.</li>
        <li><strong>Payment data</strong>: processed by Crossmint — we receive only the last 4 digits of the card and a transaction ID.</li>
        <li><strong>Waitlist data</strong>: email, country, locale, UTM parameters.</li>
        <li><strong>Analytics</strong>: page views, referrer, anonymous device ID, approximate country (via Cloudflare).</li>
      </ul>

      <h2>2. How we use it</h2>
      <ul>
        <li>Fulfill your order (shipping, customs declaration, tracking).</li>
        <li>Send order status and drop notification emails.</li>
        <li>Measure and improve the site.</li>
        <li>Comply with legal obligations (tax records).</li>
      </ul>

      <h2>3. Who we share it with</h2>
      <ul>
        <li>Crossmint (payments), Resend (email), Supabase (database), Cloudflare (CDN), Japan Post (EMS carrier).</li>
        <li>We do not sell your data to third parties.</li>
      </ul>

      <h2>4. Your rights (GDPR / CCPA / APPI)</h2>
      <p>You have the right to access, correct, delete, or export your personal data. Email <a href="mailto:contact@sericia.com">contact@sericia.com</a> and we will respond within 30 days.</p>

      <h2>5. Data retention</h2>
      <p>Order data is retained for 7 years for accounting and tax purposes. Waitlist data is kept until you unsubscribe.</p>

      <h2>6. Cookies</h2>
      <p>We use a first-party <code>country</code> cookie (30 days) to localize pricing. We use privacy-preserving analytics without third-party tracking cookies.</p>

      <h2>7. International transfers</h2>
      <p>Your data is processed in the United States, Japan, and the EU under appropriate safeguards (SCCs where applicable).</p>

      <h2>8. Contact</h2>
      <p>Data controller: Paradigm LLC · <a href="mailto:contact@sericia.com">contact@sericia.com</a></p>
    </main>
  );
}
