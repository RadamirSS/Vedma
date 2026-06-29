# Package 3.3 — Customer Journey And Catalog Cleanup

Date: 2026-06-29  
Branch: merged to `main`  
Domain: https://bajena.it  
Audit: [package-3-3-customer-journey-audit.md](../audit/package-3-3-customer-journey-audit.md)

**Status: `MERGED` / `DEPLOYED`**

| Milestone | Detail |
|---|---|
| Feature branch | `cursor/package-3-3-customer-journey-cleanup` @ `a3992251602fedee89937c13e301292657f3ad8e` |
| Merge commit | `61beb7aa663d041df24d23b4b5aae17616e51cb2` |
| Production deploy | `main` @ `61beb7aa663d041df24d23b4b5aae17616e51cb2` on bajena.it |

## What Was Broken

- Public product/service pages showed “Источник: VK” buttons.
- Checkout contact methods included VK; contacts page listed VK.
- Checkout submit button disabled silently when cart resolve failed or localStorage had stale slugs.
- `/account` redirected to orders with no dashboard; header linked to `/account/orders`.
- Orphan preview routes `/admin-preview` and `/account-preview` were publicly reachable.
- Header had extra nav items beyond customer spec (legal link, standalone Telegram).
- Admin catalog form exposed “Исходный URL” and raw `/uploads/vk/...` paths as primary image UX.
- `metadataBase` hardcoded `https://bazhena.ru`.
- `.env` was not listed in `.gitignore`.

## What Was Fixed

### Public cleanup

- Removed VK source buttons from product/service detail pages.
- Removed VK from checkout contact dropdown, contacts page, mock-data, and reviews placeholder.
- Deleted `/admin-preview` and `/account-preview` pages.
- Aligned header nav: Услуги, Товары, Обо мне, Отзывы, Контакты, Кабинет, Корзина / Оформить.
- Removed customer-facing “админ-панель” mention from legal page.

### Checkout / cart

- `cart-context` now exposes `resolveError` and `cartUnavailable` states.
- Checkout, cart page, and cart drawer show visible reasons when submit is disabled.
- Stale cart message: “Товары из корзины больше недоступны...”
- `/api/cart/resolve` returns 500 JSON on server errors.
- Email helper copy added at checkout and profile.

### Customer account

- New `/account` dashboard with order summary, payment note, and catalog CTAs.
- Account nav: Обзор, Заказы, Профиль, Помощь / связь.
- Order detail shows comment, delivery, manual payment note, PDF list.
- Login default redirect → `/account`.

### Admin CMS

- Removed source URL field from catalog entity form.
- Upload-first image flow with preview and friendly media library labels.
- Neutral copy on admin media page.

### Metadata / env

- `metadataBase` uses `NEXT_PUBLIC_SITE_URL` with `https://bajena.it` fallback.
- `.env` added to `.gitignore`; `NEXT_PUBLIC_SITE_URL` added to `.env.example`.
- `staticGenerationMaxConcurrency: 1` in `next.config.mjs` for stable DB-backed SSG builds.

## Local Test Results

| Check | Result |
|---|---|
| `pnpm lint` | Passed |
| `pnpm build` | Passed (via SSH tunnel to production Postgres) |
| `pnpm db:verify:catalog` | Passed (0 errors) |
| Homepage: no `/admin` hrefs | Passed |
| Contacts/product: no visible VK UI | Passed |
| `/api/cart/resolve` with real product slug | Passed (`braslet-iz-lunnogo-kamnya-ocharovanie`) |
| `/account` unauthenticated | Redirects to `/account/login` (307) |
| Full browser checkout E2E | **Passed** |

### Local checkout E2E proof

| Field | Value |
|---|---|
| Customer email | `test+pkg33-1782759534687@bajena.it` |
| Order number | `ORD-20260629-042AGC` |
| Order ID | `cmqzl07lo0004ca1s3msei3wr` |
| Account URL | `/account/orders/cmqzl07lo0004ca1s3msei3wr` |
| Admin URL | `/admin/orders/cmqzl07lo0004ca1s3msei3wr` |

Smoke-test data: orders retained; marked by `test+pkg33-*@bajena.it` email pattern.

## Server Test Results

Status: **Deployed on `main`**

### Live public smoke (bajena.it)

| Check | Result |
|---|---|
| Homepage loads | Passed |
| No public admin button/link | Passed |
| Product detail: no “Источник: VK” | Passed |
| Service detail: no “Источник: VK” | Passed |
| Contacts: no VK row | Passed |
| Checkout dropdown: no VK option | Passed |
| `/account` → login for anonymous | Passed (307) |
| `/admin/login` opens | Passed |

### Live checkout E2E proof

| Field | Value |
|---|---|
| Customer email | `test+pkg33-live-1782759692016@bajena.it` |
| Order number | `ORD-20260629-UKELYU` |
| Order ID | `cmqzl3flz0004l7b8fgv5rwqy` |
| Account URL | `https://bajena.it/account/orders/cmqzl3flz0004l7b8fgv5rwqy` |
| Admin URL | `https://bajena.it/admin/orders/cmqzl3flz0004l7b8fgv5rwqy` |

### Live manager image upload proof

Symlink: `/srv/projects/vedma/current/public/uploads/admin` → `/srv/projects/vedma/shared/uploads-admin`

| Entity | Image path | Public URL (at test time) |
|---|---|---|
| Product | `/uploads/admin/2026/06/1782759724908-pkg33-test.png` | `https://bajena.it/products/pkg33-upload-product-1782759721600` (catalog row removed post-verify) |
| Service | `/uploads/admin/2026/06/1782759771746-pkg33-test.png` | `https://bajena.it/services/pkg33-upload-service-1782759768353` (catalog row removed post-verify) |

On-disk files (persist after `systemctl restart vedma`):

- `/srv/projects/vedma/shared/uploads-admin/2026/06/1782759724908-pkg33-test.png`
- `/srv/projects/vedma/shared/uploads-admin/2026/06/1782759771746-pkg33-test.png`

Media rows were created during upload; catalog rows for `pkg33-upload-*` were deleted after acceptance to restore catalog counts (71 products, 2 services).

## Remaining Limitations

- Online payment still manual; no Lava or card provider.
- No real email sending or receipt delivery yet (email stored for future use).
- Smoke-test orders from acceptance E2E remain in production DB.
- Production `.env` uses server-local `DATABASE_URL`; local build requires SSH tunnel or server-side build.
- `pnpm db:verify:catalog` may warn locally about server-only admin upload paths for legacy service images.

## Production Deploy Commands

```bash
cd /srv/projects/vedma/current
git fetch origin
git checkout main
git pull origin main
pnpm install --frozen-lockfile
pnpm db:generate
pnpm exec prisma migrate deploy
pnpm db:verify:catalog
pnpm build
systemctl restart vedma
systemctl status vedma --no-pager
```
