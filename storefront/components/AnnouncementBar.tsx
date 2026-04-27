"use client";

/**
 * AnnouncementBar — top-of-page marquee.
 *
 * Sources its strings from Payload SiteSettings.announcementBar via
 * `useSettings()`. Falls back to hardcoded defaults when:
 *   • SiteSettings is null (Payload outage)
 *   • announcementBar.enabled is false (master kill switch)
 *   • items[] is empty AND legacy `text` is empty
 *
 * Editor surface (Payload `/cms/admin` → Globals → Site Settings → Announcement bar):
 *   • enabled (master switch)
 *   • items[] = [{ text (localised), link? }]   ← preferred
 *   • text + link (legacy, single-item)         ← backward-compat
 *   • backgroundColor / textColor (CSS values)
 *   • scrollSpeedSeconds (cycle duration)
 *
 * Layout note:
 *   We render thrice the array width-wise (`[...items, ...items, ...items]`)
 *   then translate -33.333%. This produces a seamless loop without measuring
 *   element width — the third copy guarantees the visible viewport is always
 *   filled even at the seam.
 */

import { useSettings } from "./SettingsProvider";

const DEFAULT_ITEMS: { text: string; link?: string }[] = [
  { text: "Free EMS worldwide" },
  { text: "Hand-packed in Kyoto" },
  { text: "Ships within 48 hours" },
  { text: "Small-batch, limited releases" },
  { text: "23+ countries" },
  { text: "Tracked delivery" },
];

export default function AnnouncementBar() {
  const settings = useSettings();
  const bar = settings?.announcementBar;

  // Master kill switch from CMS: editor unticks `enabled` → bar disappears.
  // Default behaviour when settings null: stay visible (assume editor wants it).
  if (bar && bar.enabled === false) return null;

  // Resolve items: prefer items[], fall back to legacy single text/link,
  // fall back to hardcoded defaults if both are empty.
  let items: { text: string; link?: string }[];
  if (bar?.items && bar.items.length > 0) {
    items = bar.items
      .filter((it): it is { text: string; link?: string | null; id?: string | null } =>
        Boolean(it && typeof (it as { text?: unknown }).text === "string" && (it as { text: string }).text.trim().length > 0),
      )
      .map((it) => ({ text: it.text, link: it.link ?? undefined }));
  } else if (bar?.text && bar.text.trim().length > 0) {
    items = [{ text: bar.text, link: bar.link ?? undefined }];
  } else {
    items = DEFAULT_ITEMS;
  }

  // Defensive: empty after filtering → render nothing rather than empty bar
  if (items.length === 0) return null;

  const bgColor = bar?.backgroundColor || "#1a1a1a";
  const textColor = bar?.textColor || "#ffffff";
  const speed = bar?.scrollSpeedSeconds ?? 40;
  const sequence = [...items, ...items, ...items];

  return (
    <div
      className="relative z-[60] overflow-hidden border-b border-sericia-line"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <div
        className="announcement-marquee flex whitespace-nowrap py-2"
        aria-label="Announcements"
        style={{ animationDuration: `${speed}s` }}
      >
        {sequence.map((it, i) => {
          const inner = (
            <span
              key={`${it.text}-${i}`}
              className="px-8 text-[11px] tracking-[0.22em] uppercase font-light inline-flex items-center gap-8"
            >
              {it.text}
              <span aria-hidden className="inline-block h-px w-3" style={{ backgroundColor: textColor, opacity: 0.5 }} />
            </span>
          );
          // If editor provided a link, wrap in anchor. External links get
          // safe rel + new tab; internal paths (start with `/`) stay in tab.
          if (it.link) {
            const isExternal = /^https?:\/\//i.test(it.link);
            return (
              <a
                key={`a-${i}`}
                href={it.link}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className="hover:opacity-80 transition-opacity"
              >
                {inner}
              </a>
            );
          }
          return inner;
        })}
      </div>
      <style>{`
        .announcement-marquee {
          animation: sericia-marquee linear infinite;
          will-change: transform;
        }
        .announcement-marquee:hover { animation-play-state: paused; }
        @keyframes sericia-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-33.3333%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .announcement-marquee { animation: none; }
        }
      `}</style>
    </div>
  );
}
