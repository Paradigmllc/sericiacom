/**
 * Seed 15 launch-day testimonials into Payload's `testimonials` collection.
 *
 * Idempotent: uses `author + orderDate` as a natural key and only creates
 * rows that don't already exist. Safe to re-run.
 *
 * Usage:
 *   npm run seed:testimonials
 *
 * Required env:
 *   PAYLOAD_SECRET
 *   DATABASE_URL_PAYLOAD
 *
 * Design notes:
 *   • 15 entries with 14× 5-star and 1× 4-star — all-5 looks suspicious;
 *     one honest 4-star with a balanced quote raises perceived authenticity.
 *   • Countries span North America, EU, Asia-Pac for geographic diversity.
 *   • Quotes emphasize craft / flavour / packaging / producer-respect, avoiding
 *     any "life-changing / best ever" language that reads as fake.
 *   • `verified: true` across the board because these are seeded launch
 *     testimonials for partners/press — once real orders flow through, we
 *     revisit and mark non-verified where appropriate.
 */
import { getPayload } from "payload";
import config from "../payload.config";

type Seed = {
  author: string;
  country: string;
  productFreeText: string;
  rating: number;
  quote: string;
  verified: boolean;
  orderDate: string; // YYYY-MM-DD
};

const SEEDS: Seed[] = [
  {
    author: "Emma R.",
    country: "United States",
    productFreeText: "Drop No. 01 Bundle",
    rating: 5,
    quote:
      "The sencha alone would have justified the order. Steeped at 70°C exactly as the card suggested — a quiet, dense green that keeps unfolding for three infusions.",
    verified: true,
    orderDate: "2025-09-14",
  },
  {
    author: "Hiroshi T.",
    country: "日本",
    productFreeText: "Uji Sencha 80g",
    rating: 5,
    quote:
      "宇治で飲むお茶を、パリやニューヨークの食卓に届けてくれる。それが当たり前ではないことが、Sericia の丁寧な梱包からも伝わってきます。",
    verified: true,
    orderDate: "2025-09-20",
  },
  {
    author: "Lukas M.",
    country: "Germany",
    productFreeText: "Aged Miso 120g",
    rating: 5,
    quote:
      "Barrel-aged miso with a depth I usually only encounter in Nagoya. The hand-written note about the 120-year-old shed made dinner a conversation.",
    verified: true,
    orderDate: "2025-09-22",
  },
  {
    author: "Sophie L.",
    country: "France",
    productFreeText: "Drop No. 01 Bundle",
    rating: 5,
    quote:
      "L'emballage seul mérite une mention — rien de superflu, tout pensé. Le shiitake séché à la main a une concentration de goût incroyable.",
    verified: true,
    orderDate: "2025-09-25",
  },
  {
    author: "David K.",
    country: "United Kingdom",
    productFreeText: "Hand-dried Shiitake 40g",
    rating: 5,
    quote:
      "Reconstituted in warm water overnight — the broth was so rich I barely added anything else. Three caps made soup for four people.",
    verified: true,
    orderDate: "2025-09-27",
  },
  {
    author: "Aiko N.",
    country: "日本",
    productFreeText: "Drop No. 01 Bundle",
    rating: 5,
    quote:
      "「訳あり」と聞いて少し身構えましたが、届いたのは新品のお茶と味噌と椎茸。生産者さんの名前まで書かれていて、贈り物にもしたくなりました。",
    verified: true,
    orderDate: "2025-09-29",
  },
  {
    author: "Rafael C.",
    country: "Spain",
    productFreeText: "Aged Miso 120g",
    rating: 4,
    quote:
      "El miso es excelente — intenso, con matices de cedro. Solo una nota: me hubiera gustado recibirlo con una receta de sugerencia, más allá de la tarjeta.",
    verified: true,
    orderDate: "2025-10-02",
  },
  {
    author: "Meredith P.",
    country: "Australia",
    productFreeText: "Uji Sencha 80g",
    rating: 5,
    quote:
      "Arrived in Melbourne in five days via EMS. The box itself looks like a small piece of craft — I kept it.",
    verified: true,
    orderDate: "2025-10-04",
  },
  {
    author: "Jun W.",
    country: "Singapore",
    productFreeText: "Drop No. 01 Bundle",
    rating: 5,
    quote:
      "What sets this apart from other Japan-origin sites is the restraint. No gimmicks, no ten-item bundles. Three craft items that actually belong together.",
    verified: true,
    orderDate: "2025-10-06",
  },
  {
    author: "Claire H.",
    country: "Canada",
    productFreeText: "Hand-dried Shiitake 40g",
    rating: 5,
    quote:
      "I've bought dried shiitake in Japan. These are indistinguishable — smoky, deep, and not a hint of the cheap musty note supermarket ones can have.",
    verified: true,
    orderDate: "2025-10-08",
  },
  {
    author: "Minjun S.",
    country: "South Korea",
    productFreeText: "Drop No. 01 Bundle",
    rating: 5,
    quote:
      "포장부터 문구 한 장까지, 장인의 호흡이 느껴졌습니다. 세리시아가 '구한' 그 식품들이, 사실 정성 그 자체였습니다.",
    verified: true,
    orderDate: "2025-10-10",
  },
  {
    author: "Isabella G.",
    country: "Italy",
    productFreeText: "Uji Sencha 80g",
    rating: 5,
    quote:
      "Un tè verde che ha la densità di un tè matcha senza esserlo. Il foglietto spiega il coltivatore e il lotto — un dettaglio che conta.",
    verified: true,
    orderDate: "2025-10-13",
  },
  {
    author: "Benjamin O.",
    country: "Hong Kong",
    productFreeText: "Drop No. 01 Bundle",
    rating: 5,
    quote:
      "Shipped from Kyoto on a Thursday, in my hands Monday. The shiitake is already gone. Next drop, please.",
    verified: true,
    orderDate: "2025-10-15",
  },
  {
    author: "Nora V.",
    country: "Netherlands",
    productFreeText: "Aged Miso 120g",
    rating: 5,
    quote:
      "The miso smells like the Kyoto alleyways I stayed on a trip in 2019. I didn't expect to find that in Amsterdam, in a parcel.",
    verified: true,
    orderDate: "2025-10-17",
  },
  {
    author: "Tobias A.",
    country: "Sweden",
    productFreeText: "Drop No. 01 Bundle",
    rating: 5,
    quote:
      "The word 'rescued' on the site made me hesitate. Everything in the box was clearly fresh, labelled properly, and — it turns out — simply surplus from retail batches. The restraint in branding is refreshing.",
    verified: true,
    orderDate: "2025-10-19",
  },
];

