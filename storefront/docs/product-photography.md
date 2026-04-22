# Product Photography — Tracking & Brief

> Owner: Sericia brand / founder
> Last updated: 2026-04-22
> Status: 🟡 Placeholders live. Real photography not yet commissioned.

#### 📋 目次

| #  | セクション |
|----|-----------|
| 1  | [現状（Current state）](#pp-current) |
| 2  | [必要なカット一覧（Shot list）](#pp-shots) |
| 3  | [技術仕様（Technical specs）](#pp-specs) |
| 4  | [ブランドガイダンス（Aesthetic brief）](#pp-brand) |
| 5  | [撮影者RFP要件（Photographer RFP）](#pp-rfp) |
| 6  | [受け渡しワークフロー（Handoff workflow）](#pp-handoff) |
| 7  | [進捗チェックリスト（Status per product）](#pp-status) |
| 8  | [予算・タイムライン（Budget & timeline）](#pp-budget) |

---

## <a id="pp-current"></a>1. 現状（Current state）

- **4 SVG placeholders** live at `storefront/public/placeholders/*.svg` and referenced by Medusa `product.thumbnail` via `scripts/product-thumbnails.json`.
- Aesthetic: Kanji mark over gradient, matches LuxuryLoader. Deliberately non-photographic so nobody mistakes them for final product shots.
- Rendered on: `/products` grid, PDP, `/cart`, `/checkout`, `/account/wishlist`, OG image fallback.
- Upload script: `npm run products:upload-thumbnails` (idempotent, admin API).
- **Drop #1 blocker risk**: Placeholders are ok for teaser / waitlist phase but WILL hurt CVR on paid traffic. Target: real shots live before first paid ad.

---

## <a id="pp-shots"></a>2. 必要なカット一覧（Shot list）

### Per-product required (P0 — gates paid traffic)

| Product handle              | Kanji | Required shots                                                                                                   | Notes                                                         |
|-----------------------------|-------|------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------|
| `product-sencha`            | 茶     | (1) Can/tin on paper seamless · (2) Loose leaves overhead · (3) Brewed in kyusu, steam visible · (4) Life-scene — cup in hand, morning light | Uji. Leaves are deep green, avoid yellowing under tungsten.   |
| `product-miso`              | 味     | (1) Jar on wood · (2) Miso being spooned (texture) · (3) Miso soup in bowl · (4) Life-scene — kitchen counter    | Shiro miso, pale cream — overexposing washes it out.          |
| `product-shiitake`          | 椎     | (1) Dried mushrooms on linen · (2) Close-up gill detail · (3) Rehydrated in water (amber broth) · (4) Life-scene — dashi pot | Donko. Size matters — shoot with a 1-yen coin for scale optional. |
| `drop-001-tea-miso-shiitake` | 集    | (1) Full bundle flat-lay · (2) Bundle with hand wrapping paper · (3) Bundle + thank-you card · (4) Shipping box opening moment | The bundle is the hero. Give it 6+ exposures, 1 gets used everywhere. |

### Nice-to-have (P1 — post-launch content library)

- Behind-the-scenes at each maker (Yamane-en tea field, Kurashige Jozoten miso cellar, Yamagata forest floor).
- Seasonal: same product in spring / autumn lighting.
- Unboxing sequence (4-6 frames) — used as email GIF + Instagram story.
- Flavor-pairing flat-lays (sencha + wagashi, miso + grilled fish).

---

## <a id="pp-specs"></a>3. 技術仕様（Technical specs）

| Attribute       | Required                                               |
|-----------------|--------------------------------------------------------|
| Resolution      | 2400 × 3000 minimum (4:5 portrait) / 2400 × 2400 square / 2400 × 1350 for hero |
| Format          | Master: 16-bit TIFF sRGB. Delivery: JPEG q=85 + WebP   |
| Color space     | sRGB (not Adobe RGB — browsers mis-render)             |
| File size       | Web delivery <250KB per image after next/image pipeline |
| Naming          | `{handle}-{variant}-{n}.jpg` (e.g. `product-sencha-hero-01.jpg`) |
| Metadata        | Keep EXIF shot date + camera info (audit trail), strip GPS + author (privacy) |
| Background      | `#f5f0e8` paper OR natural wood / linen. Never pure white. |
| Aspect ratios needed | 4:5 (PDP cards), 16:9 (hero banners), 1:1 (OG + email) |

Each shot needs delivery in all three ratios. If only one master is shot, crop before handoff — not in code.

---

## <a id="pp-brand"></a>4. ブランドガイダンス（Aesthetic brief）

**Positioning**: Aesop × Muji × Kyoto tea house. Restraint, not rustic cottagecore.

| Do                                                      | Don't                                               |
|---------------------------------------------------------|-----------------------------------------------------|
| Natural window light, east or north-facing              | Tungsten interior, ring lights, HDR processing      |
| Single subject with 70%+ negative space                 | Busy props, food-styling clichés (rosemary sprigs)  |
| Muted greens, cream, ink, warm shadows                  | Neon accents, pure black (#000), pure white (#fff)  |
| Human hand in ~30% of frames — scale + warmth           | Full faces (we're selling the product, not a model) |
| Patina, imperfection, the maker's hand visible          | Over-sharpened, airbrushed, "commercial" polish     |
| Shadow-lit texture (miso surface, leaf veins)           | Flat ring-light catalog flatness                    |

**Reference boards**: Aesop product pages / Postalco / Blue Bottle Japan / 中川政七商店 / Kinfolk food editorials.

**Don't-do shots**: Overhead flat-lay with 7 props (Pinterest cliché). Hands with perfectly manicured nails. Anything that looks like Squarespace stock.

---

## <a id="pp-rfp"></a>5. 撮影者RFP要件（Photographer RFP）

### Candidate profile

- Based in or able to travel to Kansai / Kyoto (maker visits require in-person).
- Prior commerce work for D2C brands with Aesop-adjacent aesthetic.
- Comfortable shooting both product (controlled) and documentary (maker environment).
- Delivers retouched masters within 14 days of shoot.
- Rate band: ¥180,000 – ¥400,000 per half-day + expenses. (Japan market, mid-tier pro.)

### Scope for Drop #1

- 1 maker-visit day × 3 makers = 3 days shooting (or consolidate to 2 if logistics allow).
- 1 studio day for bundle + product individual shots.
- Retouching + 3 crops per master.
- Usage: perpetual, worldwide, all channels (web, email, SMS, paid social, print).
- Deliverables: 40+ retouched masters + crops, on Dropbox or WeTransfer Pro.

### Candidate outreach list (TODO — founder)

- [ ] Search Shotdeck / Production Paradise JP tags: `food`, `ceramics`, `D2C`, `Japan-craft`.
- [ ] Ask Yamane-en / Kurashige / Yamagata-mori makers if they have a local photographer relationship.
- [ ] Post in Kyoto Creatives / Tokyo Creatives Slack.
- [ ] Fallback: post on Yoake / ISETAN MITSUKOSHI "Made in Japan" marketing channels.
- [ ] Target 3 candidates → portfolio review → 1 test shoot (paid) → commit.

---

## <a id="pp-handoff"></a>6. 受け渡しワークフロー（Handoff workflow）

Once masters arrive:

1. **Approve** — founder + designer review on Dropbox. Flag any reshoots.
2. **Compress for web** — run through `scripts/optimize-product-images.ts` (to be written; wraps `sharp` for WebP + progressive JPEG).
3. **Upload to Supabase Storage** — public bucket `product-photos/`, path `{handle}/{filename}`. Do NOT commit masters to git.
4. **Update `scripts/product-thumbnails.json`** — swap `sericia.com/placeholders/*.svg` URLs for the real Supabase CDN URLs.
5. **Run `npm run products:upload-thumbnails`** — pushes new URLs to Medusa admin API. Idempotent — only changed mappings write.
6. **Verify** — load `/products`, PDP for each handle, check OG preview via opengraph.xyz.
7. **Update Payload Articles** — `meet-yamane-en`, `meet-kurashige-jozoten`, `meet-yamagata-mori` should get real maker photos in `heroImage`. Use the Payload admin UI.
8. **Sunset placeholders** — keep SVGs in `/public/placeholders/` for 2 weeks as CDN-cached fallback, then delete.
9. **Archive masters** — move all TIFFs + PSDs to long-term storage (Google Drive / Dropbox cold tier). Not on the web server.

---

## <a id="pp-status"></a>7. 進捗チェックリスト（Status per product）

| Product                      | Placeholder live | Maker contacted | Shoot scheduled | Masters delivered | Uploaded to Medusa | Payload article hero |
|------------------------------|:----------------:|:---------------:|:---------------:|:-----------------:|:------------------:|:--------------------:|
| `product-sencha`             | ✅               | ⏳              | ⏳              | ❌                | ❌                 | ❌                   |
| `product-miso`               | ✅               | ⏳              | ⏳              | ❌                | ❌                 | ❌                   |
| `product-shiitake`           | ✅               | ⏳              | ⏳              | ❌                | ❌                 | ❌                   |
| `drop-001-tea-miso-shiitake` | ✅               | n/a             | ⏳              | ❌                | ❌                 | n/a                  |

Legend: ✅ done · 🟡 partial · ⏳ in progress · ❌ not started · n/a not applicable

---

## <a id="pp-budget"></a>8. 予算・タイムライン（Budget & timeline）

### Budget envelope (Drop #1)

| Line item                               | Estimate (JPY)     |
|-----------------------------------------|--------------------|
| Photographer (3 days shoot + retouch)   | ¥600,000 – ¥1,000,000 |
| Travel (Kansai × 3 makers)              | ¥80,000 – ¥150,000 |
| Prop / styling (linen, wood boards, ceramic) | ¥40,000 – ¥80,000 |
| Buffer (reshoots, rush)                  | ¥100,000           |
| **Total**                               | **¥820,000 – ¥1,330,000** |

Scope to smallest viable if budget tight: 1 studio day (bundle + cropped individuals, no maker visits). ¥200–300k. Maker docs deferred to Drop #2.

### Timeline (if starting today)

| Week | Milestone                                                   |
|------|-------------------------------------------------------------|
| W0   | Photographer shortlist (3) · makers confirm shoot windows   |
| W1   | Portfolio review · test shoot (paid) · commit to 1 photog   |
| W2   | Maker visit #1 (Yamane-en / sencha)                         |
| W3   | Maker visit #2 (Kurashige Jozoten / miso)                   |
| W4   | Maker visit #3 (Yamagata-mori / shiitake) + studio day       |
| W5   | Retouch + delivery                                           |
| W6   | Upload + integrate + Payload article heroes                  |
| W7   | Paid traffic starts (placeholder-free)                       |

**Critical path**: Maker availability. Kurashige is a 4-generation family miso house — bookings need 3+ weeks lead.

### Decision gate

> Do not spend the first dollar of paid ads until every product row has ✅ in "Uploaded to Medusa". Placeholders on paid traffic = wasted acquisition spend.
