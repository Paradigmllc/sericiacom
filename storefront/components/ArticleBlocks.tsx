"use client";

/**
 * ArticleBlocks — renders an array of `ArticleBlock` JSON into Sericia-styled
 * markup. Powers static brand pages, journal articles, pSEO pages, and PDP
 * rich descriptions from one schema.
 *
 * Brand rules followed:
 *   • Image blocks degrade to gradient + grain when src is empty (Sericia
 *     refuses sloppy AI-gen / random Unsplash imagery).
 *   • All animations honour `prefers-reduced-motion`.
 *   • Marquee blocks are CSS-keyframe animated (zero JS) for performance.
 *   • Tables remain accessible (proper <th scope=...>, no zebra colour-only signals).
 */

import Link from "next/link";
import CountUp from "react-countup";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import type {
  ArticleBlock,
  CTABlock,
  CalloutBlock,
  DividerBlock,
  HeadingBlock,
  HighlightBannerBlock,
  ImageBlock,
  ImageTextBlock,
  InlineMark,
  MarqueeBlock,
  ParagraphBlock,
  PullQuoteBlock,
  StatRowBlock,
  TableBlock,
  FAQBlock,
  AccentTone,
} from "@/lib/article-blocks";

const TONE_GRADIENTS: Record<AccentTone, string> = {
  paper: "from-[#e8e0cf] to-[#b8a987]",
  tea: "from-[#c8d4b0] to-[#6a7d4c]",
  miso: "from-[#d4c9b0] to-[#7a5c3c]",
  mushroom: "from-[#c8b8a8] to-[#5a4a3c]",
  seasoning: "from-[#e0d4a8] to-[#8a7a2c]",
  drop: "from-[#d4c9b0] to-[#8a7d5c]",
  ink: "from-[#5c5d45] to-[#21231d]",
};

const RATIO_CLASS: Record<NonNullable<ImageBlock["ratio"]>, string> = {
  "16/9": "aspect-[16/9]",
  "4/3": "aspect-[4/3]",
  "4/5": "aspect-[4/5]",
  "1/1": "aspect-square",
  "21/9": "aspect-[21/9]",
};

function GrainAndGradient({ tone = "paper" }: { tone?: AccentTone }) {
  return (
    <>
      <div className={`absolute inset-0 bg-gradient-to-br ${TONE_GRADIENTS[tone]}`} />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.13] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.5'/></svg>\")",
        }}
      />
    </>
  );
}

function renderInline(parts: string | InlineMark[]) {
  if (typeof parts === "string") return parts;
  return parts.map((p, i) => {
    switch (p.mark) {
      case "bold":
        return (
          <strong key={i} className="font-medium text-sericia-ink">
            {p.text}
          </strong>
        );
      case "italic":
        return (
          <em key={i} className="italic">
            {p.text}
          </em>
        );
      case "highlight":
        // Aesop-style understated marker — paper-deep underline glow rather than yellow neon
        return (
          <mark
            key={i}
            className="bg-[linear-gradient(transparent_60%,var(--sericia-paper-deep)_60%)] px-0.5 text-sericia-ink"
          >
            {p.text}
          </mark>
        );
      case "accent":
        return (
          <span key={i} className="text-sericia-accent">
            {p.text}
          </span>
        );
      case "link":
        return (
          <Link
            key={i}
            href={p.url}
            className="underline-link text-sericia-ink"
            data-cursor="link"
          >
            {p.text}
          </Link>
        );
      case "text":
      default:
        return <span key={i}>{p.text}</span>;
    }
  });
}

function HeadingNode({ block }: { block: HeadingBlock }) {
  const Tag = block.level === 2 ? "h2" : "h3";
  const sizeClass =
    block.level === 2
      ? "text-[28px] md:text-[36px] leading-tight"
      : "text-[22px] md:text-[26px] leading-snug";
  return (
    <div className="my-12 md:my-16">
      {block.eyebrow && <p className="label mb-4">{block.eyebrow}</p>}
      <Tag
        id={block.id ?? undefined}
        className={`${sizeClass} font-normal text-sericia-ink ${block.emphasis ? "italic" : ""}`}
      >
        {block.text}
      </Tag>
    </div>
  );
}

