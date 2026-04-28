#### 📋 目次

| # | セクション |
|---|-----------|
| 1 | [Why this is a separate pipeline](#atl-1) |
| 2 | [Inventory — what needs translating](#atl-2) |
| 3 | [Step 1 — Tool body content extraction](#atl-3) |
| 4 | [Step 2 — DeepSeek V3 mass-translation script](#atl-4) |
| 5 | [Step 3 — Payload article locale population](#atl-5) |
| 6 | [Cost estimate + brand guardrails](#atl-6) |
| 7 | [Open questions for the operator](#atl-7) |

---

# Article + Tool Localization Pipeline

The F18/F19 deploys covered **navigation chrome** (page heros, login,
checkout, footer). What remains is **body content** — long-form journal
articles and the 8 tool pages with calculator UIs and explainer copy.

This is intentionally a separate pipeline from the i18n key sweeps
because it requires editorial review, has 10–100× the word count, and
involves brand-tone calibration that machine translation alone cannot
guarantee.

<a id="atl-1"></a>

## 1. Why this is a separate pipeline

The 400 keys shipped in F19 cover ~1,200 words across 10 locales.
The remaining surface is roughly:

| Surface | English word count (est.) | × 9 target locales | Total |
|---------|---------------------------|--------------------|-------|
| 14 hardcoded journal articles in `lib/journal.ts` | ~28,000 | 9 | 252,000 |
| ~640-brief pSEO matrix (DeepSeek-generated, English) | ~512,000 | 9 | 4,608,000 |
| 8 tool body explainers + calculator labels | ~6,500 | 9 | 58,500 |
| **Total** | ~546,500 | | **~4,918,500 words** |

At hand-translation rates ($0.10/word for craft food domain expertise)
this is $490k. Not viable. The right tool here is **DeepSeek V3 with
Context Caching** (system-prompt cached at $0.014/1M = 90% discount):

- 4.9M words × 1.4 tokens/word ≈ 6.9M tokens output
- + 6.9M input × 0.1 cache miss rate = ~$1 cache miss + $0.10 cache hit
- + 6.9M × $0.28/1M output = ~$2
- **Total spend: ~$3.10 USD** for the entire 9-locale corpus

But machine translation alone produces "Welcome back. → 戻るへようこそ。"
(literally correct, brand-flat). Brand-tone preservation requires:

1. **Glossary anchor** — a fixed 200-term mapping (e.g.,
   "rescued craft food" → "救われたクラフト食品", not "助けられた手仕事")
   loaded into the system prompt as the cached prefix.
2. **Editorial review** — a native speaker reads the first 5 articles
   per locale and corrects the tone; the corrections become additional
   examples in the system prompt for the next 100 articles.
3. **No mass-publish** — translated articles go to Payload `_status: draft`
   so the operator approves each one before it goes live. Staged rollout.

<a id="atl-2"></a>

## 2. Inventory — what needs translating

### Journal articles

`storefront/lib/journal.ts` — 14 statically authored articles.
**These should migrate to Payload `articles` collection** (which already
has `localized: true` on title/dek/body) before translation. Otherwise
each translation forks the source and the brand voice drifts.

Migration path: `scripts/migrate-static-journal-to-payload.ts` (not yet
written — TODO). After migration, body becomes Lexical RichText in Payload,
authored once in `en` and synced to `ja/de/fr/es/it/ko/zh-TW/ru/ar`.

### pSEO matrix

`storefront/lib/pseo-matrix.ts` — 640 country×product permutations.
Already DeepSeek-generated in English via `/api/pseo/generate`. The
extension here is feeding the *same* prompt with `locale: ja` (etc.)
into the existing `lib/llm/deepseek-cached.ts` wrapper.

**Status**: F18 added `pseo_pages` localized variants, but the n8n
nightly batch only fires `en`. To enable other locales, n8n workflow
`pseo-nightly-drain.json` needs a fan-out node (1 brief × 9 locales =
9 calls, each cache-hitting the system prompt).

### Tools

`storefront/app/(frontend)/tools/*/page.tsx` — 8 tool pages, each with
~800 words of explainer + 20–40 form labels. **None localized today.**

Two paths to localize:

a. **Inline i18n keys** (same pattern as F19): extract every visible
   string into `messages/{locale}.json` under `tools.{tool_slug}.*`.
   Pro: full control, no DB. Con: ~1,500 keys to maintain by hand.

b. **Payload `tools` collection** (recommended): make the existing
   Tools collection (already in `collections/Tools.ts`) carry the
   labels + explainer body as `localized: true` Lexical fields, and
   render the calculator UI from a fixed React component while the
   labels flow from Payload. Pro: editor can fix translations without
   a deploy; same pattern as articles. Con: 1-day refactor.

<a id="atl-3"></a>

## 3. Step 1 — Tool body content extraction

For each tool page in `app/(frontend)/tools/<slug>/page.tsx`:

1. Extract every `<h2>`, `<p>`, `<button>` label, `<label>`, placeholder,
   and tooltip text into a typed `<slug>Strings.ts` module.
2. Convert the page to a Server Component that pulls strings via
   `getTranslations("tools.<slug>")`.
3. Run `node scripts/add-tool-i18n-keys.mjs` (to be written) to seed
   English keys + leave other locales as `null` placeholders.
4. Run the DeepSeek translation script (Step 2) to fill placeholders.

Example for `/tools/ems-calculator`:

```ts
// storefront/messages/en.json
"tools": {
  "ems_calculator": {
    "hero_eyebrow": "Tools",
    "hero_title": "EMS shipping calculator.",
    "hero_lede": "Estimate the price...",
    "weight_label": "Package weight",
    "weight_unit_g": "grams",
    "destination_label": "Destination country",
    "result_eyebrow": "Estimated cost",
    "result_disclaimer": "Estimates only — Japan Post tariffs..."
  }
}
```

<a id="atl-4"></a>

## 4. Step 2 — DeepSeek V3 mass-translation script

`scripts/translate-with-deepseek.mjs` (not yet written) — reads
`messages/en.json`, finds keys missing in `messages/{ja,de,fr,…}.json`,
batches them into chunks of 50, sends to DeepSeek with the cached
brand-glossary prefix, writes results back atomically.

System prompt skeleton (cached prefix, 90% off):

```
You are translating Sericia (D2C Japanese craft food brand) UI copy
from English to {target_locale}. Maintain Aesop-tier restraint; avoid
exclamation marks; preserve em-dashes and hairline punctuation.

GLOSSARY (always use these mappings):
- "rescued craft food" → {locale-specific anchor}
- "drop" → {ドロップ / Auflage / drop / drop / drop / 드롭 / 限定上架 / дроп / إطلاق محدود}
- "miso / sencha / shiitake" → keep as romaji
- "Kyoto" → keep as romaji
- ...

OUTPUT: JSON object with the same keys as input, values translated.
No prose around the JSON. No code fences.
```

Run cadence: nightly via n8n (workflow JSON to be added at
`n8n-workflows/i18n-translate-nightly.json`).

Pre-write the glossary-anchor file in
`storefront/messages/_glossary.json` before first run so the brand
tone is baked into every cache hit.

<a id="atl-5"></a>

## 5. Step 3 — Payload article locale population

For articles already in Payload (collection `articles`, `localized: true`
on title/dek/body):

1. `scripts/translate-payload-articles.mjs` — REST GET `/cms/api/articles?locale=en`,
   feed body Lexical JSON into DeepSeek with a Lexical-aware prompt
   (preserves block structure, only translates leaf text nodes).
2. POST result to `/cms/api/articles/{id}?locale=ja` (etc.) with
   `_status: draft`.
3. Operator reviews via Payload admin → publishes locale by locale.

Why not auto-publish: brand risk. Even with the glossary, the first 5
translations per locale need eyeballs. After 5, the system prompt has
enough corrections cached that drift is bounded.

<a id="atl-6"></a>

## 6. Cost estimate + brand guardrails

| Pipeline | Tokens (est.) | DeepSeek cost | Editorial hours |
|----------|---------------|---------------|-----------------|
| Tool body × 9 locales | 600k tokens | $0.20 | 3h review |
| Journal articles × 9 | 4M tokens | $1.30 | 8h review (top 5/locale) |
| pSEO matrix × 9 | 50M tokens | $14 | 0h (drafts, not published) |
| **Total** | 54.6M tokens | **$15.50** | **11h editorial** |

Brand guardrails:

- **No publish without review** for tool/article translations.
- **pSEO drafts only** — never auto-publish a country×product page.
- **Glossary owned by Sericia** — checked into `messages/_glossary.json`.
  When a translation lands wrong, fix the glossary first, the page
  second.
- **Locale fallback** — if `ja.json` is missing a key, fall back to
  English. Better than `undefined` rendering as the literal key
  `auth.welcome_back` in the page.

`next-intl` does this fallback by default when `messages` is loaded
with `getRequestConfig` — already wired in `i18n/request.ts`.

<a id="atl-7"></a>

## 7. Open questions for the operator

1. **Tool body localization route** — inline keys (path A) or Payload-backed
   (path B)? Path B is the right long-term answer; path A ships in 4h.
2. **Static journal → Payload migration** — willing to break the existing
   `lib/journal.ts` typed exports and migrate to Payload now? It unlocks
   editor-driven translations but adds a small DB read on every journal
   page (currently zero — all in-process).
3. **First locales to fully ship** — Japanese is obvious (the user is
   Japanese; ja-JP traffic will be highest). Beyond JA, the next two
   priorities should be DE + FR (EU traffic) or KO + zh-TW (closer
   cultural affinity for Japanese craft food). Pick two for the MVP.
4. **Editorial reviewer** — who reads the first 5 translations per
   locale? Without this, machine output ships and brand drifts.
