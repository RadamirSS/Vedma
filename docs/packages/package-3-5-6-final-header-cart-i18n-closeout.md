# Package 3.5.6 — Header/Cart UX + Full i18n Closeout

Date: 2026-07-01  
Branch: `cursor/package-3-5-6-final-header-cart-i18n-closeout` → `main`  
Deployed: https://bajena.it

## Commits

| Item | Hash |
|------|------|
| Fix commit | `ed077df` |
| Merge commit | `163b5c129aa7016eaec8fb3bef04fc9b95521e37` |
| Previous server commit | `8ed298578f3ae31e8f49baf29534c38fd7806d2e` |

## Header / cart UX

- Removed cart button from top `nav-actions` (header no longer shows Корзина/Cart button)
- Added `FloatingCartButton` — bottom-left FAB with item count badge
- Telegram FAB preserved bottom-right (`.floating-social`)
- Cart added to desktop `nav.menu` and mobile dropdown menu
- Header now: brand, locale, account, menu (burger on tablet/mobile)
- Mobile CSS polish: brand truncation, tighter nav-actions at 390px, FAB spacing

## i18n closeout

- About page: `dict.pages.about.directions` + `dict.home.benefits` (no RU mock-data on EN)
- Contacts: localized labels; EN default schedule/format from dict
- Legal: EN copy from `dict.pages.legal.*`; RU from site settings
- Reviews: `getPublishedReviews(locale)` with EN/RU fallback samples in dict
- Account admin redirect errors localized
- Removed dead `legal-notice.tsx`
- Audit: `docs/audit/package-3-5-6-final-i18n-audit.md`

## Verification (live)

| Check | Result |
|-------|--------|
| `pnpm lint` / `pnpm build` | Pass (local + server) |
| `pnpm db:verify:catalog` | Pass on server |
| HTTP `/en`, `/ru`, services, contacts, reviews, admin/login | 200 |
| Header: no `cart-btn` | Confirmed |
| `floating-cart` + `floating-social` | Present |
| Menu cart (`menu-cart`, `mobile-menu__cart`) | Present |
| EN `/en/about` directions | English only (visible) |
| EN `/en/contacts` | No «прототип» |
| EN `/en/legal` | Privacy policy EN |
| EN `/en/reviews` | EN fallback samples |
| Admin login EN/RU cookie switch | Works via `bajena_admin_locale` |
| Other sites | astrology-panel.it 200, onix-ai.it 200, solanalisting 405 |

## Remaining limitations

- DB review body text may remain RU on EN if stored in production DB (documented exception)
- Full interactive browser admin panel walk-through recommended before client handoff
- Payments / email / Lava not connected

## Status

**READY_FOR_EXTERNAL_REVIEW**
