/**
 * NewsletterBlockRenderer — editor-controlled email capture.
 *
 * Data: populated from `homepage.blocks[]` in Payload admin → Newsletter block.
 * Fields: heading (required) + subheading + ctaLabel (required) +
 *         incentive (small eyebrow above) + disclaimer (small text below).
 *
 * Design:
 *   • Wraps the existing <WaitlistForm> client component (which owns POST →
 *     /api/waitlist and success state) so we don't fork the form logic.
 *     Only the label is editor-controlled — UTM/source attribution stays
 *     server-defined ("homepage-newsletter-block").
 *   • `incentive` renders as a <Eyebrow> above the heading so it stacks
 *     visually like the coded Waitlist block already does ("Next drop" eyebrow).
 *   • Disclaimer prints muted under the form — room for GDPR / unsubscribe
 *     copy the brand team updates without a deploy.
 */

import { Container, Eyebrow } from "../ui";
import FadeIn from "../FadeIn";
import WaitlistForm from "../WaitlistForm";
import type { NewsletterBlockData } from "../../lib/payload-blocks";

type Props = {
  block: NewsletterBlockData;
  /** Country code for waitlist attribution. Mirrors the coded waitlist section. */
  country: string;
};

export default function NewsletterBlockRenderer({ block, country }: Props) {
  const { heading, subheading, ctaLabel, incentive, disclaimer } = block;

  return (
    <section className="border-b border-sericia-line bg-sericia-cream">
      <Container size="default" className="py-24 md:py-32">
        <FadeIn>
          <div className="max-w-2xl mx-auto text-center space-y-6">
            {incentive ? <Eyebrow>{incentive}</Eyebrow> : null}
            <h2 className="text-[28px] md:text-[36px] leading-[1.2] font-normal text-sericia-ink">
              {heading}
            </h2>
            {subheading ? (
              <p className="text-[17px] md:text-[19px] leading-[1.6] text-sericia-ink/75">
                {subheading}
              </p>
            ) : null}
            <div className="pt-2">
              <WaitlistForm
                source="homepage-newsletter-block"
                country={country}
                ctaLabel={ctaLabel}
              />
            </div>
            {disclaimer ? (
              <p className="text-[13px] leading-[1.5] text-sericia-ink/55 max-w-md mx-auto">
                {disclaimer}
              </p>
            ) : null}
          </div>
        </FadeIn>
      </Container>
    </section>
  );
}
