# Project State

Date: 2026-06-28
Repository: `Vedma`
Current branch: `codex/package-3-commerce-intake`
Main branch status: Package 3 / 3.1 branch is ready for merge after acceptance closeout; do not merge in this task

## Instruction Sources

- Global repo-independent rules from `~/.codex/AGENTS.md`
- Current Package 3.1 stabilization task

## Current Snapshot

The repository now has a real commerce backbone on the current branch:

- `main` already contains the merged Package 1, 1.1, 2, and 2.1/2.2 stabilization work.
- `codex/package-3-commerce-intake` adds customer checkout, customer accounts, private PDF intake, and the missing admin commerce modules.

Untracked local files such as `.env`, `.tmp/`, screenshots, uploaded admin assets, and zip backups remain local-only and must not be committed.

## Runtime Architecture

### Public stack

- Next.js App Router pages
- Prisma-aware catalog repository for products and services
- client cart resolved against repository-backed slugs through `/api/cart/resolve`
- real checkout submission with account creation / login reuse
- customer account area for orders and profile data
- static catalog fallback retained for no-DB builds when explicitly enabled

### Admin stack

- protected `/admin` route tree
- Prisma-backed login/session flow
- server actions for admin mutations
- role-based access for `ADMIN` and `MANAGER`
- CRUD for products, services, reviews, settings, media, and users
- new admin queues for orders, requests, payments, and customers
- manager/admin-only access to private customer PDFs

### Database stack

- PostgreSQL via Prisma
- migrations:
  - `20260625122538_package_1_init`
  - `20260627120000_package_2_admin_auth`
  - `20260628153000_package_3_commerce_intake`

## Package Status

### Package 1

Status: `DONE`

### Package 1.1

Status: `DONE`

### Package 2

Status: `DONE`

### Package 2.1 / 2.2

Status: `DONE`

- admin stabilization, smoke-test closeout, build verification, and merge-readiness work are complete

### Package 3

Status: `DONE_ON_BRANCH`

Implemented on `codex/package-3-commerce-intake`:

- repository-backed cart and add-to-cart CTAs for products and services
- real checkout flow creating `Order`, `OrderItem`, `Request`, `Payment`, `CustomerProfile`, `CustomerFile`, and `StatusHistory`
- customer account login, orders list, order detail, and profile management
- private PDF upload storage under `private/customer-files`
- admin orders, requests, payments, and customers modules
- manager/admin-only PDF access route at `/admin/files/[id]`

### Package 3.1

Status: `DONE_ON_BRANCH_READY_TO_MERGE`

Completed on `codex/package-3-commerce-intake`:

- admin and customer sessions are split into `vedma_admin_session` and `vedma_customer_session`
- admin login only accepts `ADMIN` / `MANAGER`; customer login only accepts `CUSTOMER`
- admin/customer login `next` redirects are sanitized:
  - admin accepts only `/admin/*` and falls back to `/admin/dashboard`
  - customer accepts only `/account/*`, `/checkout/*`, or `/cart/*` and falls back to `/account/orders`
- manager navigation hides `/admin/settings` and `/admin/users`, and direct access redirects back to `/admin/dashboard` with an encoded admin-only error
- product and service forms now accept direct JPG/PNG/WEBP main-image uploads and store them through the existing media pipeline
- public catalog detail pages no longer leak static fallback data when DB-backed records are archived or unpublished
- admin bulk hide/publish now revalidates affected product/service detail routes

## DB And Fallback Behavior

The intended behavior is now explicit:

- With the active local `.env`, `DATABASE_URL` points to PostgreSQL and `ALLOW_STATIC_CATALOG_FALLBACK="false"`.
- In that verification mode, build should use the real DB and fail if PostgreSQL is unreachable.
- When `ALLOW_STATIC_CATALOG_FALLBACK=true` is set explicitly, catalog pages may fall back to static data during build if Prisma cannot connect.
- This keeps real DB verification strict while still preserving a deliberate no-DB build path.
- The normal 2026-06-28 acceptance build used the real DB and did not use static fallback.

## Current Validation Status

Verified on 2026-06-28 during Package 3 / 3.1 closeout:

- `pnpm lint`: passed
- `pnpm build`: passed against the real local PostgreSQL instance with fallback disabled
- `pnpm db:verify:catalog`: passed when rerun outside the sandbox
- admin auth smoke matrix: passed for admin, manager, customer, and anonymous route separation
- live manager browser submit: verified for both product and service creation
- product upload proof:
  - product created from `/admin/products/new`
  - public image path saved as `/uploads/admin/2026/06/1782670875731-vedma-browser-smoke.png`
  - linked `Media` row `cmqy47n10000c8oqjc55go8wq` stored `productId=cmqy47n10000d8oqjawu4ojya`
- service upload proof:
  - service created from `/admin/services/new`
  - public image path saved as `/uploads/admin/2026/06/1782670876591-vedma-browser-smoke.png`
  - linked `Media` row `cmqy47nov000e8oqjeujzev6m` stored `serviceId=cmqy47nox000f8oqjzycsbarm`
- archived visibility proof:
  - after manager-side archive save, `/products/browser-smoke-product-pkg31-proof` returned `404`
  - after manager-side archive save, `/services/browser-smoke-service-pkg31-proof` returned `404`

Important environment note:

- sandboxed commands in this Codex environment may fail to reach `localhost:5432`, so DB-backed verification should be treated as valid only from unsandboxed/local-shell runs

## Remaining Limitations

- Payments remain manual status tracking only; no online provider, webhook, or invoicing automation exists
- Customer file access is intentionally restricted to managers/admins in the CMS and is not downloadable from the customer account
- Customer account creation currently happens through checkout, not through a separate signup funnel
- Preview routes still exist: `/admin-preview`, `/account-preview`
- Audit docs outside the updated source-of-truth files may still contain older Package 2 wording

## Merge Readiness

Status: `READY_TO_MERGE`

Critical technical and browser acceptance checks now pass on the current branch. This task does not merge to `main`, but no Package 3.1 blocker remains on the branch itself.

## Recommended Next Package

### Package 4 — Payments And Operational Workflow Hardening

Focus:

- payment-provider integration and webhook handling
- operational order workflow hardening beyond the current manual admin flow
- customer communications and fulfillment automation after merge

Do not start Package 4 in this task.
