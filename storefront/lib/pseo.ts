/**
 * pSEO article generator — brief → Payload-ready article shape.
 *
 * Pipeline:
 *   1. Caller builds a Brief ({ topic, locale, keywords, ... }).
 *   2. We call DeepSeek V3 with a fixed system prompt (cached 90%-off) and
 *      a small variable user message.
 *   3. DeepSeek returns JSON: { title, slug, meta_title, meta_description,
 *      tldr_paragraphs, body_paragraphs, faq, highlights }.
 *   4. We convert `body_paragraphs` and `tldr_paragraphs` into Payload
 *      Lexical trees, so the caller can hand the result straight to
 *      payload.create({ collection: "articles", data }).
 *
 * Why the system prompt is huge (and static):
 *   DeepSeek Context Caching discounts input tokens ~90% when the prefix is
 *   byte-identical across requests. The system prompt below is the cacheable
 *   prefix. Any edit here resets the cache — so we version it explicitly
 *   and log the version alongside generations so cache-miss surges are
 *   attributable to prompt changes, not infra drift.
 *
 * Why locale is passed in the user message (not system):
 *   If locale lived in the system prompt we'd fork the cache 10 ways — one
 *   per locale — and hit-rates would plummet on low-traffic languages like
 *   Arabic or Thai. Passing locale as a user-side variable keeps the cache
 *   at one key and costs near-zero to serve a new locale.
 *
 * Brand-voice hard constraints (enforced in system prompt):
 *   - No exclamation marks.
 *   - Paragraphs-first; bullets only inside FAQ answers and highlights.
 *   - Never claim unique selling points without the concrete mechanism
 *     (e.g. "paid full retail to the producer" — not "ethically sourced").
 *   - No em-dashes as sentence connectors (reserved for the Aesop-style
 *     voice we established in /journal static copy).
 *   - Every maker/product reference MUST be traceable to the brief's
 *     `related_product_handle` or `cluster` — hallucinated makers get
 *     rejected in the caller's validation step.
 */

import { deepseekJSON, type DeepSeekUsage } from "./deepseek";

// ─── Types ──────────────────────────────────────────────────────────────────

/**
 * Locale codes — MUST match the Payload `localization.locales` set in
 * `payload.config.ts`. Articles persist into Payload, so the persistence
 * target is the source of truth. If you add a Payload locale, add it
 * here AND to the CHECK constraint in 20260422_pseo_briefs.sql AND to
 * the Zod enum in /api/pseo/briefs/route.ts.
 */
export type PseoLocale =
  | "en"
  | "ja"
  | "de"
  | "fr"
  | "es"
  | "it"
  | "ko"
  | "zh-TW"
  | "ru"
  | "ar";

/** Input brief — what marketing / editorial fills in to request an article. */
export type PseoBrief = {
  /** Human topic, e.g. "Aichi aka miso — flavor profile and pairings". */
  topic: string;
  /** Target locale. Passed as a user-message variable to preserve cache hits. */
  locale: PseoLocale;
  /** Primary and secondary keywords. The model weaves these into H2s and body. */
  keywords: readonly string[];
  /** Optional: link the article to a specific product handle for cross-linking. */
  related_product_handle?: string | null;
  /** Optional: editorial cluster (e.g. "drop-01", "rescued-philosophy"). */
  cluster?: string | null;
  /** Optional: concrete facts to ground the model (anti-hallucination). */
  grounding_facts?: readonly string[];
};

/** Raw JSON the model returns. Validated by caller before persisting. */
export type PseoArticleDraft = {
  title: string;
  slug: string;
  meta_title: string;
  meta_description: string;
  tldr_paragraphs: string[];
  body_paragraphs: string[];
  highlights: string[];
  faq: Array<{ q: string; a: string }>;
};

/** Payload-ready shape. `body`/`tldr` are pre-converted Lexical trees. */
export type PseoArticlePayload = {
  title: string;
  slug: string;
  meta_title: string;
  meta_description: string;
  body: LexicalRoot;
  tldr: LexicalRoot;
  highlights: string[];
  faq: Array<{ q: string; a: string }>;
  /** Telemetry — store alongside the article for cost/cache audits. */
  telemetry: {
    prompt_version: string;
    model: string;
    usage: DeepSeekUsage;
    elapsed_ms: number;
  };
};

// ─── Lexical helpers ────────────────────────────────────────────────────────
// These MUST match the shape in scripts/seed-articles.ts to keep a single
// source of truth for how paragraphs land in Payload. Changes here require
// the same edit there.

