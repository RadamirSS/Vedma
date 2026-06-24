# Visual Fixes — Bazhena / Vedma

**Date:** 2026-06-24

## Spacing and rhythm

| Element | Before | After |
|---------|--------|-------|
| `.section` | 94px padding | Kept; added `.section--tight` (56px) for denser blocks |
| Section link rows | None | `.section-link-row` centered below featured grids |
| Lead CTA | N/A | 28px padding, flex layout with gap |

## Typography

| Element | Fix |
|---------|-----|
| Homepage `h1` | Single h1 in hero (unchanged) |
| Process steps | Added `.step-number` for visual hierarchy |
| Card titles | `.card-title` with 2-line clamp |
| Detail eyebrow | Russian labels instead of raw VK English categories |

## Cards and images

| Element | Fix |
|---------|-----|
| `.cards-grid` | `minmax(min(300px, 100%), 1fr)` prevents overflow |
| `.product-card` | `align-stretch`, flex column (existing, retained) |
| `.pic` | Fixed 190px height, `object-fit: cover` (existing) |
| Direction cards | 160px image area, hover lift + border glow |
| Hero | `.hero-card--image` with full-bleed photo + gradient overlay |
| Portrait | `.portrait--image` replaces monogram pseudo-elements |
| Gallery | 4-col grid, 4:5 aspect ratio, hover zoom |

## Buttons

| Element | Fix |
|---------|-----|
| `.btn` | Existing hover `translateY(-2px)` retained |
| Mobile `.hero-actions .btn` | Full-width stack below 720px (existing) |
| `.lead-cta .btn` | Full width on mobile |
| Service card CTA | «Записаться» wine/primary pattern consistent |

## Hover states

- Direction cards: transform, border-color, box-shadow
- Gallery images: scale 1.04
- Chips: background + border (existing)

## Section-specific

| Section | Change |
|---------|--------|
| Hero | Replaced moon/altar CSS collage with photo + floating note |
| Services | New directions grid replaces sparse catalog browser |
| Products | Category nav row with thumbnails |
| Homepage | Removed legal-grid section |

## Prototype copy removed

- `app/layout.tsx` title/description
- `components/footer.tsx` lead text
- `components/legal-notice.tsx`
- Process step placeholder paragraphs
- Product detail «Как это выглядит в прототипе»
- Service/product related section placeholder text