function ParagraphNode({ block }: { block: ParagraphBlock }) {
  const size =
    block.size === "lead"
      ? "text-[19px] md:text-[21px] leading-[1.7] text-sericia-ink"
      : "text-[16px] md:text-[17px] leading-[1.85] text-sericia-ink-soft";
  return <p className={`${size} max-w-prose mb-6`}>{renderInline(block.body)}</p>;
}

function ImageNode({ block }: { block: ImageBlock }) {
  const ratio = RATIO_CLASS[block.ratio ?? "16/9"];
  const widthClass =
    block.width === "full"
      ? "w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]"
      : block.width === "inline"
        ? "max-w-prose"
        : "w-full";
  return (
    <figure className={`my-12 md:my-16 ${widthClass}`}>
      <div className={`relative overflow-hidden bg-sericia-paper-card ${ratio}`}>
        {block.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={block.src}
            alt={block.alt}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <GrainAndGradient tone="paper" />
        )}
      </div>
      {block.caption && (
        <figcaption className="mt-3 text-[12px] tracking-wider uppercase text-sericia-ink-mute">
          {block.caption}
        </figcaption>
      )}
    </figure>
  );
}

function ImageTextNode({ block }: { block: ImageTextBlock }) {
  const ratio = RATIO_CLASS[block.ratio ?? "4/5"];
  const orderRight = block.imagePosition === "right";
  return (
    <section className="my-20 md:my-28 grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 items-center">
      <div
        className={`md:col-span-6 ${orderRight ? "md:order-1" : "md:order-2"}`}
      >
        {block.eyebrow && <p className="label mb-5">{block.eyebrow}</p>}
        <h2 className="text-[28px] md:text-[36px] leading-tight font-normal mb-6 text-sericia-ink">
          {block.heading}
        </h2>
        <p className="text-[16px] md:text-[17px] leading-[1.85] text-sericia-ink-soft max-w-prose mb-8">
          {block.body}
        </p>
        {block.ctaLabel && block.ctaUrl && (
          <Link
            href={block.ctaUrl}
            data-cursor="link"
            className="inline-flex items-center gap-3 border border-sericia-ink px-6 py-3 text-[12px] tracking-[0.18em] uppercase text-sericia-ink hover:bg-sericia-ink hover:text-sericia-paper transition-colors"
          >
            {block.ctaLabel}
            <span aria-hidden>→</span>
          </Link>
        )}
      </div>
      <div
        className={`md:col-span-6 ${orderRight ? "md:order-2" : "md:order-1"}`}
      >
        <div className={`relative overflow-hidden ${ratio}`}>
          {block.imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={block.imageSrc}
              alt={block.imageAlt}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <GrainAndGradient tone={block.tone ?? "paper"} />
          )}
        </div>
      </div>
    </section>
  );
}

