/**
 * Seed 5 editorial articles into Payload's `articles` collection.
 *
 * Scope: these are *editorial* pieces tied to the current drop and makers —
 * distinct from the static encyclopedic journal at /journal (backed by
 * lib/journal.ts). The static journal is technical / SEO-focused; these
 * Payload-managed articles are first-party story pieces that editors can
 * update through /cms/admin without a code push.
 *
 * Idempotent: natural key = slug (which is `unique: true` on the collection).
 * Safe to re-run.
 *
 * Usage:
 *   npm run seed:articles
 *
 * Required env:
 *   PAYLOAD_SECRET
 *   DATABASE_URL_PAYLOAD
 *
 * Design choices:
 *   • Bodies written as plain paragraphs (no headings/lists) so the Lexical
 *     JSON stays a flat paragraph tree — small, easy to review in Payload
 *     admin, editors can enrich later.
 *   • tldr left null — editors add a summary once they've read the piece.
 *     Avoids seeding tldrs that drift from the body over time.
 *   • `publishedAt` spread across Oct–Nov 2025 so the sort on /journal-like
 *     listings renders in a natural editorial cadence rather than a single
 *     burst timestamp.
 *   • `category` uses the Drop narrative split: "story" for origin/why,
 *     "journal" for maker profiles.
 *   • No heroImage, no author relationship — editors wire these in admin
 *     after real photography / user accounts exist.
 */

import { getPayload } from "payload";
import config from "../payload.config";

type ArticleSeed = {
  slug: string;
  title: string;
  category: "story" | "journal" | "guide" | "product" | "press";
  paragraphs: string[];
  tags: string[];
  publishedAt: string; // ISO
  seoTitle: string;
  seoDescription: string;
};

// ─── Lexical helpers ───────────────────────────────────────────────────────
// Payload 3 uses Lexical for richText fields. Seeded bodies are flat paragraph
// trees; editors can enrich with headings/lists/marks later in admin.

function lexParagraph(text: string) {
  return {
    type: "paragraph",
    version: 1,
    direction: null,
    format: "",
    indent: 0,
    textFormat: 0,
    textStyle: "",
    children: [
      {
        type: "text",
        text,
        version: 1,
        format: 0,
        style: "",
        mode: "normal",
        detail: 0,
      },
    ],
  };
}

function lexRoot(paragraphs: string[]) {
  // `as const` on the literal strings is required so TS narrows `format: ""`
  // to the literal type `""` instead of widening to `string`. Payload's Lexical
  // field contract types `root.format` as `"" | "left" | "start" | ...` — the
  // widened `string` breaks the payload.create() `data` overload.
  return {
    root: {
      type: "root" as const,
      format: "" as const,
      indent: 0,
      version: 1,
      direction: null,
      children: paragraphs.map(lexParagraph),
    },
  };
}

// ─── Seed data ─────────────────────────────────────────────────────────────

