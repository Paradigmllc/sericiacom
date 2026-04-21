import type { Metadata } from "next";
import Link from "next/link";
import { COUNTRIES } from "@/lib/pseo-matrix";

export const metadata: Metadata = {
  title: "Shipping Information",
  description: "EMS worldwide shipping from Japan — transit times, customs, and tracking.",
};

export default function ShippingPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 font-serif text-sericia-ink prose prose-lg">
      <h1>Shipping</h1>
      <p><em>Last updated: April 2026</em></p>

      <h2>From Japan, to your door — within 48 hours of payment</h2>
      <p>Every Sericia drop is packed and dispatched from Japan Post within 48 hours of payment confirmation. We ship exclusively via <strong>EMS (Japan Post International Express)</strong> — the fastest and most tracked option available from Japan.</p>

      <h2>Transit times</h2>
      <ul>
        <li><strong>US, Canada, Singapore, Hong Kong</strong>: 2–4 business days</li>
        <li><strong>UK, Germany, France, Netherlands</strong>: 3–5 business days</li>
        <li><strong>Australia, New Zealand</strong>: 3–5 business days</li>
        <li><strong>Other countries</strong>: 4–7 business days</li>
      </ul>
      <p>Transit times are EMS published estimates. Customs delays can add 1–5 days.</p>

      <h2>Shipping cost</h2>
      <p>EMS shipping is <strong>included in the drop price</strong> ($95 USD flat). No surprise fees at checkout.</p>

      <h2>Customs & duties</h2>
      <p>Your country may charge import duties, VAT, or food-import fees. These are paid by the recipient and are not included in the drop price. Thresholds vary:</p>
      <ul>
        <li>US: typically no duty under $800 (de minimis).</li>
        <li>UK: 20% VAT + potential duty above £135.</li>
        <li>EU: import VAT + potential duty above €150.</li>
        <li>Australia: 10% GST.</li>
      </ul>

      <h2>Tracking</h2>
      <p>You will receive an EMS tracking number by email within 48 hours of payment. Track at <a href="https://global.trackingmore.com/" target="_blank" rel="noopener noreferrer">trackingmore.com</a> or your national postal service.</p>

      <h2>Per-country shipping guides</h2>
      <p>Detailed guides with transit times, allowed items, and producer notes for each country:</p>
      <ul>
        {COUNTRIES.slice(0, 9).map((c) => (
          <li key={c.code}>
            <Link href={`/guides/${c.code}/sencha`}>Shipping to {c.name}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
