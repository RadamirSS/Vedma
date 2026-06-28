# Package 3 — Commerce And Intake Backbone

Date: 2026-06-28
Branch: `codex/package-3-commerce-intake`
Status: `DONE_ON_BRANCH`

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

- `pnpm db:generate`: passed
- `pnpm lint`: passed
- `pnpm build`: passed with real DB access after caching published catalog reads during prerender
- `pnpm db:verify:catalog`: passed with real DB access
- `ALLOW_STATIC_CATALOG_FALLBACK=true pnpm build`: passed and confirmed explicit fallback behavior

## Package 3.1 Pre-Production Stabilization

Status: `DONE_WITH_REVIEW_BLOCKER`

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

### Inline Product / Service Image Upload

- `CatalogEntityForm` now exposes `mainImageUpload` for both product and service forms
- uploaded JPG/PNG/WEBP files reuse `storeUploadedFile`, create a `Media` record, and override the selected existing media path when both are supplied
- product/service save actions revalidate public catalog pages plus `/admin/media`
- live form rendering was verified on the running app for both product and service create screens
- full live submit replay from Codex remained blocked by localhost server-action POST approval timing out twice, so merge should wait for one final browser-side acceptance pass

### Verification Commands

- `pnpm lint`: passed
- `pnpm build`: passed
- `pnpm db:verify:catalog`: passed

### Remaining Known Limitations

- final browser-side manager upload submit proof is still pending outside the Codex sandbox approval bottleneck
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

Status: `PUSHABLE_NOT_MERGE_READY`

## Recommended Next Package

Package 4 — Payments And Operational Workflow Hardening
