/**
 * HomepageBlocks — server-component dispatcher for Payload-driven editorial.
 *
 * Reads the homepage global via getHomepageBlocks(), iterates the editor's
 * blocks[] array, and dispatches each block to its renderer by blockType.
 *
 * Currently wired block types:
 *   • story       → StoryBlockRenderer      (rich editorial text + image)
 *   • newsletter  → NewsletterBlockRenderer (email capture w/ editor CTA)
 *
 * Intentionally no-op block types (accepted by schema so editors can draft
 * them without errors, but data lives elsewhere in the app):
 *   • hero             → coded <CinematicHero /> above the fold
 *   • drop             → coded Current-drop / Most-loved sections (Supabase)
 *   • testimonialsStrip → coded <TestimonialsWall /> reads testimonials collection directly
 *   • pressStrip       → coded <PressStrip />      reads pressMentions collection directly
 *
 * If editors add a new block type in Payload that this dispatcher doesn't know,
 * it silently skips — never throws.
 */

import { getHomepageBlocks } from "@/lib/payload-blocks";
import StoryBlockRenderer from "@/components/blocks/StoryBlockRenderer";
import NewsletterBlockRenderer from "@/components/blocks/NewsletterBlockRenderer";
import HeroBlockRenderer from "@/components/blocks/HeroBlockRenderer";

type Props = {
  /** Country code for any block that needs it (e.g. newsletter waitlist attribution). */
  country: string;
};

export default async function HomepageBlocks({ country }: Props) {
  const blocks = await getHomepageBlocks();
  if (blocks.length === 0) return null;

  return (
    <>
      {blocks.map((block, i) => {
        // React key: prefer Payload's stable block.id, fall back to index.
        const key = block.id ?? `block-${i}`;

        switch (block.blockType) {
          case "story":
            return <StoryBlockRenderer key={key} block={block} />;
          case "newsletter":
            return (
              <NewsletterBlockRenderer key={key} block={block} country={country} />
            );
          case "hero":
            // Editor-placed mid-page hero (separate from <CinematicHero />).
            // Lets editors drop additional cinematic interludes anywhere
            // in the page — e.g. between testimonials and newsletter.
            return <HeroBlockRenderer key={key} block={block} />;
          // Intentional no-ops — data sources live in other components.
          case "drop":
          case "testimonialsStrip":
          case "pressStrip":
            return null;
          default:
            return null;
        }
      })}
    </>
  );
}
