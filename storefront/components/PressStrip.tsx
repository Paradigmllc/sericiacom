/**
 * PressStrip — "As mentioned in" horizontal logo row.
 *
 * Server Component sourced from Payload's `pressMentions` collection.
 *
 * Design notes:
 *   • Placed just below the hero — conventional position for an "as seen in"
 *     strip in editorial commerce (Aesop, Kinfolk, Bokksu all follow this).
 *   • Logos render as monochrome hairline images, desaturated by default,
 *     full-ink on hover. Matches the rest of the site's grayscale restraint.
 *   • No section heading — a tiny uppercase "As mentioned in" eyebrow is
 *     enough. Grand "Press" banners feel self-congratulatory.
 *   • If a PressMention has no logoSvg, we fall back to rendering the
 *     publication name in the site's display serif. Editors can leave logos
 *     empty for small indie publications without breaking the layout.
 *   • Silent-fail: empty collection → render nothing (same pattern as
 *     TestimonialsWall). Homepage stays coherent during local dev / pre-seed.
 *   • No JSON-LD here — press-mention Schema is debated (it's not a real
 *     published type). Link-outs to the articles provide the discovery path.
 */

import Image from "next/image";
import { getPayloadClient } from "../lib/payload";
import { Container } from "./ui";

type PayloadMedia = {
  id: number;
  url?: string | null;
  alt?: string | null;
  width?: number | null;
  height?: number | null;
  mimeType?: string | null;
};

type PressMentionDoc = {
  id: number;
  name: string;
  logoSvg?: PayloadMedia | number | null;
  url?: string | null;
  quote?: string | null;
  date?: string | null;
  order?: number | null;
};

const MAX_SHOWN = 8;

function isMediaObject(m: unknown): m is PayloadMedia {
  return typeof m === "object" && m !== null && "url" in m;
}

export default async function PressStrip() {
  let items: PressMentionDoc[] = [];

  try {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: "pressMentions",
      where: { _status: { equals: "published" } },
      // Depth 1 so logoSvg comes back as a populated media object, not a number.
      depth: 1,
      sort: ["order", "-date"],
      limit: MAX_SHOWN,
      pagination: false,
    });
    items = (result.docs ?? []) as PressMentionDoc[];
  } catch (err) {
    console.error("[PressStrip] payload query failed", err);
    return null;
  }

  if (items.length === 0) return null;

  return (
    <section
      aria-label="Press mentions"
      className="border-b border-sericia-line bg-sericia-paper-deep"
    >
      <Container size="wide" className="py-10 md:py-12">
        <p className="label mb-6 text-center">As mentioned in</p>
        <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 md:gap-x-14">
          {items.map((item) => {
            const media = isMediaObject(item.logoSvg) ? item.logoSvg : null;
            const logoUrl = media?.url ?? null;
            const logoAlt = media?.alt ?? `${item.name} logo`;
            const logoNode = logoUrl ? (
              <Image
                src={logoUrl}
                alt={logoAlt}
                width={media?.width ?? 120}
                height={media?.height ?? 32}
                unoptimized={media?.mimeType === "image/svg+xml"}
                className="h-7 md:h-8 w-auto object-contain opacity-60 hover:opacity-100 transition-opacity"
                style={{ filter: "grayscale(100%)" }}
              />
            ) : (
              <span className="font-serif text-[20px] md:text-[22px] tracking-tight text-sericia-ink-soft hover:text-sericia-ink transition-colors">
                {item.name}
              </span>
            );

            const content = (
              <span className="inline-flex items-center" aria-label={item.name}>
                {logoNode}
              </span>
            );

            return (
              <li key={item.id}>
                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center"
                    title={item.quote ?? item.name}
                  >
                    {content}
                  </a>
                ) : (
                  content
                )}
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