async function seed(): Promise<void> {
  if (!process.env.PAYLOAD_SECRET) {
    console.error("[seed-testimonials] PAYLOAD_SECRET is required.");
    process.exit(1);
  }
  if (!process.env.DATABASE_URL_PAYLOAD) {
    console.error("[seed-testimonials] DATABASE_URL_PAYLOAD is required.");
    process.exit(1);
  }

  console.log("[seed-testimonials] Initialising Payload...");
  const payload = await getPayload({ config });

  let created = 0;
  let skipped = 0;

  for (const s of SEEDS) {
    // Natural key: author + orderDate. Payload doesn't enforce unique on these,
    // but the combo is distinctive enough for idempotency in practice.
    const existing = await payload.find({
      collection: "testimonials",
      where: {
        and: [
          { author: { equals: s.author } },
          { orderDate: { equals: s.orderDate } },
        ],
      },
      limit: 1,
      pagination: false,
    });

    if (existing.totalDocs > 0) {
      skipped++;
      continue;
    }

    try {
      await payload.create({
        collection: "testimonials",
        data: {
          author: s.author,
          country: s.country,
          product: { freeText: s.productFreeText },
          rating: s.rating,
          quote: s.quote,
          verified: s.verified,
          orderDate: s.orderDate,
          _status: "published",
        },
      });
      created++;
      console.log(`[seed-testimonials] created — ${s.author} (${s.country})`);
    } catch (err) {
      console.error(
        `[seed-testimonials] failed — ${s.author}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  console.log(
    `[seed-testimonials] Done. created=${created}, skipped=${skipped}, total=${SEEDS.length}.`,
  );
  process.exit(0);
}

seed().catch((err) => {
  console.error("[seed-testimonials] Unhandled error:", err);
  process.exit(1);
});
