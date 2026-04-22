# Sericia product placeholder SVGs

Brand-consistent fallbacks shown on product cards until real photography lands.
All four follow the same visual grammar so a product grid without photos still
reads as one curated collection rather than four grey boxes.

## Visual grammar

- **Canvas**: 1200×1200 (square — matches PDP card aspect)
- **Background**: `#faf6ee` (sericia-paper-card token)
- **Silk-fibre strokes**: same motif used in `LuxuryLoader.tsx`, ties together
  the page-open animation and the product card visually
- **Double hairline frame**: `#21231d` at 60 / 70 inset — luxury "stamp" feel
- **Top wordmark**: `SERICIA` letter-spaced 0.5em, 300 weight
- **Central kanji**: single character per product at ~380pt, `#21231d`
  - 茶 sencha · 味 miso · 椎 shiitake · 集 drop / collection
  - Chosen over line-art glyphs because single-kanji branding is the dominant
    visual cue for Japanese premium food (compare Ippodo, Rikyu tea tins).
- **Romaji label**: product name in italic serif, centered below kanji
- **Hanko seal**: 鮮 red circle in top-right corner, matching `logo-mark.svg`
- **Bottom footer**: `RESCUED JAPANESE CRAFT FOOD` in letter-spaced caps

## Files

| File | Handle | Kanji | Product |
|------|--------|-------|---------|
| `sencha.svg` | `product-sencha` | 茶 | Uji sencha green tea |
| `miso.svg` | `product-miso` | 味 | White miso paste |
| `shiitake.svg` | `product-shiitake` | 椎 | Dried shiitake |
| `drop-001.svg` | `drop-001-tea-miso-shiitake` | 集 | Drop #1 bundle |

## Replacement workflow

When real brand photography arrives, edit `scripts/product-thumbnails.json`
to point each handle at the new URL and re-run
`npm run products:upload-thumbnails`. The SVGs stay on `/public` as fallback
for any product added in future that ships before photography.
