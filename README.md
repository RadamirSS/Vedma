# Vedma CMS Foundation

## Environment

Create a local `.env` from `.env.example` and set:

- `DATABASE_URL`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- optional safety flags: `ALLOW_IMPORT_COUNT_MISMATCH`, `ALLOW_VERIFY_COUNT_MISMATCH`, `ALLOW_STATIC_CATALOG_FALLBACK`

## Database Setup

1. Install dependencies with `pnpm install`.
2. Generate the Prisma client with `pnpm db:generate`.
3. Create or update the local PostgreSQL schema with `pnpm db:migrate`.
4. Seed the placeholder admin user with `pnpm db:seed`.

## Catalog Migration

- Import the preserved static catalog into PostgreSQL with `pnpm db:import:catalog`
- Verify imported records with `pnpm db:verify:catalog`

The migration source of truth for Package 1 stays in `lib/catalog-data.ts`. Do not delete that file until a later package explicitly retires the fallback path.

## Public Site Behavior

- Public routes `/products`, `/products/[slug]`, `/services`, and `/services/[slug]` read through the catalog repository.
- The repository prefers Prisma data.
- When the database is unavailable during local development or build safety review, it can fall back to the preserved static catalog.

## Reports

- Preflight audit: `docs/migration/package-1-preflight-audit.md`
- Import report: `docs/migration/package-1-import-report.md`
- Verification report: `docs/migration/package-1-verification-report.md`
- Package summary: `docs/migration/package-1-summary.md`

## Rollback

1. Keep `lib/catalog-data.ts` and `public/uploads/vk/*` intact.
2. Revert application changes if needed without deleting the static catalog source.
3. Reset or recreate the PostgreSQL schema separately if a migration/import needs to be rerun from scratch.
