# Package 3.4 — Production Ordering, Media Slots And Browser Polish

Date: 2026-06-29  
Branch: `cursor/package-3-4-production-ordering-polish`  
Domain: https://bajena.it  
Status: `IN_REVIEW`

## Summary

Package 3.4 polishes bajena.it for production-like use: separates test/real admin commerce data, adds site media slots, customer registration, product/service checkout split, DaData address autocomplete (server-side), PDF removal from checkout, and responsive CSS improvements.

## Migration

- `20260629120000_package_3_4_test_order_flags`
  - `Order.isTest`, `Order.testLabel`
  - `Request.isTest`, `Request.testLabel`
  - `Payment.isTest`
  - Delivery address fields on `Order`: `deliveryRegion`, `deliveryStreet`, `deliveryHouse`, `deliveryFlat`, `deliveryAddressFull`, `deliveryAddressProvider`, `deliveryAddressMeta`, `preferredContactAt`
  - Backfills Package 3.3 smoke orders as test

## Test / demo order filtering

| Role | Default view | Tabs |
|------|--------------|------|
| ADMIN | Production (`isTest=false`) | Рабочие / Тестовые / Все |
| MANAGER | Production only | — |
| DEMO | Test only | — |

Helper: `lib/admin/commerce-filters.ts`  
Maintenance script: `pnpm db:mark-test-orders`

## Site media slots

Admin: `/admin/media/site`  
Settings key: `site_settings.mediaSlots`

Slots:

- Logo in header
- Hero portrait on homepage
- 8 homepage gallery images
- 8 homepage direction card images
- Optional footer brand image
- About page portrait

Public components read from `getSiteSettings().mediaSlots` with fallbacks in `lib/site-media.ts`.

## Customer registration

- `/account/register` with name, email, password (min 8), phone, telegram, legal checkbox
- Link from `/account/login`
- Checkout still auto-creates accounts; logged-in customers skip password at checkout

## Checkout modes

| Cart | Delivery | Phone | PDF | Comments |
|------|----------|-------|-----|----------|
| Products | Required + autocomplete | Required | Removed | Product delivery comment |
| Services | Hidden | Phone or Telegram | Removed | Service request + preferred time |
| Mixed | Required | Required | Removed | Both comment blocks |

## Address autocomplete

- `POST /api/address/suggest` (server-only DaData)
- Env: `DADATA_API_KEY`, optional `DADATA_SECRET_KEY`, `ADDRESS_SUGGEST_PROVIDER=dadata`
- Graceful manual fallback when key missing

## Browser / responsive polish

Updated `app/globals.css` and `app/admin/admin.css` for:

- Mobile checkout and cart drawer
- Account layout at ≤768px
- Admin table horizontal scroll
- Site media admin previews

## Local verification (2026-06-29)

| Check | Result |
|-------|--------|
| `pnpm lint` | Passed |
| `pnpm build` | Passed |
| `pnpm db:verify:catalog` | Passed |
| `pnpm db:mark-test-orders` | 2 test orders in DB |

## Limitations

- Manual payments only; no Lava, no online card provider
- No email sending
- Server deploy pending owner approval
- Homepage direction/product images still use VK fallbacks until manager replaces slots in admin

## Deploy (when approved)

```bash
cd /srv/projects/vedma/current
git fetch origin
git checkout cursor/package-3-4-production-ordering-polish
git pull origin cursor/package-3-4-production-ordering-polish
pnpm install --frozen-lockfile
pnpm db:generate
pnpm exec prisma migrate deploy
pnpm db:verify:catalog
pnpm db:mark-test-orders
pnpm build
systemctl restart vedma
```
