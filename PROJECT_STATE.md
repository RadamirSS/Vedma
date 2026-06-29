# Project State

Date: 2026-06-29
Repository: `Vedma`
Current branch: `cursor/package-3-3-customer-journey-cleanup`
Main branch status: Package 3.3 customer journey cleanup ready for review; server deploy pending owner approval

## Instruction Sources

- Global repo-independent rules from `~/.codex/AGENTS.md`
- Package 3.3 customer journey and catalog cleanup task

## Current Snapshot

The repository now runs a merged public site, admin panel, and manual-commerce backbone on `main`:

- Packages 1, 1.1, 2, 2.1/2.2, 3, and 3.1 are merged into `main`.
- The public site is suitable for client-facing previews.
- Managers can configure catalog items through the admin panel.
- Payments remain manual placeholders.
- Package 3.2 server demo readiness is on `main`.
- Package 3.3 on review branch cleans up public customer journey, VK/admin artifacts, account dashboard, and checkout UX.

Untracked local files such as `.env`, `.tmp/`, screenshots, uploaded admin assets, and zip backups remain local-only and must not be committed.

## Runtime Architecture

### Public stack

- Next.js App Router pages
- Prisma-backed catalog repository for products and services
- cart resolution through `/api/cart/resolve`
- real checkout submission with account creation / login reuse
- customer account dashboard at `/account` with orders, profile, and help nav
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

Status: `MERGED` / demo readiness on `main`

### Package 3.3

Status: `IN_REVIEW` on `cursor/package-3-3-customer-journey-cleanup`

Implemented:

- removed public VK/import UI and orphan preview routes
- checkout cart resolve error and stale-cart messaging
- `/account` dashboard and improved order detail
- admin catalog form CMS cleanup (upload-first image, no source URL field)
- `metadataBase` → `NEXT_PUBLIC_SITE_URL` / `https://bajena.it`
- `.env` gitignore protection

See [docs/packages/package-3-3-customer-journey-cleanup.md](docs/packages/package-3-3-customer-journey-cleanup.md).

## DB And Fallback Behavior

- With the active local `.env`, `DATABASE_URL` points to PostgreSQL and `ALLOW_STATIC_CATALOG_FALLBACK="false"`.
- In normal verification mode, build must use the real DB and fail if PostgreSQL is unavailable.
- Static fallback is allowed only when explicitly enabled.
- Normal merged-branch verification uses the real DB and does not use static fallback.

## Current Validation Status

Verified on 2026-06-29 on `cursor/package-3-3-customer-journey-cleanup`:

- `pnpm lint`: passed
- `pnpm build`: passed (production DB via SSH tunnel; `staticGenerationMaxConcurrency: 1`)
- `pnpm db:verify:catalog`: passed
- public smoke: no `/admin` hrefs; no visible VK on contacts/product pages
- `/api/cart/resolve`: passed with published product slug
- server deploy: pending owner approval

## Remaining Limitations

- Payments remain manual placeholders; no online provider, webhook, or invoicing automation exists
- No real email sending yet; email is collected for future confirmations/receipts
- No Lava integration
- Customers cannot self-download private PDFs
- Customer account creation still happens through checkout, not through a separate signup funnel
- Server image upload on bajena.it needs post-deploy verification (symlink/permissions checklist in audit doc)

## Merge Readiness

Status: `REVIEW_BRANCH_READY`

Package 3.3 is on `cursor/package-3-3-customer-journey-cleanup` awaiting review and owner-approved server deploy.

## Recommended Next Package

### Package 4

Do not start until Package 3.3 is merged and server smoke verification is complete.
