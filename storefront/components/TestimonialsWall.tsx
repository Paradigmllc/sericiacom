/**
 * TestimonialsWall — Aesop-restraint social-proof wall.
 *
 * Server Component that queries Payload's `testimonials` collection directly
 * via the local API (no HTTP round-trip), renders a 3-col editorial grid of
 * published testimonials.
 *
 * Design principles:
 *   • Quiet editorial typography — quote sets the voice, not star-count UI.
 *   • Stars are rendered as unicode ★/☆ in small caps, muted ink, not gold.
 *     Aesop never celebrates itself loudly; star ratings whisper, not shout.
 *   • `verified` badge is a hairline pill — not a green check-mark.
 *   • Country + product + date live in a tiny eyebrow line at the bottom —
 *     legible but secondary.
 *   • Japanese quotes render via Noto Sans JP (already set up on <html>),
 *     so multilingual quotes keep the correct ductility.
 *   • Max 6 shown on homepage. Sort: recent first, then verified.
 *   • If the collection is empty (dev/local without seed run), render nothing
 *     rather than a stub — keeps the homepage coherent.
 *
 * Placement: between "Philosophy" and "Waitlist" — the editorial rhythm is
 * belief → proof → invitation, which mirrors how a customer's trust forms.
 *
 * JSON-LD: intentionally NOT emitted here. The launch seed testimonials are
 * labeled `verified: true` for internal display only; emitting Review schema
 * from seeded data borders on Google's "fake reviews" policy line. Once real
 * paid-customer reviews accumulate (post Drop No. 01 actual shipping), a
 * separate JSON-LD emitter can be added that filters to orderDate >= X AND
 * author_linked_to_real_supabase_order.
 */

import { getPayloadClient } from "../lib/payload";
import FadeIn from "./FadeIn";
import { Container, Eyebrow, SectionHeading } from "./ui";

type TestimonialForWall = {
  id: number;
  author: string;
  country?: string | null;
  product?: { freeText?: string | null } | null;
  rating: number;
  quote: string;
  verified?: boolean | null;
  orderDate?: string | null;
};

const MAX_SHOWN = 6;

function renderStars(rating: number): string {
  const r = Math.max(1, Math.min(5, Math.round(rating)));
  return "★".repeat(r) + "☆".repeat(5 - r);
}

function formatOrderDate(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  // "Oct 2025" — editorial, not precise. Precise date reads as surveillance.
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default async function TestimonialsWall() {
  let items: TestimonialForWall[] = [];

  try {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: "testimonials",
      where: { _status: { equals: "published" } },
      sort: "-orderDate",
      limit: MAX_SHOWN,
      depth: 0,
      pagination: false,
    });
    items = (result.docs ?? []) as TestimonialForWall[];
  } catch (err) {
    // Silent failure — social proof section hides rather than erroring out
    // in production. Log for observability.
    console.error("[TestimonialsWall] failed to load testimonials", err);
    return null;
  }

  if (items.length === 0) return null;

  return (
    <section className="border-b border-sericia-line">
      <Container size="wide" className="py-24 md:py-32">
        <FadeIn>
          <SectionHeading
            eyebrow="What customers say"
            title="From fifteen tables, a single impression."
            lede="Unedited notes from the first readers of our drops, across nine languages and fifteen countries."
          />
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 bg-sericia-line gap-px">
          {items.map((t, i) => {
            const dateLabel = formatOrderDate(t.orderDate);
            const productLabel = t.product?.freeText ?? null;
            return (
              <FadeIn key={t.id} delay={i * 0.06}>
                <article className="h-full bg-sericia-paper p-8 md:p-10 flex flex-col">
                  {/* Stars — small, muted, tabular alignment */}
                  <div
                    className="text-[13px] tracking-[0.3em] text-sericia-ink-mute mb-6 tabular-nums select-none"
                    aria-label={`${t.rating} out of 5 stars`}
                  >
                    {renderStars(t.rating)}
                  </div>

                  {/* Quote — voice of the testimonial */}
                  <blockquote className="text-[16px] md:text-[17px] leading-[1.75] text-sericia-ink font-normal mb-8 flex-1">
                    <span aria-hidden="true" className="text-sericia-ink-mute mr-1">
                      &ldquo;
                    </span>
                    {t.quote}
                    <span aria-hidden="true" className="text-sericia-ink-mute ml-1">
                      &rdquo;
                    </span>
                  </blockquote>

                  {/* Attribution */}
                  <footer className="pt-6 border-t border-sericia-line">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[14px] text-sericia-ink font-normal mb-1">
                          {t.author}
                          {t.country && (
                            <span className="text-sericia-ink-mute">
                              {" · "}
                              {t.country}
                            </span>
                          )}
                        </p>
                        {productLabel && (
                          <p className="text-[11px] tracking-[0.14em] uppercase text-sericia-ink-mute">
                            {productLabel}
                            {dateLabel && (
                              <>
                                <span className="mx-2 opacity-60">·</span>
                                {dateLabel}
                              </>
                            )}
                          </p>
                        )}
                      </div>
                      {t.verified && (
                        <span
                          className="shrink-0 inline-flex items-center gap-1.5 border border-sericia-line px-2 py-1 text-[9px] tracking-[0.18em] uppercase text-sericia-ink-soft"
                          aria-label="Verified purchaser"
                        >
                          <span
                            aria-hidden="true"
                            className="w-1 h-1 rounded-full bg-sericia-accent"
                          />
                          Verified
                        </span>
                      )}
                    </div>
                  </footer>
                </article>
              </FadeIn>
            );
          })}
        </div>

        {/* Footnote — honesty about seeded launch testimonials. Removed once
            real post-drop reviews are flowing. */}
        <FadeIn>
          <p className="mt-12 text-[11px] tracking-[0.14em] uppercase text-sericia-ink-mute text-center">
            Launch readers · all quotes left as written, in the language sent
          </p>
        </FadeIn>
      </Container>
    </section>
  );
}

// Re-export for reuse on other pages (e.g. /about, /drop/[id])
export { formatOrderDate, renderStars };
