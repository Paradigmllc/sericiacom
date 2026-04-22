/**
 * StoryBlockRenderer — editorial text + image block from Payload.
 *
 * Data: populated from `homepage.blocks[]` in Payload admin → Story block.
 * Fields: eyebrow (small kicker) + heading + body (Lexical richText, required)
 *         + imageRight (Media upload) + imageLayout ('right' | 'left' | 'below').
 *
 * Design:
 *   • Visual DNA matches the coded Philosophy section above it (Container,
 *     Eyebrow, 28px–32px prose) so editorial blocks don't clash with the
 *     brand skeleton.
 *   • Lexical → JSX is delegated to `@payloadcms/richtext-lexical/react`
 *     `<RichText>` with the default converters — covers headings, lists,
 *     links, bold/italic, images, blockquotes out of the box.
 *   • `imageLayout` = "below" collapses to a single vertical column; "right"
 *     / "left" give a 2-col grid on md+ and stack on mobile.
 */

import Image from "next/image";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { Container, Eyebrow } from "../ui";
import FadeIn from "../FadeIn";
import type { StoryBlockData } from "../../lib/payload-blocks";

type Props = { block: StoryBlockData };

function resolveMedia(media: StoryBlockData["imageRight"]) {
  if (!media || typeof media !== "object") return null;
  const url = media.url ?? null;
  if (!url) return null;
  return {
    url,
    alt: media.alt ?? "",
    width: media.width ?? 1200,
    height: media.height ?? 800,
  };
}

export default function StoryBlockRenderer({ block }: Props) {
  const { eyebrow, heading, body, imageLayout } = block;
  const image = resolveMedia(block.imageRight);
  const layout = imageLayout ?? "right";
  const hasImage = image !== null && layout !== "below";

  const textColumn = (
    <div className="space-y-6 text-sericia-ink">
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      {heading ? (
        <h2 className="text-[28px] md:text-[36px] leading-[1.2] font-normal">
          {heading}
        </h2>
      ) : null}
      <div className="prose prose-sericia max-w-none text-[18px] md:text-[20px] leading-[1.6]">
        <RichText data={body} />
      </div>
    </div>
  );

  return (
    <section className="border-b border-sericia-line">
      <Container size="default" className="py-24 md:py-32">
        <FadeIn>
          {hasImage ? (
            <div
              className={`grid gap-10 md:gap-16 md:grid-cols-2 items-center ${
                layout === "left" ? "md:[&>*:first-child]:order-2" : ""
              }`}
            >
              {textColumn}
              {image ? (
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-md bg-sericia-cream">
                  <Image
                    src={image.url}
                    alt={image.alt}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
              ) : null}
            </div>
          ) : (
            <div className="max-w-3xl mx-auto text-center">{textColumn}</div>
          )}
          {layout === "below" && image ? (
            <div className="relative aspect-[16/9] w-full mt-12 overflow-hidden rounded-md bg-sericia-cream">
              <Image
                src={image.url}
                alt={image.alt}
                fill
                sizes="(min-width: 1024px) 1024px, 100vw"
                className="object-cover"
              />
            </div>
          ) : null}
        </FadeIn>
      </Container>
    </section>
  );
}
