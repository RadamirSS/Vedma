# Mobile Audit — Bazhena / Vedma

**Date:** 2026-06-24  
**Breakpoints tested:** 320, 375, 390, 430, 768, 1024

## Test matrix

| Breakpoint | `/` | `/services` | `/products` | `/about` | Notes |
|------------|-----|-------------|-------------|----------|-------|
| 320 | Pass | Pass | Pass | Pass | Single-column grids, stacked CTAs |
| 375 | Pass | Pass | Pass | Pass | Same as 320 |
| 390 | Pass | Pass | Pass | Pass | Same as 320 |
| 430 | Pass | Pass | Pass | Pass | Hero floating note hidden |
| 768 | Pass | Pass | Pass | Pass | 2-col grids where applicable |
| 1024 | Pass | Pass | Pass | Pass | Catalog sidebar stacks at 1080px |

Screenshots: `docs/audit/screenshots/after/`

## Issues found and fixed

### Overflow

| Issue | Fix |
|-------|-----|
| Grid min-width on narrow screens | `minmax(min(300px, 100%), 1fr)` on `.cards-grid` |
| Catalog results overflow | `.catalog-results { min-width: 0 }` |
| Long category chip rows | `.chip-row { overflow-x: auto }` |

### Broken grids

| Issue | Fix |
|-------|-----|
| Directions on narrow screens | `grid-template-columns: 1fr` below 430px |
| Category nav cramped | 2-column grid below 430px |
| Visual gallery | 2 columns on mobile, 1–2 at 430px |

### Cropped text

| Issue | Fix |
|-------|-----|
| Long product titles | `.card-title` 2-line clamp |
| Badge overflow | Existing ellipsis retained |

### Oversized buttons

| Issue | Fix |
|-------|-----|
| Hero 3 buttons | Stack full-width below 720px (existing) |
| CTA block buttons | `.cta-actions` full width below 720px |
| Lead CTA button | Full width below 768px |

### Hero mobile

| Issue | Fix |
|-------|-----|
| Decorative floating note overlaps | Hidden below 430px |
| Container padding | 16px below 430px |
| h1 size | `clamp(44px, 12vw, 58px)` below 430px |

### Catalog mobile

| Issue | Fix |
|-------|-----|
| Filters sidebar | Stacks above grid at 1080px (existing) |
| Sticky filters | `position: relative` when stacked (existing) |

## Section padding mobile

- `.section`: 72px vertical below 768px
- `.section--tight`: 48px vertical below 768px

## Not tested in browser automation

Manual verification recommended for:
- Cart drawer on 320px
- Mobile menu overlay
- Telegram external links

## Before screenshots

Before-state screenshots were not captured prior to code changes in this session. After screenshots document the recovered state at all six breakpoints.
