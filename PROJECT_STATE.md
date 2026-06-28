# Project State

Date: 2026-06-29
Repository: `Vedma`
Current branch: `main`
Main branch status: Package 3 and 3.1 are merged; current focus is Package 3.2 server demo readiness

## Instruction Sources

- Global repo-independent rules from `~/.codex/AGENTS.md`
- Current Package 3.2 server demo readiness task

## Current Snapshot

The repository now runs a merged public site, admin panel, and manual-commerce backbone on `main`:

- Packages 1, 1.1, 2, 2.1/2.2, 3, and 3.1 are merged into `main`.
- The public site is suitable for client-facing previews.
- Managers can configure catalog items through the admin panel.
- Payments remain manual placeholders.
- Package 3.2 is the next implementation step before any Package 4 work begins.

Untracked local files such as `.env`, `.tmp/`, screenshots, uploaded admin assets, and zip backups remain local-only and must not be committed.

## Runtime Architecture

### Public stack

- Next.js App Router pages
- Prisma-backed catalog repository for products and services
- cart resolution through `/api/cart/resolve`
- real checkout submission with account creation / login reuse
- customer account area for orders and profile data
- static catalog fallback retained only for explicitly enabled no-DB scenarios

### Admin stack

- protected `/admin` route tree
- Prisma-backed login/session flow
- admin roles:
  - `ADMIN`: full access, including private customer PDFs
  - `MANAGER`: operational catalog/commerce access without settings, users, or private customer PDFs
  - `DEMO`: read-only portfolio/demo access to the admin panel
- server actions for admin mutations
- CRUD for products, services, reviews, settings, media, and users
- admin queues for orders, requests, payments, and customers
- private customer PDF files are available only to `ADMIN` through `/admin/files/[id]`

### Database stack

- PostgreSQL via Prisma
- migrations:
  - `20260625122538_package_1_init`
  - `20260627120000_package_2_admin_auth`
  - `20260628153000_package_3_commerce_intake`

## Package Status

### Package 1

Status: `MERGED`

### Package 1.1

Status: `MERGED`

### Package 2

Status: `MERGED`

### Package 2.1 / 2.2

Status: `MERGED`

### Package 3

Status: `MERGED`

Implemented on `main`:

- repository-backed cart and add-to-cart CTAs for products and services
- real checkout flow creating `Order`, `OrderItem`, `Request`, `Payment`, `CustomerProfile`, `CustomerFile`, and `StatusHistory`
- customer account login, orders list, order detail, and profile management
- private PDF upload storage under `private/customer-files`
- admin orders, requests, payments, and customers modules
- private customer PDF files are available only to `ADMIN` through `/admin/files/[id]`

### Package 3.1

Status: `MERGED`

Implemented on `main`:

- split admin and customer sessions: `vedma_admin_session` and `vedma_customer_session`
- sanitized admin/customer login redirects
- manager restrictions for `/admin/settings` and `/admin/users`
- direct JPG/PNG/WEBP main-image upload for product/service forms
- catalog detail fallback leak fix for archived/unpublished DB records
- public detail revalidation for product/service publish-hide flows

### Package 3.2

Status: `IN_PROGRESS`

Current goal:

- prepare `main` for server demo readiness
- add a read-only demo admin account flow
- keep manual payment mode explicit and understandable
- document deployment and operational checklist for a server demo

## DB And Fallback Behavior

- With the active local `.env`, `DATABASE_URL` points to PostgreSQL and `ALLOW_STATIC_CATALOG_FALLBACK="false"`.
- In normal verification mode, build must use the real DB and fail if PostgreSQL is unavailable.
- Static fallback is allowed only when explicitly enabled.
- Normal merged-branch verification uses the real DB and does not use static fallback.

## Current Validation Status

Verified on 2026-06-29 on `main`:

- `pnpm lint`: passed
- `pnpm build`: passed with real DB access and fallback disabled
- `pnpm db:verify:catalog`: passed
- public manual-payment copy is present in checkout and customer account flows
- private customer PDF access remains `ADMIN`-only

## Remaining Limitations

- Payments remain manual placeholders; no online provider, webhook, or invoicing automation exists
- Customers cannot self-download private PDFs
- Customer account creation still happens through checkout, not through a separate signup funnel
- Preview routes still exist: `/admin-preview`, `/account-preview`
- Server deployment/demo readiness still needs completion under Package 3.2

## Merge Readiness

Status: `MAIN_ACTIVE`

Package 3 and 3.1 are already merged. Current work should stay on `main` until Package 3.2 deployment/demo readiness is complete.

## Recommended Next Package

### Package 3.2 — Server Demo Readiness And Read-Only Admin Demo

Focus:

- deployable demo/pre-production server setup
- read-only demo admin access
- explicit manual-payment messaging
- operational deployment checklist and smoke verification

Do not start Package 4 until Package 3.2 is complete.