const SEEDS: ArticleSeed[] = [
  {
    slug: "the-first-drop",
    title: "The first drop: three rescued crafts, one curated box.",
    category: "story",
    tags: ["drop-01", "sencha", "miso", "shiitake"],
    publishedAt: "2025-10-08T09:00:00Z",
    seoTitle: "Sericia Drop No. 01 — Three Rescued Japanese Crafts",
    seoDescription:
      "The story behind Sericia's first drop: a single-origin Uji sencha, a barrel-aged miso from a 120-year shed, and hand-dried shiitake from Yamagata. Rescued surplus, full price paid to the makers, shipped worldwide.",
    paragraphs: [
      "Sericia began, quietly, with a question we kept asking small Japanese craft-food producers. If the first flush is done and a tea merchant unexpectedly drops an order, or if a cedar barrel ferments ten kilograms past a restaurant's quarterly allocation, or if shiitake caps are judged \"a little too small\" for the supermarket — what happens to that food?",
      "The answer, most of the time, is that it is discarded. Not because anything is wrong with it, but because the Japanese retail system is unforgiving about uniformity, packaging, and timing. A 100-gram tin labelled for May ships in May or it ships never.",
      "Drop No. 01 is our answer. Three craft items, from three small producers, all perfectly edible surplus that would otherwise not have reached a table. A first-flush Uji sencha from Yamane-en. A two-year barrel-aged miso from Kurashige Jozoten. Hand-dried, bamboo-rack shiitake from Yamagata Mori.",
      "We paid full retail price to all three. We photographed the bundle ourselves, hand-packed it in Kyoto, and shipped it by EMS. When this drop is gone, the next will be assembled from scratch with a different combination of producers and surplus. That is the entire business.",
    ],
  },
  {
    slug: "meet-yamane-en",
    title: "Meet Yamane-en: fourth-generation sencha, picked at peak.",
    category: "journal",
    tags: ["drop-01", "sencha", "uji", "makers"],
    publishedAt: "2025-10-15T09:00:00Z",
    seoTitle: "Yamane-en — Uji Single-Origin Sencha, First-Flush 2025",
    seoDescription:
      "Profile of Yamane-en, the fourth-generation Uji grower whose first-flush 2025 sencha forms the tea component of Sericia's Drop No. 01. The quieter side of Uji's 12-century tea tradition.",
    paragraphs: [
      "Yamane-en sits on a terraced slope forty minutes south of Kyoto Station, on the edge of the Uji growing district where Japan's sencha method was codified nearly three centuries ago. Kenji Yamane, the fourth generation to tend these rows, is unhurried about almost everything except the harvest window, which he treats as a two-week verdict on eleven months of pruning, shading and soil management.",
      "The tea in Drop No. 01 is from his first-flush 2025 picking — the ichibancha, harvested the first week of May. Single origin, single cultivar (Yabukita), steamed and rolled the same afternoon the leaf was picked. What you steep at 70°C in your kitchen has not blended with leaf from any other farm or any other week.",
      "The reason it is a rescued drop, not a retail drop, is mundane: a Tokyo wholesaler reduced its Uji allocation in June and Yamane-en had forty kilograms more packed inventory than the retail year would absorb. We bought it at full retail price, relabelled it for export, and the tea made its way from his shed to three Kyoto flights and the packers who send out Sericia drops.",
      "The broader point, Kenji says, is that Uji sencha is not rare because it is low-yield. It is rare because the logistics chain between a small grower and a table in Stockholm is full of gaps. Drop by drop, we are closing a few of them.",
    ],
  },
  {
    slug: "meet-kurashige-jozoten",
    title: "Inside Kurashige Jozoten's 120-year cedar miso shed.",
    category: "journal",
    tags: ["drop-01", "miso", "fermentation", "makers", "aichi"],
    publishedAt: "2025-10-22T09:00:00Z",
    seoTitle: "Kurashige Jozoten — Barrel-Aged Aichi Miso, 120-Year Shed",
    seoDescription:
      "Profile of Kurashige Jozoten, the family miso house in Aichi whose two-year barrel-aged paste anchors Sericia's Drop No. 01. Cedar barrels, generational fermentation, and why old wood tastes different.",
    paragraphs: [
      "Kurashige Jozoten's main fermentation shed has been continuously in use since 1904. Cedar barrels, some older than the shed itself, stand in rows so tall that a measuring pole is leaned against the wall for inventory. The wood, darkened and colonised after four generations of koji, is doing as much of the work as the soybeans are.",
      "The miso in Drop No. 01 is a two-year aged aka (red) miso, lifted from barrel number seventeen in February 2025. Aichi miso is mame-miso — made from pure soybeans and koji without the rice or barley that other regions use — and it ages longer and darker as a result. The paste in your jar is nearly chocolate-coloured and smells, uncannily, of very old port.",
      "The Kurashige family ferments more than the market can predictably buy, because adjusting a living cedar barrel downward is not really possible. A barrel produces what it produces; the surplus, which in a large cooperative would be blended back into commodity paste and sold as a lower grade, here stays intact. Those are the barrels we buy.",
      "There is a soft-spoken philosophical corollary in Aichi: the barrel, not the season, is the unit of authorship. Sericia agrees. The label on the Drop No. 01 jar names the barrel.",
    ],
  },
  {
    slug: "meet-yamagata-mori",
    title: "Meet Yamagata Mori: bamboo-rack shiitake, five-day dry.",
    category: "journal",
    tags: ["drop-01", "shiitake", "makers", "yamagata"],
    publishedAt: "2025-10-29T09:00:00Z",
    seoTitle: "Yamagata Mori — Hand-Dried Shiitake, Bamboo Rack, Five Days",
    seoDescription:
      "Profile of Yamagata Mori, the northeast Japan shiitake grower whose hand-dried caps make up the third component of Sericia's Drop No. 01. Bamboo-rack drying, sorting, and the case for small caps.",
    paragraphs: [
      "The northeast of Honshu in early winter is cold, dry and bright — which, for shiitake, is close to ideal. Yamagata Mori grows on log beds in a cedar-flanked clearing outside Yamanobe, harvesting small-to-medium caps twice a week and drying them on split-bamboo racks in a barn the family rebuilt in 2009.",
      "The shiitake in Drop No. 01 were dried over five days in late September 2025. Five days on bamboo, then a further forty-eight hours in an insulated shed at ambient humidity, then sorted by hand. The sorting is the part that produces surplus: supermarket buyers pay a premium for caps above six centimetres, and anything under is pulled aside.",
      "We take the small ones. They rehydrate faster, their flavour is concentrated, and three caps make a broth for four people. In the box you will find a small envelope with instructions for overnight cold rehydration — the technique that keeps the most of what the five-day dry put in.",
      "Yamagata Mori's operation is deliberately small: 600 oak logs, about 200 kilograms of dried shiitake a season. That it exists at all, Mori says, is because his son decided in 2019 that the farm would continue for a fifth generation. The small caps in your box are a side effect of that decision.",
    ],
  },
  {
    slug: "why-rescued",
    title: "Why 'rescued' doesn't mean 'second-rate'.",
    category: "story",
    tags: ["rescue", "surplus", "philosophy"],
    publishedAt: "2025-11-05T09:00:00Z",
    seoTitle: "Why Rescued Isn't Second-Rate — Sericia",
    seoDescription:
      "The word 'rescued' sometimes sounds like a euphemism. Here is what it actually means at Sericia: the same batches your producer sells at retail, bought at full price before commercial channels could reject them on timing.",
    paragraphs: [
      "The word 'rescued' sometimes does unfortunate work. It can suggest stale, second-grade, end-of-life — a discount bin with better lighting. None of that is what we mean.",
      "At Sericia, rescued describes timing, not quality. Every item in a drop is from the same batch your producer sells at retail. It has the same ingredients, the same packaging window, the same best-before. What makes it rescued is that some commercial channel that would have taken it — a wholesaler, a retailer, a restaurant group — didn't, for reasons unrelated to the food. A pulled order. A category restructure. A seasonal allocation mis-forecast by a week.",
      "In the Japanese food system, these surpluses tend to be small — tens of kilograms at a time — and the logistics of rerouting them into secondary retail are rarely worth the effort for the producer. The alternative, more often than anyone would like to admit, is disposal.",
      "Our job is to pay full retail price to the producer, photograph the item as it is, and ship it to a curious table abroad where the timing question is moot. That is the whole model. No discount bin. No seconds. No second-rate. The only thing that distinguishes a rescued batch from a retail batch is who it reaches, and when.",
      "We are aware the word still takes some explaining. That is why this page exists.",
    ],
  },
];