function TableNode({ block }: { block: TableBlock }) {
  return (
    <figure className="my-12 md:my-16 overflow-x-auto -mx-6 md:mx-0">
      <table className="w-full border-collapse text-[14px]">
        {block.caption && (
          <caption className="caption-bottom text-[12px] uppercase tracking-wider text-sericia-ink-mute mt-3 text-left">
            {block.caption}
          </caption>
        )}
        <thead>
          <tr className="border-b border-sericia-ink">
            {block.headers.map((h, i) => (
              <th
                key={i}
                scope="col"
                className="text-left py-3 px-4 font-medium text-sericia-ink tracking-wide"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, ri) => (
            <tr key={ri} className="border-b border-sericia-line">
              {row.map((cell, ci) => {
                const Cell = block.rowHeaders && ci === 0 ? "th" : "td";
                return (
                  <Cell
                    key={ci}
                    scope={block.rowHeaders && ci === 0 ? "row" : undefined}
                    className={`py-3 px-4 align-top ${
                      block.rowHeaders && ci === 0
                        ? "font-medium text-sericia-ink"
                        : "text-sericia-ink-soft"
                    }`}
                  >
                    {cell}
                  </Cell>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

function CalloutNode({ block }: { block: CalloutBlock }) {
  const VARIANT_CLASS: Record<CalloutBlock["variant"], string> = {
    info: "border-sericia-line bg-sericia-paper-card",
    tip: "border-sericia-accent bg-sericia-paper-card",
    warning: "border-sericia-heart/40 bg-sericia-paper-card",
    note: "border-sericia-line bg-sericia-paper",
  };
  const VARIANT_LABEL: Record<CalloutBlock["variant"], string> = {
    info: "Info",
    tip: "Tip",
    warning: "Take care",
    note: "Note",
  };
  return (
    <aside
      role="note"
      className={`my-10 border-l-2 ${VARIANT_CLASS[block.variant]} pl-6 pr-6 py-5`}
    >
      <p className="label mb-2">{block.title ?? VARIANT_LABEL[block.variant]}</p>
      <p className="text-[15px] leading-[1.8] text-sericia-ink">{block.body}</p>
    </aside>
  );
}

function CTANode({ block }: { block: CTABlock }) {
  if (block.variant === "card") {
    return (
      <div className="my-16 border border-sericia-line bg-sericia-paper-card p-10 md:p-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {block.caption && (
          <p className="text-[16px] text-sericia-ink leading-relaxed max-w-md">
            {block.caption}
          </p>
        )}
        <Link
          href={block.url}
          data-cursor="link"
          className="inline-flex items-center gap-3 bg-sericia-ink text-sericia-paper px-8 py-4 text-[12px] tracking-[0.18em] uppercase hover:bg-sericia-accent transition-colors whitespace-nowrap"
        >
          {block.label}
          <span aria-hidden>→</span>
        </Link>
      </div>
    );
  }
  // inline default
  return (
    <p className="my-10">
      {block.caption && (
        <span className="block text-[12px] tracking-[0.18em] uppercase text-sericia-ink-mute mb-3">
          {block.caption}
        </span>
      )}
      <Link
        href={block.url}
        data-cursor="link"
        className="inline-flex items-center gap-3 border-b border-sericia-ink text-sericia-ink py-1 hover:gap-4 transition-all"
      >
        {block.label}
        <span aria-hidden>→</span>
      </Link>
    </p>
  );
}

function MarqueeNode({ block }: { block: MarqueeBlock }) {
  const duration = block.durationSeconds ?? 60;
  // Two copies for seamless loop. CSS keyframe animation = no JS scroll handler.
  return (
    <div
      className="my-12 overflow-hidden border-y border-sericia-line py-5 -mx-6 md:-mx-12"
      role="presentation"
    >
      <div
        className="inline-flex whitespace-nowrap [animation:sericia-marquee_var(--marquee-d,60s)_linear_infinite] motion-reduce:[animation:none]"
        style={{ ["--marquee-d" as string]: `${duration}s` }}
      >
        {[0, 1].map((copy) => (
          <span key={copy} className="inline-flex items-center gap-12 pr-12">
            {block.items.map((item, i) => (
              <span
                key={i}
                className="text-[14px] tracking-[0.22em] uppercase text-sericia-ink-soft"
              >
                {item}
                <span aria-hidden className="ml-12 text-sericia-line">·</span>
              </span>
            ))}
          </span>
        ))}
      </div>
      <style>{`
        @keyframes sericia-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

function StatRowItem({ value, suffix, label }: { value: number; suffix?: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduce = useReducedMotion();
  return (
    <div ref={ref}>
      <div className="text-[34px] md:text-[42px] font-normal leading-none mb-2 tabular-nums text-sericia-ink">
        {inView && !reduce ? (
          <CountUp end={value} duration={2.2} suffix={suffix ?? ""} preserveValue />
        ) : (
          <>
            {value}
            {suffix ?? ""}
          </>
        )}
      </div>
      <div className="label">{label}</div>
    </div>
  );
}

function StatRowNode({ block }: { block: StatRowBlock }) {
  return (
    <div className="my-16 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16">
      {block.items.map((it, i) => (
        <StatRowItem key={i} {...it} />
      ))}
    </div>
  );
}

function PullQuoteNode({ block }: { block: PullQuoteBlock }) {
  return (
    <blockquote className="my-16 border-l-2 border-sericia-accent pl-8 max-w-prose">
      <p className="text-[24px] md:text-[28px] leading-snug font-light italic text-sericia-ink mb-4">
        “{block.quote}”
      </p>
      {block.attribution && (
        <cite className="not-italic text-[12px] tracking-[0.18em] uppercase text-sericia-ink-mute">
          — {block.attribution}
        </cite>
      )}
    </blockquote>
  );
}

function DividerNode({ block }: { block: DividerBlock }) {
  if (block.style === "asterism") {
    return (
      <div className="my-16 text-center text-sericia-ink-mute tracking-[0.5em]" aria-hidden>
        · · ·
      </div>
    );
  }
  if (block.style === "wide") {
    return <hr className="my-20 border-t border-sericia-line" />;
  }
  return <hr className="my-12 border-t border-sericia-line" />;
}

function HighlightBannerNode({ block }: { block: HighlightBannerBlock }) {
  const tone = block.tone ?? "paper";
  return (
    <div
      className={`relative my-16 overflow-hidden bg-gradient-to-br ${TONE_GRADIENTS[tone]} text-sericia-ink py-12 md:py-16 px-8 md:px-12`}
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.10] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.5'/></svg>\")",
        }}
      />
      <p className="relative text-[22px] md:text-[28px] leading-snug font-light max-w-3xl">
        {block.text}
      </p>
    </div>
  );
}

function FAQNode({ block }: { block: FAQBlock }) {
  return (
    <dl className="my-12 divide-y divide-sericia-line">
      {block.items.map((item, i) => (
        <details key={i} className="group py-6">
          <summary className="flex items-start justify-between cursor-pointer list-none">
            <dt className="text-[17px] pr-8 text-sericia-ink">{item.q}</dt>
            <span
              aria-hidden
              className="text-sericia-ink-mute text-[20px] leading-none group-open:rotate-45 transition-transform"
            >
              +
            </span>
          </summary>
          <dd className="mt-4 text-[15px] text-sericia-ink-soft leading-relaxed max-w-prose">
            {item.a}
          </dd>
        </details>
      ))}
    </dl>
  );
}

export default function ArticleBlocks({ blocks }: { blocks: ArticleBlock[] }) {
  // Wrap each block in a container with a subtle scroll-fade. Reduced-motion
  // users get the static layout — no animation, no opacity-0 flash either
  // (initial: false reads existing transform, doesn't override it).
  const reduce = useReducedMotion();

  return (
    <div>
      {blocks.map((block, i) => {
        const node = renderBlock(block);
        if (!node) return null;
        return (
          <motion.div
            key={i}
            initial={reduce ? false : { opacity: 0, y: 24 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {node}
          </motion.div>
        );
      })}
    </div>
  );
}

function renderBlock(block: ArticleBlock) {
  switch (block.type) {
    case "heading":
      return <HeadingNode block={block} />;
    case "paragraph":
      return <ParagraphNode block={block} />;
    case "image":
      return <ImageNode block={block} />;
    case "imageText":
      return <ImageTextNode block={block} />;
    case "table":
      return <TableNode block={block} />;
    case "callout":
      return <CalloutNode block={block} />;
    case "cta":
      return <CTANode block={block} />;
    case "marquee":
      return <MarqueeNode block={block} />;
    case "statRow":
      return <StatRowNode block={block} />;
    case "pullQuote":
      return <PullQuoteNode block={block} />;
    case "divider":
      return <DividerNode block={block} />;
    case "highlightBanner":
      return <HighlightBannerNode block={block} />;
    case "faq":
      return <FAQNode block={block} />;
    default: {
      const _exhaustive: never = block;
      console.warn("[ArticleBlocks] unknown block type", _exhaustive);
      return null;
    }
  }
}
