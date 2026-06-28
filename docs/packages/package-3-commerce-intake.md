# Package 3 — Commerce And Intake Backbone

Date: 2026-06-28
Branch: `codex/package-3-commerce-intake`
Status: `DONE_ON_BRANCH_READY_TO_MERGE`

## Scope Delivered

- real cart backed by repository-resolved product/service slugs
- checkout that creates customer account/session, order, request, payment record, profile, and status history
- private PDF upload flow with PDF-only and `10 MB` validation
- customer account routes for login, orders, order detail, and profile editing
- admin modules for orders, requests, payments, and customers
- manager/admin-only route for private customer PDF access
- offline migration SQL for the Package 3 schema expansion

## Routes Added

- `/cart`
- `/checkout`
- `/account/login`
- `/account/orders`
- `/account/orders/[id]`
- `/account/profile`
- `/admin/orders`
- `/admin/orders/[id]`
- `/admin/requests`
- `/admin/requests/[id]`
- `/admin/payments`
- `/admin/customers`
- `/admin/customers/[id]`
- `/admin/files/[id]`

## Verification Snapshot

- `pnpm lint`: passed
- `pnpm build`: passed with real DB access and fallback disabled during the normal acceptance build
- `pnpm db:verify:catalog`: passed with real DB access
- fallback used during normal build: `no`

## Package 3.1 Pre-Production Stabilization

Status: `DONE_ON_BRANCH_READY_TO_MERGE`

### Auth / Session Separation

- admin and customer sessions now use separate cookies: `vedma_admin_session` and `vedma_customer_session`
- admin helpers were split into explicit admin/customer session APIs in `lib/auth/session.ts`
- `/admin/login` now only reuses admin sessions; `/account/login` now only reuses customer sessions
- admin and manager users hitting `/account/login` are redirected safely back to `/admin/dashboard` with a Russian notice

### Admin Redirect QA

- admin smoke matrix passed across dashboard, catalog, media, reviews, orders, requests, payments, customers, settings, and users
- manager smoke matrix passed for operational pages
- manager navigation hides settings/users links
- direct manager access to `/admin/settings` and `/admin/users` now redirects inside admin flow instead of leaking to `/account/login`
- customer access to `/admin/*` redirects to `/admin/login`
- anonymous `/admin/*` access redirects to `/admin/login`
- browser-side redirect sanitization confirmed:
  - `/admin/login?next=https://evil.example/boom` ended at `/admin/dashboard`
  - `/account/login?next=/admin/dashboard` ended at `/account/orders`

### Inline Product / Service Image Upload

- `CatalogEntityForm` now exposes `mainImageUpload` for both product and service forms
- uploaded JPG/PNG/WEBP files reuse `storeUploadedFile`, create a `Media` record, and override the selected existing media path when both are supplied
- product/service save actions revalidate public catalog pages plus `/admin/media`
- full live browser submit was verified on 2026-06-28 against the production build and real PostgreSQL:
  - product created from `/admin/products/new`
  - product saved `image=/uploads/admin/2026/06/1782670875731-vedma-browser-smoke.png`
  - linked `Media` row `cmqy47n10000c8oqjc55go8wq` saved `productId=cmqy47n10000d8oqjawu4ojya`
  - public `/products/[slug]` rendered the uploaded product image before archive
  - service created from `/admin/services/new`
  - service saved `image=/uploads/admin/2026/06/1782670876591-vedma-browser-smoke.png`
  - linked `Media` row `cmqy47nov000e8oqjeujzev6m` saved `serviceId=cmqy47nox000f8oqjzycsbarm`
  - public `/services/[slug]` rendered the uploaded service image before archive

### Catalog Fallback Leak Fix

- `lib/catalog/repository.ts` no longer falls back to static items inside `getProductBySlug` or `getServiceBySlug` after DB-backed published queries
- repository-level `react` caching was removed from the published catalog loaders so admin revalidation sees the latest publication state
- admin bulk product/service publish-hide actions now revalidate the affected detail routes
- archived visibility acceptance passed on the production server:
  - `/products/browser-smoke-product-pkg31-proof` returned `404`
  - `/services/browser-smoke-service-pkg31-proof` returned `404`

### Verification Commands

- `pnpm lint`: passed
- `pnpm build`: passed
- `pnpm db:verify:catalog`: passed

### Remaining Known Limitations

- payment state is manual only
- customers cannot self-download private PDFs
- no separate customer signup flow outside checkout
- no webhook/provider integrations

## DB / Fallback Policy

- default verification mode is DB-first with fallback disabled through `.env`
- fallback is allowed only when explicitly enabled
- this prevents no-DB builds from silently masking real DB verification failures

## Known Limitations

- payment state is manual only
- customers cannot self-download private PDFs
- no separate customer signup flow outside checkout
- no webhook/provider integrations

## Merge Readiness

Status: `READY_TO_MERGE`

## Recommended Next Package

Package 4 — Payments And Operational Workflow Hardening
