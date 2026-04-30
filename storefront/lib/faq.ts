/**
 * F57 — FAQ data layer.
 *
 * Resolves FAQ entries for /faq with the same Payload-first / hardcoded-
 * fallback pattern as `payment-settings.ts` and `payload-settings.ts`:
 *
 *   1. Try `payload.find({ collection: "faqEntries" })` for the active
 *      locale, sorted by section + displayOrder.
 *   2. On any error (Payload offline, DB unreachable, build-time dummy
 *      DB) → return the hardcoded English fallback embedded below so
 *      /faq never 500s.
 *
 * Section ordering on the rendered page is FIXED in code (SECTION_ORDER)
 * because the customer journey reads top-down (Drops → Shipping → Payment
 * → Food → Returns → Company). Editors only control content within each
 * section, not section order itself.
 */

import { cache } from "react";
import { getPayloadClient } from "./payload";

export type FaqSectionId =
  | "drops"
  | "shipping"
  | "payment"
  | "food"
  | "returns"
  | "company";

export interface FaqEntry {
  id: string;
  section: FaqSectionId;
  sectionLabel: string;
  question: string;
  /** Lexical Editor State — pass directly to <RichText data={...} /> */
  answer: unknown;
  /** Plain text for FAQPage JSON-LD. */
  plainAnswer: string;
  displayOrder: number;
}

export interface FaqSection {
  id: FaqSectionId;
  label: string;
  items: FaqEntry[];
}

/** Display order is fixed in code — editor controls within-section order. */
export const SECTION_ORDER: readonly FaqSectionId[] = [
  "drops",
  "shipping",
  "payment",
  "food",
  "returns",
  "company",
] as const;

const SECTION_DEFAULT_LABEL: Record<FaqSectionId, string> = {
  drops: "Drops",
  shipping: "Shipping",
  payment: "Payment",
  food: "Food",
  returns: "Returns",
  company: "Company",
};

// ────────────────────────────────────────────────────────────────────────
// Hardcoded fallback (mirrors the original /faq SECTIONS array).
// Used when Payload is unreachable. Editor can override every entry by
// creating documents in the faqEntries collection.
// ────────────────────────────────────────────────────────────────────────

interface FallbackEntry {
  section: FaqSectionId;
  question: string;
  plain: string;
}

const FALLBACK_ENTRIES: readonly FallbackEntry[] = [
  // Drops
  {
    section: "drops",
    question: "What is a drop?",
    plain:
      "A drop is a limited, one-time release of rescued Japanese craft food. Each drop is curated from three to five small producers and sold on a first-come-first-served basis until sold out.",
  },
  {
    section: "drops",
    question: "Why are drops so small?",
    plain:
      "Rescued stock is finite by nature. We only list what a producer actually has on the shelf that would otherwise expire — there is no warehouse to refill from.",
  },
  {
    section: "drops",
    question: "How do I know when a new drop is released?",
    plain:
      "Join the next-drop waitlist from the home page. Subscribers receive the release 24 hours before public sale.",
  },
  // Shipping
  {
    section: "shipping",
    question: "Where do you ship?",
    plain:
      "We ship worldwide via Japan Post EMS with full tracking. Some countries have customs restrictions on certain ingredients — see /shipping for the full list.",
  },
  {
    section: "shipping",
    question: "How long does delivery take?",
    plain:
      "EMS to most countries lands within 5–10 business days. Asia 3–7, Europe and North America 7–10, rest 10–14. Customs holds can add 1–3 days.",
  },
  {
    section: "shipping",
    question: "Who pays customs duties?",
    plain:
      "The recipient pays any local customs duties or import VAT/GST. Sericia covers the EMS postage to your door.",
  },
  // Payment
  {
    section: "payment",
    question: "What payment methods do you accept?",
    plain:
      "Card (Visa, Mastercard, Amex), Apple Pay, Google Pay, and PayPal in supported markets. Crypto (USDC) appears as an alternative when enabled.",
  },
  {
    section: "payment",
    question: "Is the site secure?",
    plain:
      "Yes — payment is processed by Hyperswitch on top of Stripe/PayPal. Sericia never sees your card data; only payment processors handle it under PCI DSS.",
  },
  // Food
  {
    section: "food",
    question: "How long does the food keep?",
    plain:
      "Each drop has a per-item best-before date printed on the package. Most rescued items have at least 30 days remaining at dispatch; some longer.",
  },
  {
    section: "food",
    question: "Are allergens labelled?",
    plain:
      "Yes. Each item ships with the producer's allergen sheet in English; we also list known allergens on the drop page itself.",
  },
  {
    section: "food",
    question: "Is the food organic?",
    plain:
      "Some items are JAS-certified organic; others are made without certification by small makers. We label the JAS-certified items explicitly on each drop page.",
  },
  // Returns
  {
    section: "returns",
    question: "Can I return a drop?",
    plain:
      "Food cannot be returned for hygiene reasons. If a parcel arrives damaged or missing items, write to contact@sericia.com with photos within 7 days for a refund.",
  },
  {
    section: "returns",
    question: "What if my parcel is lost?",
    plain:
      "EMS includes tracking and insurance. If your parcel is marked lost by Japan Post, write to contact@sericia.com — we file the claim and refund or reship as preferred.",
  },
  // Company
  {
    section: "company",
    question: "Who operates Sericia?",
    plain:
      "Sericia is operated by Paradigm LLC (US Delaware). Full company details, business name, and contact are listed on the /tokushoho page (特定商取引法 disclosure).",
  },
  {
    section: "company",
    question: "How do I contact you?",
    plain:
      "Email contact@sericia.com — we reply within two Tokyo business days. For accessibility issues, accessibility@sericia.com replies within two business days.",
  },
];