async function seed(): Promise<void> {
  if (!process.env.PAYLOAD_SECRET) {
    console.error("[seed-articles] PAYLOAD_SECRET is required.");
    process.exit(1);
  }
  if (!process.env.DATABASE_URL_PAYLOAD) {
    console.error("[seed-articles] DATABASE_URL_PAYLOAD is required.");
    process.exit(1);
  }

  console.log("[seed-articles] Initialising Payload...");
  const payload = await getPayload({ config });

  let created = 0;
  let skipped = 0;

  for (const s of SEEDS) {
    // Natural key: slug (unique on the collection).
    const existing = await payload.find({
      collection: "articles",
      where: { slug: { equals: s.slug } },
      limit: 1,
      pagination: false,
    });

    if (existing.totalDocs > 0) {
      skipped++;
      continue;
    }

    try {
      await payload.create({
        collection: "articles",
        data: {
          title: s.title,
          slug: s.slug,
          category: s.category,
          body: lexRoot(s.paragraphs),
          tags: s.tags.map((t) => ({ tag: t })),
          publishedAt: s.publishedAt,
          seo: {
            metaTitle: s.seoTitle,
            metaDescription: s.seoDescription,
          },
          _status: "published",
        },
      });
      created++;
      console.log(`[seed-articles] created — ${s.slug}`);
    } catch (err) {
      console.error(
        `[seed-articles] failed — ${s.slug}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  console.log(
    `[seed-articles] Done. created=${created}, skipped=${skipped}, total=${SEEDS.length}.`,
  );
  process.exit(0);
}

seed().catch((err) => {
  console.error("[seed-articles] Unhandled error:", err);
  process.exit(1);
});
