/**
 * Editorial content blocks for /tools/* pages.
 *
 * Every tool page wraps its calculator with ArticleBlocks so the page reads
 * like a Library entry (Aesop) rather than a bare form. Content is data-only
 * — no React — so individual tools stay tree-shakeable and the editorial
 * text can later move into Payload without a layout change.
 *
 * Structure per tool:
 *   • hero       — eyebrow + title shown in <CategoryHero>
 *   • breadcrumb — Home › Tools › Foo
 *   • introBlocks — 2-4 blocks of context BEFORE the calculator
 *   • afterBlocks — 3-6 blocks AFTER the calculator (deeper technique,
 *                   ratio tables, callout, common mistakes, related products)
 *   • related    — internal links shown at the very bottom
 *
 * Voice: Sericia editorial — calm, concrete, paragraphs-first, no exclamation,
 * no marketing clichés. Every concrete claim grounded in real producer or
 * brewing fact (no hallucinated certifications).
 */

import type { ArticleBlock } from "./article-blocks";

export type ToolSlug =
  | "tea-brewer"
  | "matcha-grade"
  | "miso-finder"
  | "dashi-ratio"
  | "shelf-life"
  | "shiitake-rehydrate"
  | "yuzu-substitute"
  | "ems-calculator";

export type ToolContent = {
  hero: { eyebrow: string; title: string; tone?: "tea" | "miso" | "mushroom" | "seasoning" | "drop" | "ink" | "paper" };
  breadcrumbLabel: string;
  /** One-sentence "what is this tool" appearing under the hero, before any other content. */
  whatItIs: string;
  /** 3-step quick tour rendered as a numbered list above the calculator. */
  quickTour: { label: string; body: string }[];
  /** 2 worked examples (input → output → why) rendered as a comparison strip below the calculator. */
  workedExamples: { input: string; output: string; commentary: string }[];
  introBlocks: ArticleBlock[];
  afterBlocks: ArticleBlock[];
  related: { label: string; url: string }[];
};

