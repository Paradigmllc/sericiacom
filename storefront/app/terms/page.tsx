import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Sericia Terms of Service — rules for using sericia.com and purchasing drops.",
};

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 font-serif text-sericia-ink prose prose-lg">
      <h1>Terms of Service</h1>
      <p><em>Last updated: April 2026</em></p>

      <h2>1. Who we are</h2>
      <p>Sericia is operated by Paradigm LLC, a company registered in the United States ("Sericia", "we", "our"). Contact: <a href="mailto:contact@sericia.com">contact@sericia.com</a>.</p>

      <h2>2. Using this site</h2>
      <p>By accessing sericia.com you agree to these Terms. If you do not agree, please stop using the site. We may update these Terms at any time; continued use constitutes acceptance.</p>

      <h2>3. Drops and purchases</h2>
      <p>Each "Drop" is a limited, one-time release of Japanese craft food rescued from surplus. Quantities are capped and sold on a first-come-first-served basis. Once sold out, a drop will not be restocked. Pricing is in U.S. dollars (USD). Local currency figures shown are indicative only; your card is charged in USD.</p>

      <h2>4. Age and eligibility</h2>
      <p>You must be at least 18 years old (or the age of majority in your country) to place an order.</p>

      <h2>5. Shipping</h2>
      <p>Drops ship from Japan via Japan Post EMS within 48 hours of payment confirmation. Delivery time varies by destination (typically 2–7 business days). You are responsible for any import duties, taxes, or customs fees charged by your country.</p>

      <h2>6. Food safety and allergens</h2>
      <p>Every drop includes producer-labeled expiry dates and ingredient lists. If you have allergies, read these before consuming. We do not guarantee the absence of trace allergens that may originate in producers' facilities.</p>

      <h2>7. Refunds</h2>
      <p>See our <a href="/refund">Refund Policy</a>. Because drops are highly perishable and limited, refund conditions are narrower than typical e-commerce.</p>

      <h2>8. Payments</h2>
      <p>Payments are processed by Crossmint, Inc. (fiat → USDC settlement). Card data never touches our servers. By paying you also accept Crossmint's terms.</p>

      <h2>9. Intellectual property</h2>
      <p>All site content, imagery, and copy are © Paradigm LLC unless otherwise noted. Producer photos and names are used with permission.</p>

      <h2>10. Disclaimer of warranties</h2>
      <p>The site and drops are provided "as is." To the fullest extent permitted by law, we disclaim all implied warranties including merchantability and fitness for a particular purpose.</p>

      <h2>11. Limitation of liability</h2>
      <p>Our maximum liability for any claim arising from a purchase shall not exceed the amount you paid for the order.</p>

      <h2>12. Governing law</h2>
      <p>These Terms are governed by the laws of the State of Delaware, United States. Disputes shall be resolved in the courts of Delaware.</p>

      <h2>13. Contact</h2>
      <p>Questions? Email <a href="mailto:contact@sericia.com">contact@sericia.com</a>.</p>
    </main>
  );
}
