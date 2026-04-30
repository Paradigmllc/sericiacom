// Module marker — keeps tsc from declaring this in shared script namespace.
export {};

/**
 * F57 — Seed Payload `faqEntries` collection with the original /faq SECTIONS.
 *
 * Run once per environment to populate the FAQ collection from the
 * hardcoded fallback (defined in `lib/faq.ts`). Idempotent — re-runs skip
 * existing entries identified by (section, question) pair. Pass --reset
 * to wipe the collection and reseed.
 *
 * Required env (script reads from .env or shell):
 *   DATABASE_URL_PAYLOAD   — same Postgres instance Payload uses
 *   PAYLOAD_SECRET         — same secret Payload boots with
 *
 * Usage:
 *   npx tsx storefront/scripts/seed-faq-entries.ts          # idempotent
 *   npx tsx storefront/scripts/seed-faq-entries.ts --reset  # wipe + reseed
 */

import { getPayload } from "payload";
import config from "../payload.config";

const args = process.argv.slice(2);
const RESET = args.includes("--reset");

interface SeedEntry {
  section: "drops" | "shipping" | "payment" | "food" | "returns" | "company";
  sectionLabel: string;
  question: string;
  plainAnswer: string;
  displayOrder: number;
}

const SEED_ENTRIES: SeedEntry[] = [
  // Drops
  { section: "drops", sectionLabel: "Drops", displayOrder: 10,
    question: "What is a drop?",
    plainAnswer: "A drop is a limited, one-time release of rescued Japanese craft food. Each drop is curated from three to five small producers and sold on a first-come-first-served basis until sold out." },
  { section: "drops", sectionLabel: "Drops", displayOrder: 20,
    question: "Why are drops so small?",
    plainAnswer: "Rescued stock is finite by nature. We only list what a producer actually has on the shelf that would otherwise expire — there is no warehouse to refill from." },
  { section: "drops", sectionLabel: "Drops", displayOrder: 30,
    question: "How do I know when a new drop is released?",
    plainAnswer: "Join the next-drop waitlist from the home page. Subscribers receive the release 24 hours before public sale." },
  // Shipping
  { section: "shipping", sectionLabel: "Shipping", displayOrder: 10,
    question: "Where do you ship?",
    plainAnswer: "We ship worldwide via Japan Post EMS with full tracking. Some countries have customs restrictions on certain ingredients — see /shipping for the full list." },
  { section: "shipping", sectionLabel: "Shipping", displayOrder: 20,
    question: "How long does delivery take?",
    plainAnswer: "EMS to most countries lands within 5–10 business days. Asia 3–7, Europe and North America 7–10, rest 10–14. Customs holds can add 1–3 days." },
  { section: "shipping", sectionLabel: "Shipping", displayOrder: 30,
    question: "Who pays customs duties?",
    plainAnswer: "The recipient pays any local customs duties or import VAT/GST. Sericia covers the EMS postage to your door." },
  // Payment
  { section: "payment", sectionLabel: "Payment", displayOrder: 10,
    question: "What payment methods do you accept?",
    plainAnswer: "Card (Visa, Mastercard, Amex), Apple Pay, Google Pay, and PayPal in supported markets. Crypto (USDC) appears as an alternative when enabled." },
  { section: "payment", sectionLabel: "Payment", displayOrder: 20,
    question: "Is the site secure?",
    plainAnswer: "Yes — payment is processed by Hyperswitch on top of Stripe/PayPal. Sericia never sees your card data; only payment processors handle it under PCI DSS." },
  // Food
  { section: "food", sectionLabel: "Food", displayOrder: 10,
    question: "How long does the food keep?",
    plainAnswer: "Each drop has a per-item best-before date printed on the package. Most rescued items have at least 30 days remaining at dispatch; some longer." },
  { section: "food", sectionLabel: "Food", displayOrder: 20,
    question: "Are allergens labelled?",
    plainAnswer: "Yes. Each item ships with the producer's allergen sheet in English; we also list known allergens on the drop page itself." },
  { section: "food", sectionLabel: "Food", displayOrder: 30,
    question: "Is the food organic?",
    plainAnswer: "Some items are JAS-certified organic; others are made without certification by small makers. We label the JAS-certified items explicitly on each drop page." },
  // Returns
  { section: "returns", sectionLabel: "Returns", displayOrder: 10,
    question: "Can I return a drop?",
    plainAnswer: "Food cannot be returned for hygiene reasons. If a parcel arrives damaged or missing items, write to contact@sericia.com with photos within 7 days for a refund." },
  { section: "returns", sectionLabel: "Returns", displayOrder: 20,
    question: "What if my parcel is lost?",
    plainAnswer: "EMS includes tracking and insurance. If your parcel is marked lost by Japan Post, write to contact@sericia.com — we file the claim and refund or reship as preferred." },
  // Company
  { section: "company", sectionLabel: "Company", displayOrder: 10,
    question: "Who operates Sericia?",
    plainAnswer: "Sericia is operated by Paradigm LLC (US Delaware). Full company details, business name, and contact are listed on the /tokushoho page (特定商取引法 disclosure)." },
  { section: "company", sectionLabel: "Company", displayOrder: 20,
    question: "How do I contact you?",
    plainAnswer: "Email contact@sericia.com — we reply within two Tokyo business days. For accessibility issues, accessibility@sericia.com replies within two business days." },
];