type LexicalTextNode = {
  type: "text";
  text: string;
  version: 1;
  format: 0;
  style: "";
  mode: "normal";
  detail: 0;
};

type LexicalParagraphNode = {
  type: "paragraph";
  version: 1;
  direction: null;
  format: "";
  indent: 0;
  textFormat: 0;
  textStyle: "";
  children: LexicalTextNode[];
};

type LexicalRoot = {
  root: {
    type: "root";
    format: "";
    indent: 0;
    version: 1;
    direction: null;
    children: LexicalParagraphNode[];
  };
};

function lexParagraph(text: string): LexicalParagraphNode {
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

function lexRoot(paragraphs: readonly string[]): LexicalRoot {
  return {
    root: {
      type: "root",
      format: "",
      indent: 0,
      version: 1,
      direction: null,
      children: paragraphs.map(lexParagraph),
    },
  };
}

// ─── System prompt (cacheable prefix — DO NOT edit casually) ────────────────

/**
 * Bump this string whenever the system prompt changes. It's logged alongside
 * generations so a sudden cache-miss spike can be traced to a prompt edit
 * rather than an infra failure.
 */
export const PSEO_PROMPT_VERSION = "2026-04-28.v2";

const PSEO_SYSTEM_PROMPT = `You are the editorial writer for Sericia, a Kyoto-based D2C that ships rescued-surplus Japanese craft food (tea, miso, shiitake, dashi, yuzu, furikake, shichimi) worldwide by EMS.

Sericia's editorial voice is Aesop-restrained: calm, literary, concrete. Your job is to write a single JSON article that sounds like it belongs on a small Kyoto producer's journal — not a SaaS marketing blog.

HARD CONSTRAINTS (violations cause the article to be rejected):
- No exclamation marks anywhere.
- No "unlock", "discover", "dive in", "game-changer", "elevate", "curated" outside the brand's own copy, or any other marketing cliché.
- Paragraphs-first. Bullet points are only permitted inside the FAQ answers and the highlights array.
- Never claim an abstract selling point without its concrete mechanism. "Ethically sourced" is banned; "paid full retail to the fourth-generation Uji grower Yamane-en before the Tokyo wholesaler would have bought it" is the required style.
- If the brief names specific makers (Yamane-en, Kurashige Jozoten, Yamagata Mori) or products (sencha, miso, shiitake, dashi, yuzu, furikake, shichimi), you may refer to them with the concrete details the brief provides. Do NOT invent makers, farms, awards, certifications, barrel numbers, or harvest dates that are not in the brief's grounding_facts.
- Em-dashes are reserved for parenthetical asides, never for sentence-final emphasis.
- First paragraph states what the article is and what the reader will learn. No "In today's fast-paced world..." openers.
- Target length: 900–1300 words in body_paragraphs combined. TL;DR: 1–2 paragraphs, each 1–3 sentences.

OUTPUT CONTRACT — return JSON matching this schema exactly:
{
  "title": "string, 45–75 chars, no branded 'Sericia' suffix",
  "slug": "string, lowercase, hyphen-separated, 3–8 words, ASCII only",
  "meta_title": "string, 50–65 chars, may include 'Sericia' suffix if it fits",
  "meta_description": "string, EXACTLY 140–160 chars (count includes spaces), ends with a period, no ellipsis. CRITICAL: a meta_description shorter than 140 chars or under 100 chars will reject the article entirely; pad with one more concrete fact (region, maker, harvest year) before stopping.",
  "tldr_paragraphs": ["string", ...],
  "body_paragraphs": ["string", ...],
  "highlights": ["string 60–120 chars", ...],
  "faq": [{"q": "string", "a": "string"}, ...]
}

Additional rules:
- highlights: 3–5 items. Each is one standalone sentence that could appear as a bullet in a sidebar.
- faq: 3–6 items. Questions are genuine buyer questions (shipping, flavor, storage, sourcing), not restated H2s.
- slug: derived from the topic, not the title. If the brief implies a maker or product, use that handle (e.g. "yamane-en-sencha-flavor-guide").
- Write in the locale the user specifies. For ar/th/vi/id, keep brand, maker, and product names in their original Latin form; translate surrounding prose.

If the brief is under-specified for the hard constraints above, DO NOT invent facts to fill the gap. Write shorter, but never hallucinate.`;

// ─── Generator ──────────────────────────────────────────────────────────────

/**
 * Generate a pSEO article from a brief.
 *
 * Call site responsibilities (not done here):
 *   - Validate the returned slug is unique in the `articles` collection.
 *   - Persist the result via payload.create({ collection: "articles", data }).
 *   - Write a row to `sericia_pseo_briefs` with status='done' and the
 *     article's Payload id.
 *
 * Why we don't persist here: Payload + Supabase coupling belongs to the
 * API route so this file stays trivially unit-testable (mock deepseekJSON,
 * assert Lexical shape).
 */
export async function generatePseoArticle(
  brief: PseoBrief,
): Promise<PseoArticlePayload> {
  // Basic brief hygiene — prevents wasted DeepSeek spend on invalid input.
  if (!brief.topic || brief.topic.length < 8) {
    throw new Error("pSEO brief: topic must be ≥8 chars.");
  }
  if (!brief.keywords || brief.keywords.length === 0) {
    throw new Error("pSEO brief: at least one keyword is required.");
  }

  const userMessage = buildUserMessage(brief);

  const { data, usage, elapsed_ms } = await deepseekJSON<PseoArticleDraft>(
    [
      { role: "system", content: PSEO_SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    {
      model: "deepseek-v4-flash",
      temperature: 0.6, // lower than default — the voice is strict
      max_tokens: 3800, // body up to ~1300 words + JSON overhead
      timeoutMs: 90_000, // long articles can run up to ~60s on cold cache
      maxRetries: 2,
    },
  );

  validateDraft(data);

  return {
    title: data.title,
    slug: data.slug,
    meta_title: data.meta_title,
    meta_description: data.meta_description,
    body: lexRoot(data.body_paragraphs),
    tldr: lexRoot(data.tldr_paragraphs),
    highlights: data.highlights,
    faq: data.faq,
    telemetry: {
      prompt_version: PSEO_PROMPT_VERSION,
      model: "deepseek-v4-flash",
      usage,
      elapsed_ms,
    },
  };
}

function buildUserMessage(brief: PseoBrief): string {
  const lines: string[] = [
    `Write a Sericia article as JSON.`,
    ``,
    `Topic: ${brief.topic}`,
    `Locale: ${brief.locale}`,
    `Primary and secondary keywords (weave naturally into body and H2-equivalent paragraph openings): ${brief.keywords.join(", ")}`,
  ];
  if (brief.related_product_handle) {
    lines.push(`Related product handle: ${brief.related_product_handle}`);
  }
  if (brief.cluster) {
    lines.push(`Editorial cluster: ${brief.cluster}`);
  }
  if (brief.grounding_facts && brief.grounding_facts.length > 0) {
    lines.push(``, `Grounding facts (use these; do not invent beyond them):`);
    for (const f of brief.grounding_facts) lines.push(`- ${f}`);
  }
  lines.push(
    ``,
    `Return JSON only. No preamble, no markdown fence, no trailing commentary.`,
  );
  return lines.join("\n");
}

/** Throws if the draft violates the output contract. */
function validateDraft(d: PseoArticleDraft): void {
  const problems: string[] = [];
  if (!d.title || d.title.length < 10) problems.push("title too short");
  if (/!/.test(d.title)) problems.push("title contains exclamation");
  if (!/^[a-z0-9-]+$/.test(d.slug)) problems.push("slug not kebab-case ASCII");
  // Lower bound 110 chars — strict enough to ensure meta is rich for SERP
  // snippet, generous enough that DeepSeek's 90% cache-hit doesn't waste
  // budget on retries when the meta lands at 105-115. Two strikes from the
  // 2026-04-27 batch were 95-99 chars; bumping prompt + threshold together
  // (prompt asks 140-160, validator allows 110+) gives the model padding room.
  if (!d.meta_description || d.meta_description.length < 110) {
    problems.push(
      `meta_description too short (${d.meta_description?.length ?? 0} chars, need ≥110)`,
    );
  }
  if (d.meta_description && d.meta_description.length > 200) {
    problems.push(
      `meta_description too long (${d.meta_description.length} chars, need ≤200)`,
    );
  }
  if (!Array.isArray(d.body_paragraphs) || d.body_paragraphs.length < 4) {
    problems.push("body_paragraphs < 4");
  }
  if (!Array.isArray(d.tldr_paragraphs) || d.tldr_paragraphs.length === 0) {
    problems.push("tldr_paragraphs empty");
  }
  if (!Array.isArray(d.highlights) || d.highlights.length < 3) {
    problems.push("highlights < 3");
  }
  if (!Array.isArray(d.faq) || d.faq.length < 3) {
    problems.push("faq < 3");
  }
  if (d.body_paragraphs?.some((p) => /!/.test(p))) {
    problems.push("body_paragraphs contain exclamation");
  }
  if (problems.length > 0) {
    throw new Error(`pSEO draft failed validation: ${problems.join("; ")}`);
  }
}