/**
 * Build a Lexical-shaped richText node containing a single paragraph
 * with the supplied plain text. Used as the fallback `answer` when
 * Payload is unreachable, so the page renders something readable.
 *
 * Schema mirrors what `@payloadcms/richtext-lexical` emits for a
 * basic paragraph. Compatible with the renderer the consumer uses.
 */
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

function buildFallbackSections(): FaqSection[] {
  const grouped: Partial<Record<FaqSectionId, FaqEntry[]>> = {};
  FALLBACK_ENTRIES.forEach((entry, idx) => {
    const arr = grouped[entry.section] ?? (grouped[entry.section] = []);
    arr.push({
      id: `fallback-${entry.section}-${idx}`,
      section: entry.section,
      sectionLabel: SECTION_DEFAULT_LABEL[entry.section],
      question: entry.question,
      answer: plainTextToLexicalRichText(entry.plain),
      plainAnswer: entry.plain,
      displayOrder: idx * 10,
    });
  });

  return SECTION_ORDER.flatMap<FaqSection>((id) => {
    const items = grouped[id];
    if (!items || items.length === 0) return [];
    return [{
      id,
      label: items[0]?.sectionLabel ?? SECTION_DEFAULT_LABEL[id],
      items,
    }];
  });
}

// ────────────────────────────────────────────────────────────────────────
// Payload-backed fetcher (with cache + fallback)
// ────────────────────────────────────────────────────────────────────────

async function fetchFaqSections(locale: string): Promise<FaqSection[]> {
  let docs: unknown[] = [];

  try {
    const payload = await getPayloadClient();
    const result = await payload.find({
      // Cast: payload-types.ts is auto-regenerated only when `payload
      // generate:types` runs against the live DB. In our worktree-driven
      // workflow we add new collections to payload.config.ts but the
      // generated types haven't caught up yet. Casting `as never` here
      // bypasses the strict slug-union check for newly-added collections.
      // Phase 2: a CI step regenerates types post-deploy and the cast goes away.
      collection: "faqEntries" as never,
      depth: 0,
      limit: 200, // generous — never paginate; FAQ is finite
      sort: "displayOrder",
      where: { active: { equals: true } } as never,
      locale: locale as never,
      fallbackLocale: "en" as never,
    });
    docs = result?.docs ?? [];
  } catch (err) {
    console.error("[lib/faq] Payload fetch failed, hardcoded fallback will render", err);
    return buildFallbackSections();
  }

  if (docs.length === 0) {
    // Empty collection (fresh deploy, before seed) — fall back to hardcoded.
    return buildFallbackSections();
  }

  const grouped: Partial<Record<FaqSectionId, FaqEntry[]>> = {};
  for (const raw of docs) {
    const d = raw as {
      id?: string | number;
      section?: FaqSectionId;
      sectionLabel?: string;
      question?: string;
      answer?: unknown;
      plainAnswer?: string;
      displayOrder?: number;
    };
    if (!d.section || !d.question) continue;
    const items = grouped[d.section] ?? (grouped[d.section] = []);
    items.push({
      id: String(d.id ?? `${d.section}-${items.length}`),
      section: d.section,
      sectionLabel: d.sectionLabel?.trim() || SECTION_DEFAULT_LABEL[d.section],
      question: d.question,
      answer: d.answer ?? plainTextToLexicalRichText(d.plainAnswer ?? d.question),
      plainAnswer: d.plainAnswer ?? "",
      displayOrder: d.displayOrder ?? 0,
    });
  }

  // Sort each section's entries by displayOrder ascending.
  Object.values(grouped).forEach((arr) => arr?.sort((a, b) => a.displayOrder - b.displayOrder));

  return SECTION_ORDER.flatMap<FaqSection>((id) => {
    const items = grouped[id];
    if (!items || items.length === 0) return [];
    return [{
      id,
      label: items[0]?.sectionLabel ?? SECTION_DEFAULT_LABEL[id],
      items,
    }];
  });
}

/** Per-request memoised. Pass next-intl locale. */
export const getFaqSections = cache(fetchFaqSections);

/**
 * Flat list (all sections combined) — useful for FAQPage JSON-LD which
 * doesn't model sections, just a flat array of Question entities.
 */
export async function getFaqJsonLdEntities(locale: string): Promise<Array<{
  question: string;
  plainAnswer: string;
}>> {
  const sections = await getFaqSections(locale);
  return sections.flatMap((s) =>
    s.items.map((it) => ({
      question: it.question,
      plainAnswer: it.plainAnswer,
    })),
  );
}
