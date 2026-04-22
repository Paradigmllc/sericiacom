import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import ContentSidebar from "../../components/ContentSidebar";
import { Container, PageHero, Rule, StatBlock } from "../../components/ui";

/**
 * /about — the long-form narrative version of the homepage /#story section.
 *
 * The homepage carries a short "Our philosophy" slab; this page expands on
 * the same voice with mission, sourcing model, and producer-share mechanics.
 * Intentionally kept as a server component (no FadeIn / StatCountUp) so it
 * pre-renders fully for SEO and has a fast LCP.
 *
 * Cross-navigation to /tokushoho at the bottom satisfies the Consumer
 * Affairs Agency recommendation that the 特商法 page be linked from
 * anywhere a Japanese visitor might land.
 */

export const metadata: Metadata = {
  title: "About Sericia | 会社情報",
  description:
    "Sericia is a Kyoto-rooted, globally shipped curation of rescued Japanese craft food — near-expiry surplus sourced directly from small producers and bundled into limited drops.",
  alternates: { canonical: "https://sericia.com/about" },
};

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <PageHero
        eyebrow="About"
        title="Rescued Japanese craft, curated in Kyoto, shipped worldwide."
        lede="Sericia is a limited-drop storefront for near-expiry surplus from small Japanese producers — tea, miso, shiitake, and other craft foods that would otherwise be discarded despite being in peak condition."
      />

      <Container size="wide" className="py-20 md:py-28">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          <div className="flex-1 min-w-0 max-w-[680px] prose-aesop">
        <h2>One — Why this exists</h2>
        <p>
          Japan&apos;s craft food makers produce exceptional goods on small
          margins. A 120-year-old miso shed, a single-origin sencha farmer, a
          family drying shiitake on bamboo racks — each produces limited volume
          on long timelines. A missed wholesale order, a printing error on a
          label, a slightly-too-short remaining best-before window: any of
          these can push weeks of work into disposal. Not because the food is
          less good, but because the distribution system was never built for
          small batches and international eaters.
        </p>
        <p>
          Sericia finds that stock, curates it into a single drop, photographs
          every piece, names every producer, and ships it from Kyoto to tables
          around the world — at a price that pays the producer in full and
          still lands softly for the customer.
        </p>

        <h2>Two — How a drop comes together</h2>
        <ul>
          <li>
            <strong>Source.</strong> We work with a rotating set of small
            producers across Kyoto, Uji, Nagano, and Oita. Each drop pulls
            stock from three to five of them.
          </li>
          <li>
            <strong>Curate.</strong> Every piece is tasted, weighed, and
            approved before it enters the bundle. If it wouldn&apos;t arrive
            on our own dinner table, it doesn&apos;t ship.
          </li>
          <li>
            <strong>Pack.</strong> Hand-packed in Kyoto within 48 hours of the
            drop going live. A printed tasting card goes in each box —
            producer name, region, storage notes, and a suggested first meal.
          </li>
          <li>
            <strong>Ship.</strong> EMS worldwide with tracking. 2–7 business
            days to most countries, customs paperwork pre-filled on our side.
          </li>
        </ul>

        <h2>Three — The producer-share principle</h2>
        <p>
          When a producer is about to lose stock to expiry, the conventional
          discount channel pays them cents on the yen. Sericia pays the
          producer their <em>full</em> wholesale price. The margin we earn
          comes from the international retail uplift we add for doing the
          curation, packing, and EMS paperwork — not from squeezing the
          producer. This is non-negotiable: if we can&apos;t land a bundle at
          full producer-share, the bundle doesn&apos;t ship.
        </p>

        <h2>Four — Why limited drops</h2>
        <p>
          Rescued stock is, by definition, finite. Limited-drop scheduling
          lets us move exactly the volume a producer has available, without
          creating evergreen demand we can&apos;t meet. It also keeps freight
          efficient — one concentrated shipping window per drop means
          tighter EMS rates and fresher arrival.
        </p>
        <p>
          Subscribers to the next-drop waitlist receive the release 24 hours
          before public sale, a photographed maker&apos;s note, and a tasting
          card. Drops typically sell out within a day.
        </p>

        <Rule className="my-14" />

        <div className="not-prose grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16 mb-14">
          <StatBlock value="23+" label="Countries shipped" />
          <StatBlock value="48h" label="Dispatch from Kyoto" />
          <StatBlock value="100%" label="Producers paid full price" />
        </div>

        <h2>Five — Who&apos;s behind Sericia</h2>
        <p>
          Sericia is operated by{" "}
          <strong>Paradigm LLC</strong>, a Delaware-registered company running
          small Japan-to-world craft commerce brands. Our Japan operations
          are headquartered in Tokyo with a dispatch node in Kyoto. Contact
          us at{" "}
          <a
            href="mailto:contact@sericia.com"
            className="underline-link"
          >
            contact@sericia.com
          </a>
          .
        </p>

        <Rule className="my-14" />

        <p className="label mb-4">Also on Sericia</p>
        <ul className="not-prose grid grid-cols-1 md:grid-cols-2 gap-3 text-[14px]">
          <li>
            <Link
              href="/tokushoho"
              className="text-sericia-ink-soft hover:text-sericia-ink"
            >
              特定商取引法に基づく表記 / Legal notation
            </Link>
          </li>
          <li>
            <Link
              href="/shipping"
              className="text-sericia-ink-soft hover:text-sericia-ink"
            >
              Shipping information
            </Link>
          </li>
          <li>
            <Link
              href="/refund"
              className="text-sericia-ink-soft hover:text-sericia-ink"
            >
              Refund policy
            </Link>
          </li>
          <li>
            <Link
              href="/terms"
              className="text-sericia-ink-soft hover:text-sericia-ink"
            >
              Terms of sale
            </Link>
          </li>
          <li>
            <Link
              href="/privacy"
              className="text-sericia-ink-soft hover:text-sericia-ink"
            >
              Privacy
            </Link>
          </li>
          <li>
            <Link
              href="/journal"
              className="text-sericia-ink-soft hover:text-sericia-ink"
            >
              Journal
            </Link>
          </li>
        </ul>
          </div>
          <ContentSidebar />
        </div>
      </Container>
      <SiteFooter />
    </>
  );
}
