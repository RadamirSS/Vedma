# Content Audit — Bazhena / Vedma

**Date:** 2026-06-24  
**Scope:** VK import catalog, homepage, services, products, images

## Summary

| Metric | Count |
|--------|------:|
| Services (catalog) | 2 |
| Products (catalog) | 71 |
| Total catalog items | 73 |
| VK cover images | 73 |
| Service directions (UI) | 8 |

## Services (catalog)

| ID | Slug | Title | Price |
|----|------|-------|------:|
| vk-s-2 | diagnostika-negativa | Диагностика негатива | 3 500 ₽ |
| vk-s-6 | transformatsionnaya-igra-denezhnyy-magnit | Трансформационная игра «Денежный магнит» | 9 555 ₽ |

## Products — raw VK categories (pre-recovery)

| VK category (stored) | Count | Was shown as |
|--------------------|------:|--------------|
| Магия Жизни Souvenirs and gifts | 23 | Сувениры |
| Магия Жизни Tablecloths | 14 | Скатерти |
| Магия Жизни Action figures and fan merch | 14 | Мерч |
| Магия Жизни Bracelets | 10 | Браслеты |
| Магия Жизни Hair accessories | 4 | Аксессуары |
| Магия Жизни Purses | 2 | Сумки |
| Магия Жизни Earrings | 2 | Серьги |
| Магия Жизни Watches | 1 | Часы |
| Магия Жизни Carpets, rugs and runners | 1 | Ковры |

## Products — semantic categories (post-recovery)

Mapped via `lib/product-categories.ts` from title/slug keywords:

- Браслеты
- Камни
- Алтарные товары
- Декор
- Свечи
- Обереги
- Подарки
- Прочее

This fixes VK miscategorization (e.g. altar stands under «Action figures and fan merch»).

## Orphaned / inconsistent data

### Mock content not tied to catalog

| Source | Issue |
|--------|-------|
| `reviews` (before) | Referenced «Расклад на отношения», «Диагностика состояния», «Свеча на защиту» — not in catalog |
| `requestCards` | 6 situation cards but only 2 catalog services |
| `aboutDirections` | 8 practice areas vs 2 VK services |
| Homepage copy | Mentioned Таро, свечи, консультации broadly — aspirational vs catalog |

**Fixed:** Reviews aligned to service directions; services page now shows 8 direction cards.

### Data quality (unchanged in source)

- Duplicate generic titles (коробок для спичек ×5, алтарные подставки ×N)
- Truncated VK descriptions in some items
- `vk-p-24`, `vk-p-34` flagged in `needs_review.csv` but published
- Missing product IDs `vk-p-2`, `vk-p-6` (export gaps, not runtime orphans)

## Images

| Location | Before recovery | After recovery |
|----------|-----------------|----------------|
| `public/uploads/vk/` | 73 cover.jpg | 73 (unchanged) |
| Referenced in code | 73/73 | 73/73 |
| Unused on disk | 0 | 0 |
| Homepage hero | CSS placeholder | VK service image |
| About portrait | CSS monogram «Б» | VK service image |
| Visual gallery | None | 8 curated imports |
| Service directions | N/A | 8 curated images |

## UX problems (identified)

1. Services page showed only 2 cards — felt empty vs 71 products
2. Site read as shop-first, not personal-brand-first
3. Hero and portrait were generic CSS blocks
4. Format filter chips on catalog were non-functional
5. Services used «В корзину» CTA
6. Process steps had prototype placeholder text
7. Legal section on homepage added template scroll fatigue
8. English VK category strings visible in badges/metadata on detail pages

## Conversion problems (identified)

1. No entry points for Таро, отношения, защита, консультации (not in VK catalog)
2. Situation cards linked only to `/services` or `/products` without deep links
3. Weak CTA hierarchy — store competed with services
4. No lead path for unlisted service types

## Recovery actions taken

- 8 service direction cards with Telegram lead or real service links
- Homepage reordered: hero → directions → services → products → benefits → process → reviews → CTA
- Semantic Russian product categories and category nav
- VK images in hero, gallery, directions, about portrait
- SEO metadata per page; prototype language removed
- Reviews and process copy aligned to real offerings
