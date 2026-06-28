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
- `pnpm build`: passed with real DB access
- `pnpm db:verify:catalog`: passed with real DB access
- `ALLOW_STATIC_CATALOG_FALLBACK=true pnpm build`: passed and confirmed explicit fallback behavior

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

Status: `READY_PENDING_COMMIT_AND_PUSH`

## Recommended Next Package

Package 4 — Payments And Operational Workflow Hardening
