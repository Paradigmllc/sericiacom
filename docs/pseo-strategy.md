#### 📋 目次

| # | セクション |
|---|-----------|
| 1 | [Strategic principles](#str-1) |
| 2 | [Keyword research methodology (DeepSeek V4 scoring)](#str-2) |
| 3 | [GEO optimization (AI search engines)](#str-3) |
| 4 | [Article structure template](#str-4) |
| 5 | [Visual component library (Magic UI + Recharts)](#str-5) |
| 6 | [CTA placement rules](#str-6) |
| 7 | [Quality gates before publish](#str-7) |
| 8 | [Implementation sequence](#str-8) |
| 9 | [Cost projection + ROI math](#str-9) |

---

# Sericia pSEO Strategy

This is the master strategy doc for the pSEO matrix. It governs:
- Which keywords we generate articles for (vs. skipping)
- How each article is structured to rank on Google AND get cited by
  Perplexity / ChatGPT / Gemini (GEO)
- Which visual components are wired into each article type
- Where CTAs go to convert reading visitors into Drop buyers

<a id="str-1"></a>

## 1. Strategic principles

The Sericia pSEO matrix is **not** "spray and pray". Every article must
satisfy ALL three of:

1. **Real search volume** — at least one keyword variant has measurable
   monthly search demand. We score this in §2 below.
2. **Sericia-fulfillable intent** — the article links back to a real
   product / drop / waitlist. No traffic we can't convert.
3. **Defensible angle** — Sericia ships from Japan with curator notes
   producers / countries / techniques. The article must be something
   Bokksu / Misfits Market / Amazon JP cannot trivially copy.

Articles that fail any of the three are **skipped, not generated**. The
keyword research script (§2) flags these as `skip: <reason>`.

<a id="str-2"></a>

## 2. Keyword research methodology (DeepSeek V4 scoring)

We DO NOT have access to Ahrefs / Mangools / DataForSEO budgets. Instead
we use DeepSeek V4 (cheap + fast + cached) to score every matrix
combination against four heuristics that approximate keyword value:

| Score | What it measures | Range |
|-------|-----------------|-------|
| **demand** | Latent monthly search volume | 0–100 |
| **commercial** | Buyer intent (vs. educational) | 0–100 |
| **difficulty** | SERP saturation by big players | 0–100 (lower = easier) |
| **sericia_fit** | Match with our catalog + storytelling angle | 0–100 |

Composite score:

    composite = (demand × 0.35)
              + (commercial × 0.25)
              + ((100 − difficulty) × 0.25)
              + (sericia_fit × 0.15)

Threshold to generate: `composite ≥ 60`

The script (`storefront/scripts/research-pseo-keywords.ts`) writes the
scores to a new Supabase table `sericia_pseo_keyword_research` so we
can re-rank without recomputing.

### Calibration prompts (system prompt for DeepSeek V4)

Each scoring run uses one shared system prompt (Context Caching
prefix) with the DeepSeek V4 default model `deepseek-v4-flash`:

```
You are an SEO analyst for Sericia, a Japanese craft food D2C brand
shipping rescued/irregular artisan goods worldwide. Score the supplied
keyword against four heuristics, returning JSON only:

{
  "demand": 0-100,         // monthly search volume estimate
  "commercial": 0-100,     // buyer intent vs research intent
  "difficulty": 0-100,     // SERP saturation by big players
  "sericia_fit": 0-100,    // match with Sericia catalog + angle
  "rationale": "1 sentence why these scores"
}

Be honest — flag obvious low-volume queries and obvious commodity
queries dominated by Amazon. Do NOT recommend pages we cannot fulfil.
```

The same system prompt across all keyword scoring runs means
DeepSeek V4 charges effective $0.014/M input on cached prefix (90%
OFF) — making 1,440 keyword scores cost ≈ $0.50 lifetime.

<a id="str-3"></a>

## 3. GEO optimization (AI search engines)

Google ranks based on links + dwell time + topical authority.
Perplexity / ChatGPT / Gemini rank by what they can EXTRACT and cite
from a page. The two are complementary; we optimise for both.

### Mandatory GEO elements per article

- [ ] **TL;DR paragraph** as the first content block — ≤3 sentences,
      definitive language ("X is Y", not "X might be Y")
- [ ] **Statistics with attribution** — at least one numeric fact in
      the first 200 words (e.g. "Sericia ships to 23+ countries via
      EMS"). AI search engines cite numbers preferentially.
- [ ] **FAQPage JSON-LD** — minimum 4 Q&A pairs, each Q is a real
      search query (not "What is X?" but "Is X better than Y for Z?")
- [ ] **Article + BreadcrumbList JSON-LD** — every page
- [ ] **Recipe schema** where applicable (use-cases, dashi-ratio tools)
- [ ] **HowTo schema** where applicable (preparation guides)

### "AI-citation-friendly" content patterns

Position content in the FIRST 800 words to get extracted:
- One bulleted list per H2 (AI extracts bullets as snippets)
- Comparison tables (extracted as structured data)
- Direct definitive answers in 1-line paragraphs
- Numerical specifics ("65°C for 90 seconds" not "warm water briefly")

<a id="str-4"></a>

## 4. Article structure template

Every pSEO article on `/guides/[country]/[product]`,
`/uses/[product]/[case]`, `/compare/[a]/[b]` follows this skeleton:

```
1. PageHero (Eyebrow + H1 + 1-line lede)
2. TL;DR paragraph (GEO citation block, 80–120 words)
3. Visual stat strip (VisualStatGrid — 4 numbers)
4. SectionHeading + 200-word body
5. Comparison table (ColorfulComparisonTable) OR Bento Grid
6. SectionHeading + 300-word body
7. Marquee strip (related products / regions / makers)
8. SectionHeading + 200-word body
9. CTA banner (BorderBeam-bordered card → /products/<slug> or waitlist)
10. FAQPage block (4–6 Q&A with JSON-LD)
11. Internal-link dense grid (related comparisons / uses / countries)
12. Final CTA (less prominent, secondary)
```

Total visible word count target: **1,500–2,500 words**. Pillar pages
(homepage, /products, /journal/index) target 2,000–3,500.

<a id="str-5"></a>

## 5. Visual component library

Sericia's existing stack already has the heavy lifters. We compose
the article skeleton from this short list:

| Component | Source | Use case |
|-----------|--------|----------|
| `<VisualStatGrid>` | `components/VisualStatGrid.tsx` (F41) | Stat strip in §3 |
| `<ColorfulComparisonTable>` | `components/ColorfulComparisonTable.tsx` (F41) | Comparison table in §5 |
| `<Marquee>` | Magic UI (install via shadcn) | Related-content strip in §7 |
| `<BentoGrid>` | Magic UI | Use-case grid in §5 |
| `<NumberTicker>` | Magic UI (alt to react-countup) | Inline stat callouts |
| `<BorderBeam>` | Magic UI | CTA banner border in §9 |
| `<Sparkles>` | Magic UI | TL;DR badge accent |
| Recharts `<RadialBarChart>` | `recharts` (already in deps) | Score visualisation |
| `framer-motion` | already in deps | Section fade-in (FadeIn wrapper exists) |

### Magic UI installation (one-time)

```bash
cd storefront
npx shadcn@latest add https://magicui.design/r/marquee
npx shadcn@latest add https://magicui.design/r/bento-grid
npx shadcn@latest add https://magicui.design/r/border-beam
npx shadcn@latest add https://magicui.design/r/number-ticker
npx shadcn@latest add https://magicui.design/r/sparkles-text
```

Lands as `components/magicui/*.tsx`. Each component is shadcn-flavoured
(Tailwind + framer-motion) so it inherits sericia tokens automatically.

<a id="str-6"></a>

## 6. CTA placement rules

Per Sericia's "kura craft" tone, CTAs are **restrained but unmissable**.
Three placements per article, max:

1. **Primary CTA** at §9 — `<BorderBeam>` card with "Shop the [product]
   drop" → `/products/<slug>`
2. **Secondary CTA** at §11 — text link in dense internal-link grid
3. **Tertiary CTA** in TL;DR paragraph — single inline `<Link>` to
   the product page (the visitor reads it but isn't pressured)

DO NOT use:
- Banner ads
- Fixed-position popup CTAs
- "Sale ends in X hours" countdown CTAs (Sericia is drop-based, not
  flash-sale-based)

<a id="str-7"></a>

## 7. Quality gates before publish

Each generated article must pass an automated check before the pSEO
drainer marks it `done`. The check runs in `lib/pseo.ts` after the
DeepSeek V4 generation completes:

- [ ] Word count between 1,200–3,000
- [ ] Contains TL;DR section
- [ ] Contains FAQPage JSON-LD with ≥4 Q&A
- [ ] Contains at least 1 numerical statistic in first 200 words
- [ ] Contains internal links to ≥3 sibling pSEO routes
- [ ] Contains exactly 1 primary CTA, ≤3 total CTAs
- [ ] No banned phrases ("ultimate guide", "best of all time", "you'll
      love", "buy now or miss out") — these mark pSEO as low-quality
      to Google's helpful-content algorithm

Articles failing the check are persisted but marked `quality: needs_review`
for human triage; they don't appear in sitemap until promoted.

<a id="str-8"></a>

## 8. Implementation sequence

This is the order F44+ commits land:

1. **F44** Magic UI core components (Marquee, Bento, BorderBeam,
   NumberTicker, Sparkles)
2. **F45** `scripts/research-pseo-keywords.ts` + Supabase table
   `sericia_pseo_keyword_research`
3. **F46** Run keyword research over the matrix
   (12 countries × 12 products + 66 compare + 72 uses ≈ 282 keyword
   scoring calls)
4. **F47** Update `lib/pseo.ts` generator prompt for richer content
   (TL;DR + tables + CTAs + line-break flow + FAQ)
5. **F48** Visual rendering upgrade for `/uses` `/guides` `/compare`
   (Magic UI Marquee + Bento + BorderBeam wired in)
6. **F49** Run pSEO bulk generation on Top-N keywords (composite ≥ 60)
7. **F50** IndexNow re-submit + verify in Search Console

<a id="str-9"></a>

## 9. Cost projection + ROI math

| Phase | Items | DeepSeek V4 cost (cached) |
|-------|-------|---------------------------|
| F46 keyword research | 282 keyword scores | ~$0.50 |
| F49 article generation (Top-100 of ~282) | 100 articles × 10 locales | ~$2.00 |
| F49 expansion (next 200) | 200 × 10 locales | ~$4.00 |
| **Total lifetime** | **~3,000 indexable surfaces** | **~$6.50** |

ROI guardrails:
- Even 1 organic order/month from 3,000 pSEO surfaces ≈ $80 LTV → break-even at month 1
- Bing/Yandex/Naver IndexNow flood means traffic begins within hours, not weeks
- Long-tail compound: monthly visitors expected to grow ~15% MoM as Google's helpful-content algo recognises the structured corpus