/** Build a minimal Lexical paragraph for the rich `answer` field. */
function plainTextToLexicalRichText(plain: string): unknown {
  return {
    root: {
      type: "root",
      format: "",
      indent: 0,
      version: 1,
      children: [
        {
          type: "paragraph",
          format: "",
          indent: 0,
          version: 1,
          children: [
            {
              type: "text",
              format: 0,
              style: "",
              mode: "normal",
              text: plain,
              detail: 0,
              version: 1,
            },
          ],
          direction: "ltr",
        },
      ],
      direction: "ltr",
    },
  };
}

async function main() {
  console.log("[seed-faq] booting Payload...");
  // Cast Payload client to any: payload-types.ts hasn't been regenerated
  // with the new `faqEntries` collection union, so strict TS checks against
  // `payload.find/create/delete({ collection })` fail. We cast the client
  // and bypass type checks for this seed script. The runtime behaviour is
  // unaffected — Payload validates against the live schema, not TS types.
  // Phase 2 cleanup: post-deploy CI runs `payload generate:types` and we
  // remove this cast.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload = (await getPayload({ config })) as any;

  // Reset path: delete all existing entries first.
  if (RESET) {
    console.log("[seed-faq] --reset specified, deleting existing entries...");
    const existing = await payload.find({
      collection: "faqEntries",
      limit: 1000,
      pagination: false,
    });
    await Promise.all(
      existing.docs.map((doc: { id: string | number }) =>
        payload.delete({
          collection: "faqEntries",
          id: doc.id,
        }).catch((e: unknown) => {
          console.error(`[seed-faq] delete failed:`, e);
        }),
      ),
    );
    console.log(`[seed-faq] deleted ${existing.docs.length} existing entries`);
  }

  // Idempotent insert: skip when (section, question) already exists.
  let inserted = 0;
  let skipped = 0;
  for (const entry of SEED_ENTRIES) {
    const dupe = await payload.find({
      collection: "faqEntries",
      where: {
        and: [
          { section: { equals: entry.section } },
          { question: { equals: entry.question } },
        ],
      },
      limit: 1,
    });
    if (dupe.docs.length > 0 && !RESET) {
      skipped++;
      continue;
    }

    await payload.create({
      collection: "faqEntries",
      data: {
        section: entry.section,
        sectionLabel: entry.sectionLabel,
        question: entry.question,
        answer: plainTextToLexicalRichText(entry.plainAnswer),
        plainAnswer: entry.plainAnswer,
        displayOrder: entry.displayOrder,
        active: true,
      },
    });
    inserted++;
  }

  console.log(`[seed-faq] ✅ inserted ${inserted}, skipped ${skipped}`);
  console.log("[seed-faq] editor can now edit at /cms/admin/collections/faqEntries");
}

main().catch((err) => {
  console.error("[seed-faq] fatal:", err);
  process.exit(1);
});
