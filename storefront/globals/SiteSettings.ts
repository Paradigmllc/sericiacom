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
