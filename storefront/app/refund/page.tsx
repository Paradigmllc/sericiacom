import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund & Returns",
  description: "Sericia refund policy for perishable Japanese craft food drops.",
};

export default function RefundPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 font-serif text-sericia-ink prose prose-lg">
      <h1>Refund & Returns</h1>
      <p><em>Last updated: April 2026</em></p>

      <p>Sericia drops are rescued, limited-quantity food products. Our refund policy is designed to be fair to both customers and producers.</p>

      <h2>✓ Full refund</h2>
      <ul>
        <li>Package damaged in transit (photo within 48h of delivery).</li>
        <li>Product spoiled on arrival.</li>
        <li>Wrong item shipped.</li>
        <li>Package lost by EMS (confirmed by Japan Post tracking).</li>
      </ul>

      <h2>✓ Store credit</h2>
      <ul>
        <li>Not delivered within 30 days of dispatch due to customs delays (at our discretion).</li>
      </ul>

      <h2>✗ Not eligible for refund</h2>
      <ul>
        <li>Change of mind after dispatch.</li>
        <li>Flavor preferences (products are described in detail on the drop page).</li>
        <li>Customs duties or import fees charged by your country.</li>
        <li>Incorrect address provided at checkout.</li>
      </ul>

      <h2>How to request</h2>
      <ol>
        <li>Email <a href="mailto:contact@sericia.com">contact@sericia.com</a> within 7 days of delivery.</li>
        <li>Include your order ID and clear photos.</li>
        <li>We respond within 48 hours and process approved refunds within 7 business days to the original payment method.</li>
      </ol>

      <p className="text-sm text-sericia-ink/60">Refunds are issued in USD. Currency conversion differences are not refundable.</p>
    </main>
  );
}
