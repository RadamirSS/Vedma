# Project State

Date: 2026-06-28
Repository: `Vedma`
Current branch: `codex/package-3-commerce-intake`
Main branch status: ready to receive Package 3 once the current branch commit is pushed

## Instruction Sources

- Global repo-independent rules from `~/.codex/AGENTS.md`
- Current Package 3 execution task

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

## DB And Fallback Behavior

The intended behavior is now explicit:

- With the active local `.env`, `DATABASE_URL` points to PostgreSQL and `ALLOW_STATIC_CATALOG_FALLBACK="false"`.
- In that verification mode, build should use the real DB and fail if PostgreSQL is unreachable.
- When `ALLOW_STATIC_CATALOG_FALLBACK=true` is set explicitly, catalog pages may fall back to static data during build if Prisma cannot connect.
- This keeps real DB verification strict while still preserving a deliberate no-DB build path.

## Current Validation Status

Verified on 2026-06-28 during Package 3 closeout:

- `pnpm db:generate`: passed
- `pnpm lint`: passed
- `pnpm build`: passed against the real local PostgreSQL instance when run outside the sandbox
- `ALLOW_STATIC_CATALOG_FALLBACK=true pnpm build`: passed and logged explicit fallback usage
- `pnpm db:verify:catalog`: passed when rerun outside the sandbox

Important environment note:

- sandboxed commands in this Codex environment may fail to reach `localhost:5432`, so DB-backed verification should be treated as valid only from unsandboxed/local-shell runs

## Remaining Limitations

- Payments remain manual status tracking only; no online provider, webhook, or invoicing automation exists
- Customer file access is intentionally restricted to managers/admins in the CMS and is not downloadable from the customer account
- Customer account creation currently happens through checkout, not through a separate signup funnel
- Preview routes still exist: `/admin-preview`, `/account-preview`
- Audit docs outside the updated source-of-truth files may still contain older Package 2 wording

## Merge Readiness

Status: `READY_PENDING_COMMIT_AND_PUSH`

Critical checks now pass on the current branch. The branch is ready to be committed and pushed, then merged into `main`.

## Recommended Next Package

### Package 4 — Payments And Operational Workflow Hardening

Focus:

- operator workflow polish around manual billing and fulfillment
- richer order/request lifecycle tooling
- internal auditability and handoff visibility

Still out of scope for the next package unless explicitly reprioritized:

- online payments
- checkout redesign
- Lava
- customer-cabinet redesign
