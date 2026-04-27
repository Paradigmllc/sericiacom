import type { GlobalConfig } from "payload";

export const SiteSettings: GlobalConfig = {
  slug: "siteSettings",
  label: "Site Settings",
  admin: {
    group: "Settings",
    description:
      "Global site-wide settings: announcement bar, social links, footer copy, hero defaults.",
  },
  access: {
    read: () => true, // public read; storefront fetches at build/runtime
    update: ({ req: { user } }) =>
      !!user && (user.role === "admin" || user.role === "editor"),
  },
  fields: [
    {
      name: "heroVideoUrl",
      type: "text",
      admin: {
        description:
          "Background video URL for the homepage CinematicHero. Upload to Media collection first, then paste the URL here. Prefer MP4 <10MB. If empty, uses the env-driven fallback (NEXT_PUBLIC_HERO_VIDEO_URL) or a gradient-only hero.",
      },
    },
    {
      name: "heroPosterUrl",
      type: "text",
      admin: {
        description:
          "Static image shown while the hero video buffers (or as a still on mobile / reduced-motion). Should match the video's first frame for a clean fade-in.",
      },
    },
    {
      name: "heroImageUrl",
      type: "text",
      admin: { description: "Fallback hero image URL (used if no video set)." },
    },
    {
      // Editorial copy for the homepage CinematicHero. Every visible string
      // here can be edited without a deploy. Each field is localised across
      // all 10 supported locales (en/ja/de/fr/es/it/ko/zh-TW/ru/ar).
      name: "heroCopy",
      type: "group",
      label: "Hero — copy",
      fields: [
        {
          name: "eyebrow",
          type: "text",
          localized: true,
          admin: { description: "Small all-caps kicker. Default: 'Drop No. 01 — Limited release'." },
        },
        {
          name: "headlineLine1",
          type: "text",
          localized: true,
          admin: { description: "Top line of the giant H1. Default: 'Rescued Japanese'." },
        },
        {
          name: "headlineLine2",
          type: "text",
          localized: true,
          admin: { description: "Bottom line of the giant H1. Default: 'craft food,'." },
        },
        {
          name: "typewriterStrings",
          type: "array",
          labels: { singular: "Typewriter line", plural: "Typewriter lines" },
          admin: {
            description:
              "Lines that cycle through the typewriter effect. Order matters. Empty = uses defaults. Each line localised.",
          },
          fields: [
            { name: "text", type: "text", localized: true, required: true },
          ],
        },
        {
          name: "body",
          type: "textarea",
          localized: true,
          admin: { description: "Sub-paragraph below the headline. Default: 'Each drop is a single curated bundle...'." },
        },
        {
          name: "metaLines",
          type: "array",
          labels: { singular: "Meta line", plural: "Meta lines" },
          admin: { description: "Small caps meta strip. Default: 'Kyoto, Japan' / 'EMS worldwide' / '50 units'." },
          fields: [
            { name: "text", type: "text", localized: true, required: true },
          ],
        },
        {
          name: "primaryCtaLabel",
          type: "text",
          localized: true,
          admin: { description: "Primary button label. Default: 'Shop the drop'." },
        },
        {
          name: "primaryCtaUrl",
          type: "text",
          admin: { description: "Primary button destination. Default: '/products'." },
        },
        {
          name: "secondaryCtaLabel",
          type: "text",
          localized: true,
          admin: { description: "Secondary link label. Default: 'Our story'." },
        },
        {
          name: "secondaryCtaUrl",
          type: "text",
          admin: { description: "Secondary link destination. Default: '/#story'." },
        },
      ],
    },
    {
      name: "announcementBar",
      type: "group",
      fields: [
        {
          name: "enabled",
          type: "checkbox",
          defaultValue: true,
          admin: { description: "Master switch. Uncheck to hide the marquee bar entirely." },
        },
        {
          // Preferred: array of items that scroll in the marquee. Each item
          // is independently localised. If empty, falls back to legacy single
          // `text` field below for backward compatibility with old content.
          name: "items",
          type: "array",
          labels: { singular: "Item", plural: "Items" },
          admin: {
            description:
              "Phrases that scroll across the top of every page. Drag to reorder. 4–8 items work best (too few → repetition obvious, too many → marquee speed drops). Each phrase localised across all 10 languages.",
          },
          fields: [
            { name: "text", type: "text", localized: true, required: true },
            {
              name: "link",
              type: "text",
              admin: { description: "Optional URL. If empty, the phrase is plain text." },
            },
          ],
        },
        {
          name: "text",
          type: "text",
          localized: true,
          admin: {
            description:
              "(Legacy) Single phrase. Only used if `items` array is empty. Kept for backward compatibility.",
            condition: (_data: unknown, siblingData: { items?: unknown[] | null }) =>
              !siblingData?.items || siblingData.items.length === 0,
          },
        },
        {
          name: "link",
          type: "text",
          admin: {
            condition: (_data: unknown, siblingData: { items?: unknown[] | null }) =>
              !siblingData?.items || siblingData.items.length === 0,
          },
        },
        {
          name: "backgroundColor",
          type: "text",
          defaultValue: "#1a1a1a",
          admin: { description: "CSS color value (hex/rgb/oklch). Default: Sericia ink." },
        },
        {
          name: "textColor",
          type: "text",
          defaultValue: "#ffffff",
          admin: { description: "CSS color value. Default: Sericia paper." },
        },
        {
          name: "scrollSpeedSeconds",
          type: "number",
          defaultValue: 40,
          admin: { description: "Full marquee cycle time. Lower = faster. Default 40s." },
        },
      ],
    },
    {
      name: "socialLinks",
      type: "array",
      labels: { singular: "Social link", plural: "Social links" },
      fields: [
        {
          name: "platform",
          type: "select",
          required: true,
          options: [
            { label: "Instagram", value: "instagram" },
            { label: "X / Twitter", value: "x" },
            { label: "TikTok", value: "tiktok" },
            { label: "YouTube", value: "youtube" },
            { label: "Pinterest", value: "pinterest" },
            { label: "Facebook", value: "facebook" },
            { label: "LINE", value: "line" },
            { label: "WeChat", value: "wechat" },
            { label: "Threads", value: "threads" },
          ],
        },
        {
          name: "url",
          type: "text",
          required: true,
        },
      ],
    },
    {
      name: "footerCopy",
      type: "group",
      fields: [
        {
          name: "tagline",
          type: "textarea",
          localized: true,
        },
        {
          name: "copyrightText",
          type: "text",
          localized: true,
        },
        // -- Phase 2-A: top editorial band of the rich Aesop-tier footer --
        {
          name: "editorialEyebrow",
          type: "text",
          localized: true,
          admin: { description: "Footer top band — small eyebrow. Default: 'Quietly, from Kyoto'." },
        },
        {
          name: "editorialHeading",
          type: "text",
          localized: true,
          admin: { description: "Footer top band — large heading. Default: 'Four to six times a year, we open the door.'." },
        },
        {
          name: "editorialBody",
          type: "textarea",
          localized: true,
          admin: { description: "Subscribe-band body copy. Default mentions Kyoto, EMS, 48h." },
        },
        {
          name: "subscribePrivacyNote",
          type: "textarea",
          localized: true,
          admin: { description: "Small print under subscribe form. Default mentions monthly, unsubscribe, privacy." },
        },
        {
          name: "studioCopy",
          type: "textarea",
          localized: true,
          admin: { description: "Footer band 3 — Studio paragraph. Default: 'Paradigm LLC — registered in Delaware...'." },
        },
        {
          name: "currentlyViewingLabel",
          type: "text",
          localized: true,
          admin: { description: "Locale-acknowledgement label. Default: 'Currently viewing:'." },
        },
        // -- Phase 2-A: 4 or more footer columns --
        {
          name: "columns",
          type: "array",
          labels: { singular: "Column", plural: "Columns" },
          admin: {
            description:
              "Footer link columns. Drag to reorder. 4 columns is the visual sweet spot. If empty, defaults to coded structure (Shop / Tools / Company / Support).",
          },
          fields: [
            {
              name: "title",
              type: "text",
              localized: true,
              required: true,
              admin: { description: "Column heading (eyebrow style)." },
            },
            {
              name: "links",
              type: "array",
              labels: { singular: "Link", plural: "Links" },
              fields: [
                { name: "label", type: "text", localized: true, required: true },
                { name: "url", type: "text", required: true },
                {
                  name: "external",
                  type: "checkbox",
                  defaultValue: false,
                  admin: { description: "Tick if URL opens in new tab." },
                },
              ],
            },
          ],
        },
        {
          name: "legalLinks",
          type: "array",
          fields: [
            { name: "label", type: "text", localized: true, required: true },
            { name: "url", type: "text", required: true },
          ],
        },
      ],
    },
    // ── Phase 2-C: Coupon banner ──
    {
      name: "couponBanner",
      type: "group",
      label: "Coupon banner",
      admin: {
        description:
          "Sticky launch promotion strip above the header. Editor controls enabled/copy/code without a deploy. Code must match the actual Medusa promotion to be applied at checkout.",
      },
      fields: [
        {
          name: "enabled",
          type: "checkbox",
          defaultValue: true,
          admin: { description: "Master switch — uncheck to hide entirely." },
        },
        {
          name: "code",
          type: "text",
          defaultValue: "SERICIA10",
          admin: {
            description:
              "Coupon code. Should match a Medusa promotion exactly. This same value is used as the link to the checkout pre-applied path.",
          },
        },
        {
          name: "headline",
          type: "text",
          localized: true,
          admin: {
            description:
              "Top label. Default: 'Launch offer'. Localised so 'ローンチ特典' shows for ja viewers.",
          },
        },
        {
          name: "offerText",
          type: "text",
          localized: true,
          admin: {
            description:
              "Main offer phrase. Default: '10% off your first order'. Reads after the headline + dash.",
          },
        },
        {
          name: "withCodePrefix",
          type: "text",
          localized: true,
          admin: { description: "Glue text before the code. Default: 'with code'." },
        },
        {
          name: "storageKeyVersion",
          type: "text",
          defaultValue: "v1",
          admin: {
            description:
              "Bump this string (v2/v3/...) to force every visitor to see the banner again. We append it to the localStorage dismiss key.",
          },
        },
      ],
    },
    // ── Phase 3-D: Navigation header items ──
    {
      name: "navigation",
      type: "group",
      label: "Navigation (header)",
      admin: {
        description:
          "Header navigation items. If empty, falls back to the coded brand defaults (Shop / Current drop / Story / Guides). Localised per item.",
      },
      fields: [
        {
          name: "items",
          type: "array",
          labels: { singular: "Nav item", plural: "Nav items" },
          fields: [
            { name: "label", type: "text", localized: true, required: true },
            { name: "url", type: "text", required: true },
            {
              name: "highlighted",
              type: "checkbox",
              defaultValue: false,
              admin: { description: "Render with stronger visual weight (e.g. CTA-style)." },
            },
            // ── F2 Mega menu: optional Aesop-style hover panel per nav item ──
            // When `mega.enabled` is true, hovering / focusing this nav item
            // opens a wide multi-column panel. Empty/disabled = behaves as a
            // plain link (current behaviour). One mega per nav item.
            {
              name: "mega",
              type: "group",
              label: "Mega menu (optional)",
              admin: {
                description:
                  "Optional Aesop-style hover panel. If 'enabled' is unchecked, the nav item behaves as a plain link.",
              },
              fields: [
                { name: "enabled", type: "checkbox", defaultValue: false },
                {
                  name: "columns",
                  type: "array",
                  labels: { singular: "Column", plural: "Columns" },
                  admin: {
                    description:
                      "Link columns inside the panel. 1-3 columns is the visual sweet spot.",
                  },
                  fields: [
                    {
                      name: "title",
                      type: "text",
                      localized: true,
                      admin: { description: "Column heading (small caps eyebrow style)." },
                    },
                    {
                      name: "links",
                      type: "array",
                      labels: { singular: "Link", plural: "Links" },
                      fields: [
                        { name: "label", type: "text", localized: true, required: true },
                        { name: "url", type: "text", required: true },
                      ],
                    },
                  ],
                },
                {
                  name: "featuredCards",
                  type: "array",
                  labels: { singular: "Featured card", plural: "Featured cards" },
                  admin: {
                    description:
                      "Right-side image cards (1-2 recommended). Each shows a title + image + optional caption + URL. If imageUrl is empty, falls back to a brand gradient.",
                  },
                  fields: [
                    { name: "title", type: "text", localized: true, required: true },
                    {
                      name: "caption",
                      type: "text",
                      localized: true,
                      admin: { description: "Small line under the title." },
                    },
                    { name: "url", type: "text", required: true },
                    {
                      name: "imageUrl",
                      type: "text",
                      admin: {
                        description:
                          "Optional image URL. Empty → tone-based gradient fallback. NEVER use AI-gen / random Unsplash here — Sericia brand rule.",
                      },
                    },
                    {
                      name: "tone",
                      type: "select",
                      defaultValue: "paper",
                      options: [
                        { label: "Paper (neutral)", value: "paper" },
                        { label: "Tea (green)", value: "tea" },
                        { label: "Miso (warm brown)", value: "miso" },
                        { label: "Mushroom (deep brown)", value: "mushroom" },
                        { label: "Seasoning (gold)", value: "seasoning" },
                        { label: "Drop (warm)", value: "drop" },
                        { label: "Ink (dark)", value: "ink" },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    // ── Phase 3-E: Region banners (under-header banner per region) ──
    {
      name: "regionBanners",
      type: "array",
      labels: { singular: "Region banner", plural: "Region banners" },
      admin: {
        description:
          "Region-specific banner shown under the header. Country code matches Sericia's region slugs (jp/us/eu/gb/ca/au/sg/hk/me). First match wins. Empty array → no banner.",
      },
      fields: [
        {
          name: "regionCode",
          type: "select",
          required: true,
          options: [
            { label: "Japan", value: "jp" },
            { label: "United States", value: "us" },
            { label: "Europe (EU)", value: "eu" },
            { label: "United Kingdom", value: "gb" },
            { label: "Canada", value: "ca" },
            { label: "Australia", value: "au" },
            { label: "Singapore", value: "sg" },
            { label: "Hong Kong", value: "hk" },
            { label: "Middle East", value: "me" },
          ],
        },
        {
          name: "text",
          type: "text",
          localized: true,
          required: true,
          admin: { description: "Banner copy. e.g. 'Free shipping over $200' or '送料無料 ¥30,000〜'." },
        },
        {
          name: "url",
          type: "text",
          admin: { description: "Optional link. If empty, banner is plain text." },
        },
        {
          name: "enabled",
          type: "checkbox",
          defaultValue: true,
        },
      ],
    },
    // ── Phase 2-B: Homepage section copy (every visible eyebrow + heading + lede) ──
    {
      name: "homepageCopy",
      type: "group",
      label: "Homepage — section copy",
      admin: {
        description:
          "Edit every section eyebrow / heading / intro on the homepage. Each field is localised. Empty fields fall back to the coded brand default — never ship empty strings.",
      },
      fields: [
        {
          name: "currentDrop",
          type: "group",
          fields: [
            { name: "eyebrow", type: "text", localized: true },
            { name: "title", type: "text", localized: true },
            { name: "lede", type: "textarea", localized: true },
          ],
        },
        {
          name: "featuredBundle",
          type: "group",
          fields: [
            { name: "eyebrow", type: "text", localized: true },
            // ── F1 Cinematic videos: drop bundle right-side imagery ──
            // Replaces the gradient placeholders on the homepage drop section.
            // Editor uploads to Media collection, then pastes the URL here.
            // Empty = gradient + grain fallback (current production state).
            {
              name: "heroVideoUrl",
              type: "text",
              admin: {
                description:
                  "Large bundle video (col-span-2 / aspect 4:5). Slow still-life loop ≤15s, MP4 <8MB. Empty → gradient + grain.",
              },
            },
            {
              name: "heroPosterUrl",
              type: "text",
              admin: {
                description:
                  "Poster frame for bundle video (first frame). Required for CLS=0 if video URL is set.",
              },
            },
            {
              name: "secondaryVideoUrlA",
              type: "text",
              admin: {
                description:
                  "Bottom-left square video (e.g. tea brewing). Optional. Empty → gradient.",
              },
            },
            {
              name: "secondaryPosterUrlA",
              type: "text",
            },
            {
              name: "secondaryVideoUrlB",
              type: "text",
              admin: {
                description:
                  "Bottom-right square video (e.g. miso scoop / shiitake bamboo). Optional.",
              },
            },
            {
              name: "secondaryPosterUrlB",
              type: "text",
            },
          ],
        },
        // ── F1 New: full-bleed cinematic interstitial between Makers & Philosophy ──
        // Aesop's signature "breathing room" video — wide 21:9 strip, no copy
        // overlay, just imagery. Empty disables the section entirely (silent
        // fallback — no empty band shipped).
        {
          name: "interstitial",
          type: "group",
          label: "Interstitial — cinematic break",
          admin: {
            description:
              "Optional full-bleed video between Makers and Philosophy sections. Wide 21:9 letterbox. If videoUrl is empty, the section is hidden — never ships an empty band.",
          },
          fields: [
            {
              name: "videoUrl",
              type: "text",
              admin: {
                description:
                  "Full-bleed loop video (21:9). Slow Kyoto morning, hands at work, etc. Empty → entire section hidden.",
              },
            },
            {
              name: "posterUrl",
              type: "text",
              admin: { description: "Poster frame. Strongly recommended if video is set." },
            },
            {
              name: "caption",
              type: "text",
              localized: true,
              admin: {
                description:
                  "Tiny overlay caption (e.g. 'Kyoto, 5:42 AM'). Empty → no caption.",
              },
            },
          ],
        },
        {
          name: "mostLoved",
          type: "group",
          fields: [
            { name: "eyebrow", type: "text", localized: true },
            { name: "title", type: "text", localized: true },
          ],
        },
        {
          name: "makers",
          type: "group",
          fields: [
            { name: "eyebrow", type: "text", localized: true },
            { name: "title", type: "text", localized: true },
            { name: "lede", type: "textarea", localized: true },
            {
              name: "items",
              type: "array",
              labels: { singular: "Maker", plural: "Makers" },
              admin: {
                description:
                  "Producer cards. If empty, defaults to coded 3-maker fallback (Yamane-en / Kurashige Jozoten / Yamagata Mori).",
              },
              fields: [
                { name: "name", type: "text", required: true },
                { name: "craft", type: "text", localized: true, required: true },
                { name: "region", type: "text", localized: true, required: true },
                { name: "note", type: "textarea", localized: true, required: true },
                // ── F1 per-maker cinematic video ──
                // Replaces the gradient card with a regional still-life loop
                // (rice paddy, cedar shed, bamboo rack). Empty = gradient.
                {
                  name: "videoUrl",
                  type: "text",
                  admin: {
                    description:
                      "Per-maker still-life video (4:5). e.g. tea field, miso barrel, bamboo rack. Empty → category gradient.",
                  },
                },
                {
                  name: "posterUrl",
                  type: "text",
                  admin: { description: "Poster frame. Recommended if videoUrl is set." },
                },
                {
                  name: "tone",
                  type: "select",
                  defaultValue: "tea",
                  options: [
                    { label: "Tea (green)", value: "tea" },
                    { label: "Miso (warm brown)", value: "miso" },
                    { label: "Mushroom (deep brown)", value: "mushroom" },
                    { label: "Seasoning (gold)", value: "seasoning" },
                    { label: "Paper (neutral)", value: "paper" },
                    { label: "Ink (dark)", value: "ink" },
                  ],
                  admin: {
                    description:
                      "Gradient tone shown when no video is set. Match the maker's craft.",
                  },
                },
              ],
            },
          ],
        },
        {
          name: "philosophy",
          type: "group",
          fields: [
            { name: "eyebrow", type: "text", localized: true },
            { name: "body", type: "textarea", localized: true },
          ],
        },
        {
          name: "waitlist",
          type: "group",
          fields: [
            { name: "eyebrow", type: "text", localized: true },
            { name: "title", type: "text", localized: true },
            { name: "body", type: "textarea", localized: true },
            { name: "footnote", type: "text", localized: true },
          ],
        },
        {
          name: "howItWorks",
          type: "group",
          fields: [
            { name: "eyebrow", type: "text", localized: true },
            { name: "title", type: "text", localized: true },
            {
              name: "steps",
              type: "array",
              labels: { singular: "Step", plural: "Steps" },
              admin: { description: "4 steps recommended. Defaults to coded 4-step fallback." },
              fields: [
                { name: "number", type: "text", required: true, admin: { description: "e.g. '01' / '02'." } },
                { name: "title", type: "text", localized: true, required: true },
                { name: "body", type: "textarea", localized: true, required: true },
              ],
            },
          ],
        },
        {
          name: "faq",
          type: "group",
          fields: [
            { name: "eyebrow", type: "text", localized: true },
            { name: "title", type: "text", localized: true },
            {
              name: "items",
              type: "array",
              labels: { singular: "Q & A", plural: "Q & A items" },
              admin: { description: "FAQ items. Defaults to coded 4-item brand baseline." },
              fields: [
                { name: "q", type: "text", localized: true, required: true },
                { name: "a", type: "textarea", localized: true, required: true },
              ],
            },
            {
              name: "ctaLabel",
              type: "text",
              localized: true,
              admin: { description: "Button label below FAQ. Default: 'Read the full shipping policy'." },
            },
            {
              name: "ctaUrl",
              type: "text",
              admin: { description: "Default: /shipping." },
            },
          ],
        },
      ],
    },
    {
      name: "contact",
      type: "group",
      fields: [
        { name: "supportEmail", type: "email" },
        { name: "pressEmail", type: "email" },
        { name: "phone", type: "text" },
        { name: "addressLines", type: "textarea", localized: true },
      ],
    },
    {
      name: "seoDefaults",
      type: "group",
      label: "SEO Defaults",
      fields: [
        { name: "defaultTitle", type: "text", localized: true },
        { name: "titleSuffix", type: "text", localized: true },
        { name: "defaultDescription", type: "textarea", localized: true },
        { name: "defaultOgImage", type: "upload", relationTo: "media" },
      ],
    },
  ],
};

export default SiteSettings;
