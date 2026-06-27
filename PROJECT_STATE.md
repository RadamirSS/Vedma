# Project State

Date: 2026-06-27
Repository: `Vedma`
Current branch: `codex/package-2-admin-panel`
Main branch status: behind current branch by committed Package 2 / 2.1 stabilization work

## Instruction Sources

- Global repo-independent rules from `~/.codex/AGENTS.md`
- Current Package 2.2 stabilization task

## Current Snapshot

The repository currently contains two relevant Git states:

1. `main` reflects Package 1 and Package 1.1.
2. `codex/package-2-admin-panel` adds committed Package 2 and the Package 2.1 closeout changes being finalized in this stabilization pass.

Untracked local files such as `.env`, `.tmp/`, screenshots, and temporary uploads are not part of the branch closeout and should not be committed.

## Actual Architecture

### Public stack

- Next.js App Router pages
- Prisma-aware catalog repository for products/services
- settings loader backed by `SiteSetting`
- reviews loader backed by `Review`
- static fallback for catalog and reviews when DB data is unavailable
- client-side cart and checkout mock still backed by `lib/mock-data.ts`

### Admin stack

- protected `/admin` route tree
- Prisma-backed login/session flow
- server actions for mutations
- role-based access for `ADMIN` and `MANAGER`
- CRUD for products, services, reviews, settings, media, and users

### Database stack

- PostgreSQL via Prisma
- two migrations:
  - `20260625122538_package_1_init`
  - `20260627120000_package_2_admin_auth`

## Current Package Status

### Package 1

Status: `DONE`

- Prisma foundation, migration, import, verification, and repository-backed public catalog are implemented.
- This work is merged into `main`.

### Package 1.1

Status: `DONE`

- Real PostgreSQL smoke verification was completed and documented on 2026-06-25.

### Package 2

Status: `DONE`

- Real admin panel exists on the current branch.
- Implemented areas:
  - auth and sessions
  - dashboard
  - products
  - services
  - media
  - reviews
  - settings
  - users

### Package 2.1

Status: `DONE`

- The branch now includes the Package 2.1 closeout fixes:
  - larger media upload limits
  - larger server-action body limit
  - user-facing media action error redirects
  - admin-side user deletion
- Real DB-backed build and catalog verification now pass in the stabilized environment.
- The original exploratory monolithic smoke script remains a local artifact, but the critical Package 2.1 fixes have been verified individually and the branch is ready for merge.

## Current Runtime Status

### Database

Operational for implemented CMS flows.

Actively used models:

- `Product`
- `Service`
- `Media`
- `User`
- `Session`
- `Review`
- `SiteSetting`

Schema-only or dashboard-count-only models:

- `Order`
- `Request`
- `Payment`

### Admin

Status: real, functional, accepted for Package 2 scope

Implemented:

- `/admin/login`
- `/admin/dashboard`
- `/admin/products`
- `/admin/services`
- `/admin/media`
- `/admin/reviews`
- `/admin/settings`
- `/admin/users`

Missing:

- orders module
- requests module
- payments module
- customer management beyond admin users
- audit log

### Public Site

Production-near:

- `/products`
- `/products/[slug]`
- `/services`
- `/services/[slug]`
- `/contacts`
- `/legal`

Mixed live/static:

- `/`
- `/reviews`
- `/about`

Not production-ready:

- `/checkout`
- client cart flow

## Content Sources

- Products/services: Prisma first, fallback to `lib/catalog-data.ts`
- Reviews: Prisma first, fallback to `lib/mock-data.ts`
- Settings/SEO/footer/legal/contacts/home hero: `SiteSetting` with defaults in code
- Cart and checkout items: `lib/mock-data.ts`
- About-page support content: `lib/mock-data.ts`
- Media metadata: Prisma `Media`
- Media files: `public/uploads/vk/*` and `public/uploads/admin/*`

## Current Technical Debt

- Stale audit docs in `docs/audit/` still describe a pre-Package-2 repo.
- Checkout/cart are still mock and not repository-backed.
- `Order`, `Request`, and `Payment` are not wired into runtime flows.
- Static fallback still masks some DB failure paths.
- Preview routes still exist: `/admin-preview`, `/account-preview`.
- DB-backed production builds depend on the PostgreSQL instance referenced by `.env` being available.
- `eslint .` needed generated-path ignores so lint remains meaningful after a local build.

## Current Validation Status

Historically verified:

- Package 1 / 1.1 real PostgreSQL verification completed on 2026-06-25.
- Package 2 branch build/lint/generate passed at implementation time.

Current stabilized state:

- `pnpm lint` passes.
- `pnpm build` passes against the real local PostgreSQL instance referenced by `.env`.
- `pnpm db:verify:catalog` passes and regenerates a clean verification report.
- Fallback behavior is still available when `DATABASE_URL` is absent or fallback is explicitly allowed, but the active `.env` is intentionally configured for real DB verification with fallback disabled.

## Maturity Scores

- Architecture: `7/10`
- Code quality: `7/10`
- Maintainability: `6/10`
- Scalability: `6/10`
- Developer experience: `6/10`
- Security: `5/10`
- Admin readiness: `7/10`
- Commerce readiness: `3/10`
- Production readiness: `5/10`

## Recommended Next Package

### Package 3 — Commerce And Intake Backbone

Goal:

- replace mock checkout with real order/request capture and admin processing

Dependencies:

- merge the stabilized admin branch
- keep the local DB-backed verification path available for future acceptance checks

Acceptance criteria:

- checkout persists submissions
- admin can process them
- cart resolves against repository-backed items
- `Order` and/or `Request` models become operational

## Roadmap

### Package 3 — Commerce And Intake Backbone

- real checkout submission
- orders/requests admin
- repository-backed cart

### Package 4 — Payments And Operational Workflows

- payment tracking/integration
- fulfillment flows
- richer operational statuses

### Package 5 — Content Hardening And Fallback Reduction

- migrate remaining static content into managed storage
- reduce fallback dependence
- normalize category/content modeling

### Package 6 — Customer Area, Security, And Auditability

- customer auth and account area
- activity/audit logs
- stronger operational security

## Immediate Priorities

1. Merge `codex/package-2-admin-panel` into `main`.
2. Decide how checkout should map to `Order` versus `Request`.
3. Remove stale audit assumptions from future planning.
4. Start Package 3 only after the admin merge is complete.
