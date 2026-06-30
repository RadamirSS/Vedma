# Package 3.5 — Mobile UX & i18n Pre-Audit

Date: 2026-06-30  
Branch: `cursor/package-3-5-mobile-i18n-polish`

## Public routes (pre-migration)

| Route | File |
|-------|------|
| `/` | `app/page.tsx` |
| `/about` | `app/about/page.tsx` |
| `/cart` | `app/cart/page.tsx` |
| `/checkout` | `app/checkout/page.tsx` |
| `/contacts` | `app/contacts/page.tsx` |
| `/legal` | `app/legal/page.tsx` |
| `/products`, `/products/[slug]` | `app/products/` |
| `/reviews` | `app/reviews/page.tsx` |
| `/services`, `/services/[slug]` | `app/services/` |
| `/account/*` | `app/account/` (login, register, profile, orders) |

Admin (`/admin/**`), API (`/api/**`), and `/admin/files/[id]` remain at root.

## Middleware (before)

- Matcher: `/uploads/admin/:path*` only
- Rewrites `/uploads/admin/*` → `/api/admin-uploads/*` with `..` guard
- No locale detection

## Text cleanup targets

| File | Issue |
|------|-------|
| `app/page.tsx:56` | "Без запугивания… Тон сайта…" in benefits section |
| `lib/service-directions.ts:23` | "Точная диагностика через символы и интуицию." |

Legitimate "точно" in review quotes (`lib/mock-data.ts`) — keep.

## Mobile header root cause

`app/globals.css` @720px:

```css
.nav-actions .btn:not(.cart-btn):not(.burger) { display: none; }
```

Hides account ("Кабинет") button. Mobile menu also lacks account link.

## Checkout CSS classes

`.checkout-grid`, `.form-card`, `.cart-summary`, `.checkout-account-section`, `.checkout-mode-option`, `.checkout-note`, `.field`, `.check`, `.summary-line`, `.text-link`

Issue: `.form-card` uses light ivory gradient; checkbox rows lack overflow guards on narrow viewports.

## i18n gap

- `<html lang="ru">` hardcoded in `app/layout.tsx`
- ~30+ components/pages with inline Russian strings
- No `[locale]` segment, no dictionaries, no switcher

## Risk areas

| Area | File | Risk |
|------|------|------|
| Cart detail links | `lib/commerce/cart.ts:109` | `/products/slug` without locale |
| Redirect helpers | `lib/auth/safe-redirect.ts` | Only `/account`, `/checkout`, `/cart` prefixes |
| Server actions | `app/account/actions.ts`, `app/checkout/actions.ts` | Hardcoded redirect paths |
| Site shell | `components/site-shell.tsx` | Header/footer not locale-aware |
| Typed routes | `next.config` `typedRoutes: true` | Links need locale prefix |

## Target architecture

- `app/[locale]/` for all public/customer pages
- `lib/i18n/` typed dictionaries (en, ru)
- Middleware: upload rewrite first, then locale detection/redirect
- Cookie `bajena_locale` for manual override
- Admin/API/uploads unchanged