export const TOOLS_CONTENT: Record<ToolSlug, ToolContent> = {
  // ────────────────────────────────────────────────────────────────────────
  "tea-brewer": {
    hero: {
      eyebrow: "Tools · Brewing",
      title: "Japanese tea brewer.",
      tone: "tea",
    },
    breadcrumbLabel: "Japanese tea brewer",
    whatItIs: "A calculator that gives you the exact water temperature, leaf weight, and steep time for seven Japanese green teas — so the next cup tastes the way the producer intended.",
    quickTour: [
      { label: "Pick the tea", body: "Choose sencha, gyokuro, bancha, hojicha, genmaicha, or matcha (thin or thick) from the dropdown." },
      { label: "Set cup size", body: "Type your cup volume in millilitres. 150ml is one Japanese yunomi; 300ml is a Western mug." },
      { label: "Read the recipe", body: "We compute exact leaf grams, water temperature in Celsius, and steep time in seconds. Use a kitchen scale and a thermometer once — after that the eye learns." },
    ],
    workedExamples: [
      { input: "Sencha, 200ml cup", output: "75°C · 60s · 6g leaf", commentary: "Two cups for one person. Bring water to a boil, cool 2 minutes off-heat to land at 75°C, then pour over the leaves and decant fully at 60s." },
      { input: "Matcha — usucha, 70ml", output: "75°C · whisk · 2g leaf", commentary: "Sift matcha into a warm bowl, pour 70ml of 75°C water, whisk in a zigzag motion for 15 seconds until a thin foam crowns the surface." },
    ],
    introBlocks: [
      {
        type: "paragraph",
        size: "lead",
        body: "Three numbers decide whether a Japanese green tastes alive or pinched: water temperature, leaf weight, and steep time. Get any one wrong and the others stop mattering.",
      },
      {
        type: "imageText",
        imageSrc: "",
        imageAlt: "Sericia editorial — placeholder",
        imagePosition: "right",
        eyebrow: "Why temperature matters more than time",
        heading: "Below 80°C the tea relaxes. Above, it tightens.",
        body: "Steaming-rolled Japanese leaves release umami amino acids first, then catechins, then bitter polyphenols — in that order. Cooling boiling water by even 10°C lets the umami round out before bitterness arrives. Western teas are mostly pan-fired and tolerate boiling water; Japanese teas almost never do.",
        ctaLabel: "Browse Sericia teas",
        ctaUrl: "/products?category=tea",
        tone: "tea",
        ratio: "4/5",
      },
    ],
    afterBlocks: [
      {
        type: "heading",
        level: 2,
        eyebrow: "Reference",
        text: "Brewing parameters by tea.",
      },
      {
        type: "table",
        rowHeaders: true,
        headers: ["Tea", "Water °C", "Steep s", "Leaf g / 100ml"],
        rows: [
          ["Sencha", "75", "60", "3.0"],
          ["Gyokuro", "55", "120", "6.6"],
          ["Bancha", "85", "45", "3.0"],
          ["Hojicha", "95", "30", "3.0"],
          ["Genmaicha", "90", "45", "3.0"],
          ["Matcha · usucha", "75", "0 (whisk)", "2.0 / 70ml"],
          ["Matcha · koicha", "75", "0 (knead)", "4.0 / 30ml"],
        ],
        caption: "Sericia house parameters. Adjust ±5°C for personal taste; never above 85°C for sencha.",
      },
      {
        type: "callout",
        variant: "tip",
        title: "Three steeps, not one",
        body: "A 50g packet of single-origin sencha is meant for 15+ cups across 3 infusions per leaf. Second steep: 80°C, 15s. Third: 85°C, 30s. Decant fully every time — the last drop carries the sweetness, the leaves should not sit in residual water.",
      },
      {
        type: "paragraph",
        body: "Cold-brew is permitted, even encouraged in summer. Use 5g of sencha per 500ml of cold water and infuse 4 hours in the fridge. The result is sweeter and lower in caffeine than any hot brew, and forgiving of leaf you might otherwise have over-steeped.",
      },
      {
        type: "cta",
        variant: "card",
        label: "Shop tea",
        url: "/products?category=tea",
        caption: "Single-origin Uji sencha, Yame gyokuro, Kyoto hojicha and more — first-flush 2026 lots.",
      },
    ],
    related: [
      { label: "Matcha grade guide", url: "/tools/matcha-grade" },
      { label: "Single-origin sencha guide", url: "/journal/sencha-regions" },
      { label: "Hojicha — Charcoal-Roasted 50g", url: "/products/kyoto-hojicha-roasted-50g" },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────
  "matcha-grade": {
    hero: {
      eyebrow: "Tools · Tea",
      title: "Matcha grade guide.",
      tone: "tea",
    },
    breadcrumbLabel: "Matcha grade guide",
    whatItIs: "Three honest questions about how you'll use matcha, what you'll spend, and how you take bitterness — out comes a recommendation for ceremonial, premium, or culinary grade.",
    quickTour: [
      { label: "Answer three questions", body: "Use, budget, bitterness tolerance. There is no 'right' answer — the questions exist because grade is genuinely use-dependent." },
      { label: "Read the verdict", body: "We score each grade against your answers and surface the one that fits your context, with origin, harvest, and pricing context." },
      { label: "Cross-check the table", body: "The reference table below the calculator shows visual / aroma / mouthfeel signals you can verify on the tin before you buy." },
    ],
    workedExamples: [
      { input: "Daily lattes, $20-30 budget, balanced", output: "Premium grade", commentary: "First-flush Uji, less shaded than ceremonial, holds up against milk without losing colour. Roughly $25 for a 30g tin." },
      { input: "Whisked usucha, $40+ budget, mellow", output: "Ceremonial grade", commentary: "Three weeks of shade, stone-milled at glacial speed. Vivid jade green, marine sweetness, no grit. Sericia stocks a 30g Uji tin at this tier." },
    ],
    introBlocks: [
      {
        type: "paragraph",
        size: "lead",
        body: "There is no global certifying body for matcha grade. Producers and prefectures use overlapping vocabulary — ceremonial, premium, culinary — that means subtly different things in different mills. The honest test is process, not label.",
      },
      {
        type: "imageText",
        imageSrc: "",
        imageAlt: "Sericia editorial — placeholder",
        imagePosition: "left",
        eyebrow: "What ceremonial actually means",
        heading: "Three weeks of shade, then stone-milled the same week.",
        body: "Ceremonial-grade matcha begins life as tencha — leaves shaded for 21 to 30 days before harvest, then steamed, dried, and de-stemmed. The remaining leaf flesh is stone-milled at glacial speed (about 40g per hour per stone) so friction heat doesn't scorch the chlorophyll. Anything mass-milled at industrial speed is, by definition, culinary grade — regardless of the bag.",
        tone: "tea",
        ratio: "4/5",
      },
    ],
    afterBlocks: [
      {
        type: "heading",
        level: 2,
        eyebrow: "Reference",
        text: "Reading a matcha tin honestly.",
      },
      {
        type: "table",
        rowHeaders: true,
        headers: ["Signal", "Ceremonial", "Premium", "Culinary"],
        rows: [
          ["Color", "Vivid jade-green", "Bright green", "Dull olive-green"],
          ["Aroma", "Marine, sweet", "Grassy", "Tannic"],
          ["Mouthfeel", "Silky, no grit", "Smooth", "Slightly chalky"],
          ["Best for", "Whisked usucha / koicha", "Lattes, baking", "Smoothies, ice cream"],
          ["Sericia stock", "Uji 30g · ¥4,200", "—", "Uji 100g · ¥3,800"],
        ],
      },
      {
        type: "callout",
        variant: "warning",
        title: "Storage halves shelf life",
        body: "Matcha oxidises within 60 days of opening and irreversibly browns. Refrigerate the tin (not the freezer — moisture kills it), use within two months of breaking the seal, and never decant into a clear container.",
      },
      {
        type: "cta",
        variant: "card",
        label: "Shop Sericia matcha",
        url: "/products?category=tea",
        caption: "Uji ceremonial 30g + Uji culinary 100g, stone-ground from a 200-year-old mill.",
      },
    ],
    related: [
      { label: "Tea brewer (matcha sub-mode)", url: "/tools/tea-brewer" },
      { label: "Uji Matcha — Ceremonial 30g", url: "/products/uji-matcha-ceremonial-30g" },
      { label: "Uji Matcha — Culinary 100g", url: "/products/uji-matcha-culinary-100g" },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────
  "miso-finder": {
    hero: {
      eyebrow: "Tools · Pantry",
      title: "Miso finder.",
      tone: "miso",
    },
    breadcrumbLabel: "Miso finder",
    whatItIs: "Pick the dish you want to cook — we recommend which of the six main Japanese miso styles will land it best, with region, age, and a cooking note.",
    quickTour: [
      { label: "Pick the dish", body: "Eight common uses: light soup, hearty soup, ramen, fish glaze, marinade, dressing, pickling, slow stew." },
      { label: "See the recommendation", body: "We map the dish to the right miso style — shiro, aka, awase, hatcho, or saikyo — explaining why that style suits this use." },
      { label: "Read the cooking note", body: "Each style has a single line about how to actually use it (e.g. 'add shiro after heat off — boiling kills the aroma')." },
    ],
    workedExamples: [
      { input: "Light breakfast miso soup", output: "Shiro miso (Kyoto)", commentary: "High rice-koji ratio, low salt, sweet and mineral. Add it once the dashi is off the heat to keep the live cultures and aroma." },
      { input: "Eggplant glaze (dengaku)", output: "Saikyo miso (Kyoto)", commentary: "Very sweet, pale yellow, almost paste-like. Brush onto halved eggplants and broil — the sugar caramelises into a savoury crust." },
    ],
    introBlocks: [
      {
        type: "paragraph",
        size: "lead",
        body: "Japan has roughly 1,500 active miso producers and almost as many regional styles. The two questions that simplify the choice: which koji ferments the soybean, and how long does it sit in the barrel.",
      },
      {
        type: "imageText",
        imageSrc: "",
        imageAlt: "Sericia editorial — placeholder",
        imagePosition: "right",
        eyebrow: "Koji decides everything else",
        heading: "Rice koji softens. Mame koji deepens.",
        body: "The same soybean ages differently depending on which mould (koji) breaks it down. Rice-koji miso (kome-miso) — the most common — comes out lighter, sweeter, faster. Mame-koji miso (Aichi specialty) uses no rice at all; the soy ages on itself for two to three years and lands almost chocolate-deep. Barley-koji (mugi-miso) sits between them and is most common in Kyushu.",
        tone: "miso",
        ratio: "4/5",
      },
    ],
    afterBlocks: [
      {
        type: "heading",
        level: 2,
        eyebrow: "Reference",
        text: "Choosing miso by use.",
      },
      {
        type: "table",
        rowHeaders: true,
        headers: ["Use", "Style", "Aging", "Sericia equivalent"],
        rows: [
          ["Spring miso soup", "Saikyo shiro", "1–2 mo", "Saikyo 500g"],
          ["Daily soup", "Awase / shinshu", "6 mo", "Shinshu 500g"],
          ["Slow-cooked beans", "Sendai aka", "12 mo", "Sendai 500g"],
          ["Marinade for fish", "Saikyo + sake lees", "1 mo", "Saikyo 500g + DIY"],
          ["Glaze / dengaku", "Hatcho", "3 yr", "Hatcho block 300g"],
          ["Vegan ragu", "Aichi mame", "2 yr", "Aichi 500g"],
        ],
      },
      {
        type: "callout",
        variant: "tip",
        title: "Live cultures",
        body: "Real miso never gets autoclaved. Once you crack the lid the cultures keep evolving. Refrigerate, press a piece of parchment onto the surface to limit oxygen, and use within 6 months for peak flavour — though it stays edible far longer.",
      },
      {
        type: "paragraph",
        body: "Sericia stocks barrel-aged Aichi mame-miso (Kurashige Jozoten, 24 months in cedar), Shinshu shiro-miso, Saikyo shiro-miso, Sendai aka-miso, Hatcho block, and yuzu-miso paste. Drop scheduling rotates which is in stock; the waitlist gets first access.",
      },
      {
        type: "cta",
        variant: "card",
        label: "Shop miso",
        url: "/products?category=miso",
        caption: "Six styles, all from family producers. Mame-miso, hatcho block, saikyo, shinshu, sendai, yuzu paste.",
      },
    ],
    related: [
      { label: "Dashi ratio calculator", url: "/tools/dashi-ratio" },
      { label: "Aichi Mame-Miso 500g", url: "/products/aichi-mame-miso-500g" },
      { label: "Saikyo Shiro-Miso (Kyoto) 500g", url: "/products/saikyo-shiro-miso-500g" },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────
  "dashi-ratio": {
    hero: {
      eyebrow: "Tools · Stock",
      title: "Dashi ratio calculator.",
      tone: "seasoning",
    },
    breadcrumbLabel: "Dashi ratio calculator",
    whatItIs: "Six dashi styles × your water volume → the exact gram weights of kombu, katsuobushi, iriko, or shiitake. Stops the guess-work that turns dashi into pond water.",
    quickTour: [
      { label: "Pick a style", body: "Ichiban for clear soups, niban for braising, awase for everyday, kombu / iriko / shiitake for vegan and regional variants." },
      { label: "Set water volume", body: "In millilitres. 1 litre is one large pot; 500ml is one bowl of soup." },
      { label: "Weigh and brew", body: "We compute the exact gram weights of each ingredient based on the style's official ratio, plus a single-line method." },
    ],
    workedExamples: [
      { input: "Ichiban dashi, 1 litre", output: "10g kombu + 20g katsuobushi", commentary: "Cold-soak the kombu 30-60 min, bring to 60-65°C, remove the kombu. Take off heat, add the katsuobushi, strain after 60 seconds. Clear, gold-tinted, marine." },
      { input: "Vegan kombu dashi, 1 litre", output: "15g kombu only", commentary: "Cold-brew overnight in the fridge — never boil kombu, or it turns slimy. Pair with cold-rehydrated shiitake liquid for a fully plant-based stock with depth." },
    ],
    introBlocks: [
      {
        type: "paragraph",
        size: "lead",
        body: "Japanese dashi is the simplest stock in world cooking and the easiest to overcomplicate. Two ingredients, cold water, ten minutes — ichiban-dashi gets you most of the way to a Kyoto kaiseki kitchen.",
      },
      {
        type: "imageText",
        imageSrc: "",
        imageAlt: "Sericia editorial — placeholder",
        imagePosition: "right",
        eyebrow: "First and second extractions",
        heading: "Ichiban for soup. Niban for braising.",
        body: "Ichiban-dashi (first extraction) is brewed cold-start with kombu, brought to 60°C, then finished with a quick katsuobushi flash. Clean, marine, bright — used for clear soups and dipping sauces. Niban-dashi (second extraction) re-uses the spent kombu and katsuobushi for ten minutes at simmer, producing a darker, deeper stock fit for braising root vegetables and tofu.",
        tone: "seasoning",
        ratio: "4/5",
      },
    ],
    afterBlocks: [
      {
        type: "heading",
        level: 2,
        eyebrow: "Reference",
        text: "Ichiban-dashi by volume.",
      },
      {
        type: "table",
        rowHeaders: true,
        headers: ["Water", "Kombu", "Katsuobushi"],
        rows: [
          ["500 ml", "5 g", "10 g"],
          ["1 L", "10 g", "20 g"],
          ["2 L", "20 g", "40 g"],
        ],
        caption: "1% kombu, 2% katsuobushi by water weight. Variable to taste; never below 0.5% kombu.",
      },
      {
        type: "callout",
        variant: "tip",
        title: "Vegan substitute",
        body: "Replace katsuobushi with 5g of soaked dried shiitake per 500ml water. The flavour profile shifts from marine-clean to deep-earthy — different but unmistakably dashi. Sericia's mushroom stock cubes (Akita) compress the same idea into a single drop-in.",
      },
      {
        type: "paragraph",
        body: "Use first-extraction dashi within 24 hours of brewing. After that the kombu's glutamic acid begins to oxidise and the marine clarity drifts toward sourness. Freeze in 100ml ice-cube trays if you brew a full litre at once.",
      },
      {
        type: "cta",
        variant: "card",
        label: "Stock the dashi pantry",
        url: "/products?category=seasoning",
        caption: "Rishiri kombu, Rausu kombu, hand-shaved Kagoshima katsuobushi, Akita mushroom stock cubes.",
      },
    ],
    related: [
      { label: "Shiitake rehydration calculator", url: "/tools/shiitake-rehydrate" },
      { label: "Rishiri Kombu 100g", url: "/products/kombu-rishiri-100g" },
      { label: "Hand-Shaved Katsuobushi 50g", url: "/products/katsuobushi-shaved-50g" },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────
  "shelf-life": {
    hero: {
      eyebrow: "Tools · Storage",
      title: "Shelf life estimator.",
      tone: "paper",
    },
    breadcrumbLabel: "Shelf life estimator",
    whatItIs: "Tell us what you have and whether it's been opened — we estimate practical shelf life with a producer-grounded note. Far more useful than the conservative best-before stamps.",
    quickTour: [
      { label: "Pick the item", body: "Nine pantry staples — sencha, matcha, miso (shiro/aka), dried shiitake, dashi granules, yuzu kosho, shichimi, furikake." },
      { label: "Toggle 'opened'", body: "Sealed and opened windows differ by an order of magnitude — sealed sencha lasts two years; opened, three months." },
      { label: "Read the note", body: "Each item has a one-paragraph storage note explaining the chemistry and what aroma decline looks like before it's truly past use." },
    ],
    workedExamples: [
      { input: "Sealed sencha (vacuum pack)", output: "≈ 2 years", commentary: "Nitrogen-flushed vacuum packs hold sencha for two years before the catechin oxidation flattens flavour. Once opened, finish within three months." },
      { input: "Opened aka miso (refrigerated)", output: "≈ 1 year", commentary: "Long-aged red miso is nearly indestructible. Refrigerated, it stays usable for a year or more after opening — the flavour deepens, doesn't degrade." },
    ],
    introBlocks: [
      {
        type: "paragraph",
        size: "lead",
        body: "Best-before windows on Japanese pantry items are conservative. The producer's date assumes worst-case storage. With airtight containers, refrigeration, and a stable temperature the practical window is often two to four times longer.",
      },
      {
        type: "imageText",
        imageSrc: "",
        imageAlt: "Sericia editorial — placeholder",
        imagePosition: "left",
        eyebrow: "Why dry products last longer than the label says",
        heading: "Below 12% moisture, microbes can't grow.",
        body: "Tea, dried mushrooms, kombu and most furikake live below the 12% moisture threshold that limits mould and bacterial growth. The label's 'best-before' tracks aroma compound oxidation, not safety. A vacuum-sealed sencha six months past best-before is flatter, but not unsafe — Sericia's drops always ship with at least three months remaining on this conservative window.",
        tone: "paper",
        ratio: "4/5",
      },
    ],
    afterBlocks: [
      {
        type: "heading",
        level: 2,
        eyebrow: "Reference",
        text: "Practical shelf life by category.",
      },
      {
        type: "table",
        rowHeaders: true,
        headers: ["Item", "Unopened", "Opened (refrigerated)", "Indicator of decline"],
        rows: [
          ["Sencha", "12 months", "2 months", "Loss of green colour, hay aroma"],
          ["Matcha", "6 months", "60 days", "Olive-brown tone"],
          ["Dried shiitake", "24 months", "12 months", "Mustiness, soft cap"],
          ["Kombu", "36+ months", "Indefinite", "Salt bloom is fine"],
          ["Miso (live)", "Best-before + 6 mo", "6 months", "Surface mould (skim, edible below)"],
          ["Yuzu-kosho", "12 months", "3 months", "Brown crust, separation"],
          ["Wasanbon sugar", "Indefinite", "12 months", "Hard clumps (still usable)"],
        ],
      },
      {
        type: "callout",
        variant: "note",
        title: "Smell test outranks the label",
        body: "Japanese pantry staples do not become pathogenic when they go past best-before; they go flat. Trust your nose: aromatic dryness means usable, dustiness or sourness means compost.",
      },
      {
        type: "cta",
        variant: "card",
        label: "Browse the rescued pantry",
        url: "/products",
        caption: "Sericia ships only inside producer best-before windows — every drop with at least three months remaining.",
      },
    ],
    related: [
      { label: "Shiitake rehydration calculator", url: "/tools/shiitake-rehydrate" },
      { label: "Matcha grade guide", url: "/tools/matcha-grade" },
      { label: "EMS shipping calculator", url: "/tools/ems-calculator" },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────
  "shiitake-rehydrate": {
    hero: {
      eyebrow: "Tools · Mushroom",
      title: "Shiitake rehydration.",
      tone: "mushroom",
    },
    breadcrumbLabel: "Shiitake rehydration",
    whatItIs: "Calculator that returns water volume, soak time and finished mushroom weight by method — cold overnight gets you 4× the umami compounds of boiling water.",
    quickTour: [
      { label: "Pick a method", body: "Cold overnight (best), cold 6h at room temperature, warm 30 minutes (compromise), or boiling 15 minutes (avoid for dashi)." },
      { label: "Enter dried shiitake grams", body: "30g is the standard packet; 50g is a generous portion for four servings of dashi." },
      { label: "Read the plan", body: "We compute soak water volume, soak time, and finished weight (mushrooms expand 4-5×). Save the soaking liquid — it's vegan dashi." },
    ],
    workedExamples: [
      { input: "30g donko, cold overnight", output: "1.2L cold water · 8h fridge · 135g finished", commentary: "Maximum guanylate extraction. The mushrooms triple their dried weight; the soaking liquid becomes a deep umami stock you can use as the base of vegan dashi." },
      { input: "30g koshin, warm 30 min", output: "1.2L warm water · 30 min · ~120g finished", commentary: "Quick fix — about 60% of the umami a cold soak gets. Workable when time is tight, but pair with kombu to compensate." },
    ],
    introBlocks: [
      {
        type: "paragraph",
        size: "lead",
        body: "Hot water gives you a soft mushroom and a bland broth. Cold water gives you a chewy mushroom and a broth deep enough to be its own dashi. Time, not temperature, does the work.",
      },
      {
        type: "imageText",
        imageSrc: "",
        imageAlt: "Sericia editorial — placeholder",
        imagePosition: "right",
        eyebrow: "Why cold water wins",
        heading: "Glutamate dissolves at any temperature. Lentinan only at low.",
        body: "Lentinan and lentionin — the umami compounds responsible for shiitake's signature aroma — break down above 60°C. A six-hour cold-water rehydration in the fridge extracts those compounds intact, giving both a more aromatic mushroom and a stock you can use as vegan dashi. Hot rehydration takes 20 minutes but discards 70% of the aromatic yield.",
        tone: "mushroom",
        ratio: "4/5",
      },
    ],
    afterBlocks: [
      {
        type: "heading",
        level: 2,
        eyebrow: "Reference",
        text: "Cold rehydration by grade.",
      },
      {
        type: "table",
        rowHeaders: true,
        headers: ["Grade", "Soaking water", "Time (fridge)", "Yield"],
        rows: [
          ["Donko (thick cap)", "1 cup per 5 caps", "8 hours", "3× original weight"],
          ["Koshin (thin cap)", "1 cup per 10 caps", "4 hours", "2.5× original weight"],
          ["Sliced (any grade)", "1 cup per 30g", "1 hour", "2× original weight"],
        ],
      },
      {
        type: "callout",
        variant: "tip",
        title: "Save the soaking liquid",
        body: "Strain through a coffee filter, store in the fridge for up to 4 days, freeze longer. One cup of cold-rehydrated shiitake liquid replaces the katsuobushi flash in dashi for a fully vegan stock.",
      },
      {
        type: "paragraph",
        body: "Rehydrated shiitake hold up to about 30 minutes of simmer before they begin to break down. For longer braises, add them in the last quarter of cooking time — they'll absorb the surrounding flavour while keeping their own structure.",
      },
      {
        type: "cta",
        variant: "card",
        label: "Shop dried mushrooms",
        url: "/products?category=mushroom",
        caption: "Oita donko (Kunisaki bamboo-rack), Oita koshin, Akita maitake, Nagano eringi.",
      },
    ],
    related: [
      { label: "Dashi ratio calculator", url: "/tools/dashi-ratio" },
      { label: "Oita Donko Shiitake 50g", url: "/products/oita-donko-shiitake-50g" },
      { label: "Akita Mushroom-Stock Cubes", url: "/products/kiritanpo-stock-cubes-pack" },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────
  "yuzu-substitute": {
    hero: {
      eyebrow: "Tools · Citrus",
      title: "Yuzu substitute guide.",
      tone: "seasoning",
    },
    breadcrumbLabel: "Yuzu substitute guide",
    whatItIs: "Yuzu costs £80/kg outside Japan when you can find it fresh. Pick the dish you're cooking and we'll show the closest possible substitute — plus the honest match percentage.",
    quickTour: [
      { label: "Pick the dish", body: "Five common uses — ponzu, yuzu kosho paste, dressings, desserts, hot pot." },
      { label: "Read the substitute", body: "Each maps to a specific multi-citrus blend (e.g. Meyer lemon + grapefruit zest) with exact ratios." },
      { label: "Honest match %", body: "We tell you what fraction of yuzu's character the substitute captures. Some uses (yuzu sorbet, yuzu-cha) have no substitute — we say so." },
    ],
    workedExamples: [
      { input: "Ponzu sauce", output: "Lemon 60% + lime 30% + mandarin zest 10%", commentary: "Yuzu's defining quality is the grapefruit-like bitter top note. Lemon alone is one-dimensional; lime + mandarin zest rebuilds the complexity to about 60-70% of the real thing." },
      { input: "Yuzu sorbet", output: "No good substitute", commentary: "When yuzu is the dish — sorbet, yuzu-cha, yuzu-shio — there is no substitution, only an ingredient swap. Wait for Sericia's Tokushima yuzu drop or omit." },
    ],
    introBlocks: [
      {
        type: "paragraph",
        size: "lead",
        body: "Yuzu has no real substitute. The closest you can get to the floral, almost pine-resin top note is a 3:1 mix of Meyer lemon and Mandarin zest, but the warmth is a different temperature of citrus. When yuzu is essential, find yuzu.",
      },
      {
        type: "imageText",
        imageSrc: "",
        imageAlt: "Sericia editorial — placeholder",
        imagePosition: "left",
        eyebrow: "Why yuzu reads as 'unfamiliar' to Western palates",
        heading: "It's not a lemon-orange hybrid; it's an old citrus species.",
        body: "Yuzu (Citrus junos) diverged from the citrus family centuries before lemon and orange were bred. Its rind contains terpenes — limonene and γ-terpinene — in proportions found in no other commercial citrus. The aroma reads as cool, floral, almost menthol-adjacent. A handful of yuzu peel from Tokushima is genuinely a different flavour from anything in a Mediterranean kitchen.",
        tone: "seasoning",
        ratio: "4/5",
      },
    ],
    afterBlocks: [
      {
        type: "heading",
        level: 2,
        eyebrow: "Reference",
        text: "Best-effort substitutes by use.",
      },
      {
        type: "table",
        rowHeaders: true,
        headers: ["Use", "Best substitute", "Closest match %", "Sericia alternative"],
        rows: [
          ["Yuzu zest in dressing", "Meyer lemon + mandarin zest 3:1", "60%", "Yuzu marmalade 180g"],
          ["Yuzu juice in ponzu", "Meyer lemon juice + rice vinegar", "70%", "Use real yuzu if possible"],
          ["Yuzu-kosho (paste)", "Lemon zest + green chili + salt", "55%", "Yuzu-Kosho Green 100g"],
          ["Yuzu in baking", "Meyer lemon zest 1.5×", "50%", "Yuzu marmalade as glaze"],
          ["Yuzu peel as garnish", "No good substitute", "—", "Real yuzu or omit"],
        ],
        caption: "Match % is editorial estimate of aromatic similarity, not a precise measurement.",
      },
      {
        type: "callout",
        variant: "note",
        title: "When yuzu is the dish",
        body: "For yuzu-shio dressing, yuzu sorbet, or yuzu-cha, the yuzu is the entire dish — there is no substitution, only an ingredient swap. Sericia's yuzu-kosho and yuzu marmalade ship from Tokushima twice a year; the waitlist gets first access.",
      },
      {
        type: "cta",
        variant: "card",
        label: "Shop yuzu",
        url: "/products?category=seasoning",
        caption: "Yuzu-kosho (green and red), yuzu marmalade, yuzu-miso paste — all from Tokushima farmsteads.",
      },
    ],
    related: [
      { label: "Miso finder", url: "/tools/miso-finder" },
      { label: "Yuzu-Kosho — Green 100g", url: "/products/yuzu-kosho-green-100g" },
      { label: "Tokushima Yuzu Marmalade 180g", url: "/products/yuzu-marmalade-180g" },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────
  "ems-calculator": {
    hero: {
      eyebrow: "Tools · Shipping",
      title: "EMS shipping calculator.",
      tone: "ink",
    },
    breadcrumbLabel: "EMS shipping calculator",
    whatItIs: "Estimate Japan Post EMS international shipping cost in JPY and approximate USD across 23 destinations. Same rate brackets Sericia uses to ship every drop from Kyoto.",
    quickTour: [
      { label: "Pick a destination", body: "23 countries — North America, Europe, East Asia, Oceania, the Middle East, plus a handful in Latin America." },
      { label: "Set parcel weight", body: "Slider in grams (100g–5kg). 250g is one tea pouch; 750g is a Drop-bundle equivalent (sencha + miso + shiitake)." },
      { label: "Read the rate", body: "We look up the official EMS rate bracket and surface JPY price, approximate USD, transit window, and the zone." },
    ],
    workedExamples: [
      { input: "USA, 750g (Drop-bundle weight)", output: "¥3,100 · 4-7 days", commentary: "Lands in the ≤1kg US bracket. Sericia covers EMS at $200+, so a typical 4-product order ships free; smaller orders pay actual EMS, no markup." },
      { input: "Singapore, 200g", output: "¥1,900 · 3-5 days", commentary: "Single tea pouch to Zone 1. Closest market geographically — fastest transit and lowest rate from Japan to anywhere outside the country." },
    ],
    introBlocks: [
      {
        type: "paragraph",
        size: "lead",
        body: "EMS — Express Mail Service — is Japan Post's tracked international parcel network. It is the default channel for Sericia drops because it crosses customs faster than ordinary surface mail and stays cheaper than DHL or FedEx for parcels under two kilograms.",
      },
      {
        type: "imageText",
        imageSrc: "",
        imageAlt: "Sericia editorial — placeholder",
        imagePosition: "right",
        eyebrow: "Why EMS is the right tool for craft food",
        heading: "Customs paperwork pre-filled, transit ≤7 days, tracked end-to-end.",
        body: "EMS rates rise in steps of 250g, then 500g, then 1kg. A 200g sencha pouch costs the same to ship as a 240g one. The discontinuities create natural bundling thresholds — a 4-piece tea drop and a 2-piece miso drop both fit in the 1kg bracket. Sericia uses these brackets to set free-shipping minimums that are economically defensible without hidden subsidy.",
        tone: "ink",
        ratio: "4/5",
      },
    ],
    afterBlocks: [
      {
        type: "heading",
        level: 2,
        eyebrow: "Reference",
        text: "EMS rate brackets to common destinations.",
      },
      {
        type: "table",
        rowHeaders: true,
        headers: ["Destination", "≤500g", "≤1kg", "≤2kg", "Transit"],
        rows: [
          ["United States", "¥2,150", "¥3,100", "¥5,000", "4–7 days"],
          ["United Kingdom", "¥2,400", "¥3,400", "¥5,400", "3–6 days"],
          ["Germany", "¥2,400", "¥3,400", "¥5,400", "4–7 days"],
          ["France", "¥2,400", "¥3,400", "¥5,400", "4–7 days"],
          ["Australia", "¥2,250", "¥3,250", "¥5,250", "5–8 days"],
          ["Singapore", "¥1,900", "¥2,900", "¥4,500", "3–5 days"],
          ["Hong Kong", "¥1,600", "¥2,400", "¥3,800", "2–4 days"],
          ["Canada", "¥2,200", "¥3,200", "¥5,200", "5–8 days"],
        ],
        caption: "Indicative Sericia 2026 dispatch costs. Final price is set at parcel weighing in Kyoto.",
      },
      {
        type: "callout",
        variant: "info",
        title: "Free shipping at $200",
        body: "Sericia absorbs the EMS bill on orders above $200 USD because four-product bundles consistently fit the 1kg bracket — the marginal shipping cost is small relative to the customer's basket. Smaller orders pay actual EMS, no hidden margin added.",
      },
      {
        type: "paragraph",
        body: "Customs duties are calculated at destination and are the customer's responsibility on commercial parcels. For US and UK, Sericia files the FDA Prior Notice and EORI lookups before dispatch so the parcel does not stall in customs.",
      },
      {
        type: "cta",
        variant: "card",
        label: "Read the full shipping policy",
        url: "/shipping",
        caption: "Country-by-country transit times, customs paperwork, and damage / loss procedures.",
      },
    ],
    related: [
      { label: "Country guides", url: "/guides" },
      { label: "Shelf life estimator", url: "/tools/shelf-life" },
      { label: "Shipping policy", url: "/shipping" },
    ],
  },
};
