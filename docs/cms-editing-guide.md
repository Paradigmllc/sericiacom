# Sericia CMS Editing Guide

Hybrid CMS model: the **brand skeleton** (hero, ticker, footer, product listings) is coded in Next.js. The **editorial middle** — the space between "our philosophy" and the waitlist — is edited in Payload admin via drag-and-drop blocks.

This guide is for brand / content editors who need to update homepage copy without a deploy.

---

#### 📋 目次

| # | セクション |
|---|-----------|
| 1 | [Logging in](#cms-login) |
| 2 | [The homepage blocks panel](#cms-homepage-panel) |
| 3 | [Block type: Story](#cms-story) |
| 4 | [Block type: Newsletter](#cms-newsletter) |
| 5 | [Block types that currently don't render](#cms-noop) |
| 6 | [Localization — editing in 10 languages](#cms-i18n) |
| 7 | [Drafts vs publish](#cms-drafts) |
| 8 | [Media uploads](#cms-media) |
| 9 | [Troubleshooting](#cms-troubleshoot) |

---

## <a id="cms-login"></a>1. Logging in

1. Navigate to **`https://sericia.com/cms/admin`**.
2. Sign in with your Payload editor account (provisioned by engineering — email `hello@sericia.com` for access).
3. The admin UI shows three groups on the left:
   - **Collections**: repeating content (Articles, Guides, Tools, Media, Testimonials, Press mentions).
   - **Globals**: singleton content (Site settings, **Homepage**).
   - **Users**: editor accounts.

Most homepage editing happens in **Globals → Homepage**.

---

## <a id="cms-homepage-panel"></a>2. The homepage blocks panel

Open **Globals → Homepage**. Scroll past the SEO fields (meta title / description / OG image) to the **Blocks** field.

- **Add block** button reveals 6 block types: Hero, Drop, Testimonials strip, Press strip, Story, Newsletter.
- Blocks can be reordered by dragging the handle on the left of each block card.
- Each block has a **Collapse** toggle — collapse older blocks so you can focus on what you're editing.
- Press **Save draft** to preview without publishing; **Publish changes** makes it live.

Only **Story** and **Newsletter** blocks render on the live homepage today. The other 4 block types are accepted by the schema (so editors can draft them) but currently no-op — see §5.

---

## <a id="cms-story"></a>3. Block type: Story

Purpose: an editorial section with a kicker, heading, rich text body, and an optional image. Use this for producer stories, seasonal notes, or "behind the drop" essays.

Fields:
- **Eyebrow** (optional): small all-caps kicker above the heading (e.g. `From the kitchen`).
- **Heading** (optional): one-line title (28–36px on the page).
- **Body** (required): rich text. Supports headings (H2/H3), lists, bold/italic, links, blockquotes, and inline images.
- **Image right** (optional): an image upload. Pulls from the **Media** collection — see §8.
- **Image layout**: `right` (default) / `left` / `below`.
  - `right` / `left`: image beside text on desktop (2 columns), stacks below text on mobile.
  - `below`: text is centered, image is full-width below — good for wide landscape photos.

**Localization**: eyebrow, heading, and body are all localized (§6). Images are shared across locales by default.

---

## <a id="cms-newsletter"></a>4. Block type: Newsletter

Purpose: an email capture section with editor-controlled heading and CTA label. Submissions flow into the same `/api/waitlist` endpoint as the coded waitlist section, but attribution is recorded as `source=homepage-newsletter-block` in Supabase.

Fields:
- **Heading** (required): main line (28–36px).
- **Subheading** (optional): 1–2 sentence supporting copy.
- **CTA label** (required): button text (e.g. `Join`, `Notify me`, `Get early access`). Default `Subscribe`.
- **Incentive** (optional): small all-caps kicker above the heading (e.g. `15% off first order` / `Free shipping guide`).
- **Disclaimer** (optional): small text below the form — good for GDPR / unsubscribe copy.

---

## <a id="cms-noop"></a>5. Block types that currently don't render

The schema accepts these block types so editors can draft future layouts, but they're **intentional no-ops** on the live homepage today — the data already renders elsewhere in the page:

| Block type | Where it already lives on the page |
|------------|----------------------------------|
| **Hero** | Coded `<CinematicHero />` (top of page, always present) |
| **Drop** | Coded "Current drop" / "Most loved" sections, driven by Medusa product data |
| **Testimonials strip** | `<TestimonialsWall />` — reads directly from the **Testimonials** collection below |
| **Press strip** | `<PressStrip />` — reads directly from the **Press mentions** collection at the top of the page |

If you add one of these block types to Homepage blocks, it won't show up on the live site. To add press mentions or testimonials, edit those **collections** directly, not homepage blocks.

---

## <a id="cms-i18n"></a>6. Localization — editing in 10 languages

Sericia serves 10 locales: `en`, `ja`, `ko`, `de`, `fr`, `es`, `it`, `zh-TW`, `ru`, `ar` (Arabic, RTL).

- The **locale switcher** is at the top-right of the admin UI.
- Switch locale → edit → save. Each locale is stored independently.
- Fields that are **not** localized (images, URLs, internal IDs) share a single value across all locales.
- If a field is empty in a given locale, Payload falls back to the default locale (`en`). So you can translate as you go — no need to fill every locale before publishing.

---

## <a id="cms-drafts"></a>7. Drafts vs publish

Homepage has **drafts** + **autosave** enabled:
- Autosave triggers every 2 seconds of inactivity.
- Drafts don't appear on the public homepage — only the `_status: published` version does.
- The last 50 versions are retained. Use **Versions** tab to roll back.

---

## <a id="cms-media"></a>8. Media uploads

All images, videos, and PDFs live in the **Media** collection. Uploads are stored in Supabase S3 and served via CDN.

Each Media entry has:
- **Alt text** (required): accessibility + SEO. 1 sentence describing what the image shows.
- **Caption** (optional): visible caption printed below the image in some contexts.
- **Credit** (optional): photographer / source credit.

When attaching media to a block, the picker lets you search existing uploads or upload a new file in place.

---

## <a id="cms-troubleshoot"></a>9. Troubleshooting

**"I published, but my block isn't showing on the live site."**
- Confirm the block is **Story** or **Newsletter** (§5 — other types don't render).
- Confirm you clicked **Publish changes**, not just **Save draft**.
- Payload's CDN cache for the homepage is ~60s — refresh after a minute.

**"My rich text body has Lexical errors."**
- Story body is required. Don't leave it empty — the block will fail to render.
- If pasting from Word / Google Docs, use the plain-text paste shortcut (`Cmd/Ctrl+Shift+V`) to strip hidden formatting that can break Lexical.

**"I don't see the locale switcher."**
- You need a user role that includes the locales you're editing. Ping engineering if you only see English.
