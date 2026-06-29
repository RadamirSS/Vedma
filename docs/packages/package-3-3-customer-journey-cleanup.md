# Package 3.3 — Customer Journey And Catalog Cleanup

Date: 2026-06-29  
Branch: `cursor/package-3-3-customer-journey-cleanup`  
Domain: https://bajena.it  
Audit: [package-3-3-customer-journey-audit.md](../audit/package-3-3-customer-journey-audit.md)

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
| Production `.env` pulled | Yes (via SCP) |
| `pnpm lint` | Passed |
| `pnpm build` | Passed (via SSH tunnel to production Postgres) |
| `pnpm db:verify:catalog` | Passed |
| Homepage: no `/admin` hrefs | Passed |
| Contacts/product: no visible VK UI | Passed |
| `/api/cart/resolve` with real product slug | Passed (`braslet-iz-lunnogo-kamnya-ocharovanie`) |
| `/account` unauthenticated | Redirects to `/account/login` (307) |
| Full browser checkout E2E | Not automated in CI script; cart resolve + build + types verified |

## Server Test Results

Status: **Pending owner approval** (push-only deploy workflow).

Server image upload checklist documented in audit:

- Symlink `current/public/uploads/admin` → `shared/uploads-admin`
- Correct owner/group for `vedma` service user
- Post-deploy manager upload smoke on bajena.it

## Remaining Limitations

- Online payment still manual; no Lava or card provider.
- No real email sending or receipt delivery yet (email stored for future use).
- Server deploy and live upload verification deferred until branch merge/approval.
- Production `.env` uses server-local `DATABASE_URL`; local build requires SSH tunnel or server-side build.

## Deploy Commands (when approved)

```bash
cd /srv/projects/vedma/current
git fetch origin
git checkout cursor/package-3-3-customer-journey-cleanup
git pull origin cursor/package-3-3-customer-journey-cleanup
pnpm install --frozen-lockfile
pnpm db:generate
pnpm exec prisma migrate deploy
pnpm db:verify:catalog
pnpm build
systemctl restart vedma
systemctl status vedma --no-pager
```
