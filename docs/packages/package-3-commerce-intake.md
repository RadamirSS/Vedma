# Package 3 — Commerce And Intake Backbone

Date: 2026-06-29
Branch: `main`
Status: `MERGED`

## Scope Delivered

- real cart backed by repository-resolved product/service slugs
- checkout that creates customer account/session, order, request, payment record, profile, and status history
- private PDF upload flow with PDF-only and `10 MB` validation
- customer account routes for login, orders, order detail, and profile editing
- admin modules for orders, requests, payments, and customers
- private customer PDF access restricted to `ADMIN` at `/admin/files/[id]`
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
- `pnpm build`: passed with real DB access and fallback disabled during normal verification
- `pnpm db:verify:catalog`: passed with real DB access
- fallback used during normal build: `no`

## Package 3.1 Stabilization

Status: `MERGED`

### Auth / Session Separation

- admin and customer sessions use separate cookies: `vedma_admin_session` and `vedma_customer_session`
- admin helpers were split into explicit admin/customer session APIs in `lib/auth/session.ts`
- `/admin/login` accepts only internal admin roles
- `/account/login` accepts only `CUSTOMER`
- admin/customer login redirects are sanitized for their own route areas

### Admin Redirect QA

- admin smoke matrix passed across dashboard, catalog, media, reviews, orders, requests, payments, customers, settings, and users
- manager smoke matrix passed for operational pages
- manager navigation hides settings/users links
- direct manager access to `/admin/settings` and `/admin/users` redirects inside admin flow
- customer access to `/admin/*` redirects to `/admin/login`
- anonymous `/admin/*` access redirects to `/admin/login`

### Inline Product / Service Image Upload

- `CatalogEntityForm` exposes `mainImageUpload` for both product and service forms
- uploaded JPG/PNG/WEBP files reuse `storeUploadedFile`, create a `Media` record, and override the selected existing media path when both are supplied
- product/service save actions revalidate public catalog pages plus `/admin/media`
- live browser submit for manager product/service creation was verified against the production build and real PostgreSQL during Package 3.1 acceptance

### Catalog Fallback Leak Fix

- `lib/catalog/repository.ts` no longer falls back to static items inside `getProductBySlug` or `getServiceBySlug` after DB-backed published queries
- published catalog reads were updated so admin revalidation sees the latest publication state
- admin bulk product/service publish-hide actions revalidate affected detail routes
- archived public detail routes were verified to return `404`

## Package 3.2 Follow-Up

Status: `IN_PROGRESS`

Current follow-up scope on `main`:

- server demo readiness and deployment checklist
- read-only `DEMO` admin role
- explicit manual-payment placeholder messaging
- smoke verification for admin, manager, demo, and customer flows

## DB / Fallback Policy

- default verification mode is DB-first with fallback disabled through `.env`
- fallback is allowed only when explicitly enabled
- this prevents no-DB builds from silently masking real DB verification failures

## Known Limitations

- payment state is manual only
- customers cannot self-download private PDFs
- no separate customer signup flow outside checkout
- no webhook/provider integrations

## Next Package Gate

Package 4 starts only after Package 3.2 deployment/demo readiness is complete.
