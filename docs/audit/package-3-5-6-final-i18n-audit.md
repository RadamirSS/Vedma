# Package 3.5.6 — Final i18n Audit

Date: 2026-07-01  
Branch: `cursor/package-3-5-6-final-header-cart-i18n-closeout`

## Summary

Full public + admin UI chrome audit after header/cart UX refactor. Page body content moved from `lib/mock-data.ts` into dictionaries where EN locale was leaking RU.

## Fixed strings

| Location | Issue | Fix |
|----------|-------|-----|
| `app/[locale]/about/page.tsx` | RU `aboutDirections` / `benefits` on EN | `dict.pages.about.directions`, `dict.home.benefits` |
| `app/[locale]/contacts/page.tsx` | Hardcoded Telegram/Email; RU schedule on EN | `dict.pages.contacts.*` labels + EN defaults |
| `lib/i18n/dictionaries/ru.ts` | `quickNavText` contained «прототип» | Rewritten customer-facing copy |
| `app/[locale]/legal/page.tsx` | RU legal blocks on EN | EN copy from `dict.pages.legal.*` |
| `lib/reviews.ts` | `"Отзыв клиента"` / `"Клиент"` fallbacks | `getPublishedReviews(locale)` + `dict.pages.reviews` |
| `app/[locale]/page.tsx` | Homepage reviews from mock-data | `getPublishedReviews(locale)` |
| `app/[locale]/account/*.tsx` | RU admin redirect error | `dict.account.messages.adminCustomerCabinetBlocked` |
| `components/catalog-card.tsx` | RU `includes("Под")` for stock class | `availabilityStatus === "ON_REQUEST"` |
| `components/admin/admin-locale-switcher.tsx` | Hardcoded `aria-label="Language"` | `dict.common.localeSwitcherLabel` |
| `components/legal-notice.tsx` | Dead RU-only component | Deleted |

## Header / cart UX (not i18n but same package)

| Change | Detail |
|--------|--------|
| Removed | `cart-btn` from `components/header.tsx` nav-actions |
| Added | `components/floating-cart-button.tsx` bottom-left FAB |
| Added | Cart entry in desktop `nav.menu` and mobile menu |
| CSS | `.floating-cart`, `.menu-cart`, mobile brand spacing |

## Allowed exceptions (documented)

| Item | Reason |
|------|--------|
| Brand sigil `Б` in header/footer | Intentional brand mark |
| DB catalog titles without EN `translations` | Service EN titles via `Service.translations` where imported; legacy items may show RU title in EN API resolve |
| DB review body text on EN | Owner content in DB; EN chrome + fallback labels only (no migration) |
| `lib/utils.ts` / `lib/catalog/normalize.ts` category maps | Internal RU normalization for VK/import categories |
| `lib/pricing/format-price.ts` `от` prefix | RU locale price formatting |
| Admin Cyrillic in `ru.ts` admin dictionary | Expected source strings |
| `settings.*` on RU locale | CMS-editable RU content |

## Forbidden phrases check

`Без запугивания`, `Тон сайта`, `прототип` — **not found** in app/components/lib after fixes.

## Admin panel

Chrome remains dictionary-driven (Package 3.5.2). This package adds `localeSwitcherLabel` to admin common dict.

## Verification

- `pnpm lint` — pass
- `pnpm build` — pass
- Grep Cyrillic in public TSX — only brand sigil + removed paths
