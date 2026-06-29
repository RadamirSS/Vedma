# Package 3.3 — Customer Journey Audit

Date: 2026-06-29  
Branch: `cursor/package-3-3-customer-journey-cleanup`  
Domain: https://bajena.it

## Public admin entry points

- No `/admin`, `/admin/login`, or `/admin/dashboard` links found in public header, footer, or homepage components.
- Orphan prototype routes existed at `/admin-preview` and `/account-preview` (reachable by direct URL, not linked in nav). Removed in Package 3.3.
- Customer-facing legal page mentioned "админ-панель" in copy — reworded.
- Header had extra items beyond spec (`18+ и правила` in main nav, standalone Telegram in actions). Aligned to required customer links.

## VK / import artifacts

| Location | Finding |
|---|---|
| `app/products/[slug]/page.tsx` | "Источник: VK" button when `sourceUrl` set |
| `app/services/[slug]/page.tsx` | Same |
| `components/checkout-view.tsx` | VK in contact-method dropdown |
| `app/contacts/page.tsx` | VK row from site settings |
| `lib/mock-data.ts` | VK in fallback contacts |
| `app/reviews/page.tsx` | Placeholder text mentioned VK |
| `components/admin/catalog-entity-form.tsx` | "Исходный URL" field in manager workflow |
| `app/admin/(panel)/media/page.tsx` | Intro copy referenced VK imports |

DB columns `sourceUrl`, `sourcePlatform`, `sourceId` retained; UI cleanup only.

## Checkout button failure

Root cause: client-side cart resolution via `/api/cart/resolve` could fail or return empty items without surfacing an error. `CheckoutView` disabled submit when `resolvedItems.length === 0` with no explanation.

Contributing factors:
- `cart-context.tsx` silently returned on failed fetch.
- Stale localStorage slugs (unpublished or removed catalog items) produced empty resolved list while raw cart entries remained.
- Server-side checkout validation in `lib/commerce/checkout.ts` was already correct.

## Customer account state (before fix)

- `/account` redirected straight to `/account/orders` — no dashboard.
- Header "Кабинет" linked to `/account/orders`.
- Account nav: only Заказы and Профиль.
- Order detail lacked delivery data, customer comment, and manual payment note blocks.

## Image upload state

### Local

- Upload path: `public/uploads/admin/YYYY/MM/` via `lib/admin/media.ts` → `storeUploadedFile`.
- Product/service save uses `mainImageUpload` → `storeCatalogMainImage` in `app/admin/actions.ts` (creates `Media` row).
- Code path appears sound when `public/uploads/admin` is writable.

### Server (documented checklist — verify on deploy approval)

Inspect on `root@76.13.50.31`:

- `/srv/projects/vedma/shared/uploads-admin` exists and is persistent
- Symlink: `/srv/projects/vedma/current/public/uploads/admin` → `shared/uploads-admin`
- Owner/group matches systemd `User=` for `vedma` service
- `systemctl status vedma` and `journalctl -u vedma -n 200` for upload errors
- Test: manager uploads product image → file on disk + `Media` row + public page shows image

Server deploy deferred until owner approval (push-only workflow).

## Metadata

- `app/layout.tsx` had `metadataBase: https://bazhena.ru` — corrected to `NEXT_PUBLIC_SITE_URL` with `https://bajena.it` fallback.

## Env

- Production `.env` pulled to local `./.env` for testing (not committed).
- `.env` added to `.gitignore`.
