/**
 * Sericia article block schema.
 *
 * One JSON shape that powers four surfaces:
 *   1. Static brand pages (/about, /experience-style sections)
 *   2. Journal articles (Payload `articles.bodyBlocks`)
 *   3. pSEO articles (`pseo_pages.body_blocks`)
 *   4. PDP rich descriptions (Payload `productCopy.bodyBlocks`)
 *
 * Why blocks (vs Lexical / Markdown):
 *   • DeepSeek V3 generates clean JSON for thousands of pSEO articles.
 *     Lexical AST is too verbose; markdown loses image-text composition.
 *   • Editor sees the same block kit on PDP, journal and static pages —
 *     consistent authoring surface = easier to train + faster to publish.
 *   • Block types map 1:1 to React components with explicit render rules
 *     (no schema drift between author and runtime).
 *
 * To add a new block type:
 *   1. Extend the discriminated union below
 *   2. Add a `case` in `ArticleBlocks.tsx`
 *   3. Update Payload `bodyBlocks` field options (when ProductCopy lands)
 *   4. Update DeepSeek system prompt to emit the new type.
 */

export type AccentTone = "tea" | "miso" | "mushroom" | "seasoning" | "paper" | "drop" | "ink";

export type ArticleBlock =
  | HeadingBlock
  | ParagraphBlock
  | ImageBlock
  | ImageTextBlock
  | TableBlock
  | CalloutBlock
  | CTABlock
  | MarqueeBlock
  | StatRowBlock
  | PullQuoteBlock
  | DividerBlock
  | HighlightBannerBlock
  | FAQBlock;

/** H2 / H3. Always semantic — never decorative. */
export type HeadingBlock = {
  type: "heading";
  level: 2 | 3;
  text: string;
  /** Optional eyebrow shown above the heading (small caps). */
  eyebrow?: string | null;
  /** Optional id for in-page anchor links + table-of-contents. */
  id?: string | null;
  /** When true, renders the heading as italic serif (Cormorant) for editorial flair. Use sparingly. */
  emphasis?: boolean;
};

export type InlineMark =
  | { mark: "bold"; text: string }
  | { mark: "italic"; text: string }
  | { mark: "highlight"; text: string }
  | { mark: "accent"; text: string }
  | { mark: "link"; text: string; url: string }
  | { mark: "text"; text: string };

/**
 * Paragraph. Body can be plain string OR rich array of inline marks.
 * Plain strings render as <p>; arrays render with span-level styling per
 * mark — supports per-word highlight / accent / italic for editorial pop.
 */
export type ParagraphBlock = {
  type: "paragraph";
  body: string | InlineMark[];
  /** "lead" = bigger first paragraph (Aesop opening style). */
  size?: "default" | "lead";
};

export type ImageBlock = {
  type: "image";
  src: string;
  alt: string;
  caption?: string | null;
  /** "full" = breaks out of prose width. "wide" = container width. "inline" = within prose column. */
  width?: "full" | "wide" | "inline";
  /** Aspect ratio token; defaults to 16:9. */
  ratio?: "16/9" | "4/3" | "4/5" | "1/1" | "21/9";
};

/** Aesop "Fragrance Armoire" pattern — image + text side-by-side. */
export type ImageTextBlock = {
  type: "imageText";
  imageSrc: string;
  imageAlt: string;
  /** Image position. "right" = image on right (default Aesop pattern). */
  imagePosition: "left" | "right";
  eyebrow?: string | null;
  heading: string;
  body: string;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  /** Image gradient fallback when src is empty (Sericia rule). */
  tone?: AccentTone | null;
  /** Image aspect ratio. Default 4:5. */
  ratio?: "16/9" | "4/3" | "4/5" | "1/1" | "21/9";
};

export type TableBlock = {
  type: "table";
  caption?: string | null;
  headers: string[];
  rows: string[][];
  /** When true, the first column is rendered as a row-header (label column). */
  rowHeaders?: boolean;
};

export type CalloutBlock = {
  type: "callout";
  variant: "info" | "tip" | "warning" | "note";
  title?: string | null;
  body: string;
};

export type CTABlock = {
  type: "cta";
  label: string;
  url: string;
  /** Subtitle / context line above the button. */
  caption?: string | null;
  /** Layout style: "inline" = small button, "card" = full bordered card. */
  variant?: "inline" | "card";
};

export type MarqueeBlock = {
  type: "marquee";
  /** Items rotated horizontally. CSS-animated, no JS. */
  items: string[];
  /** Slower (60s+) for editorial restraint, faster (20s) for urgency. */
  durationSeconds?: number;
};

export type StatRowBlock = {
  type: "statRow";
  items: Array<{
    /** Number rendered with CountUp on scroll into view. */
    value: number;
    /** Suffix appended verbatim (%, +, h, etc). */
    suffix?: string;
    label: string;
  }>;
};

export type PullQuoteBlock = {
  type: "pullQuote";
  quote: string;
  attribution?: string | null;
};

export type DividerBlock = {
  type: "divider";
  /** "hairline" (default), "wide" (more spacing), "asterism" (centered ·•·). */
  style?: "hairline" | "wide" | "asterism";
};

export type HighlightBannerBlock = {
  type: "highlightBanner";
  /** Single key takeaway. Bigger than paragraph, smaller than heading. */
  text: string;
  tone?: AccentTone | null;
};

export type FAQBlock = {
  type: "faq";
  items: Array<{ q: string; a: string }>;
};
