# Package 1 Summary

## What Changed

- Added PostgreSQL and Prisma foundation for CMS-backed catalog storage.
- Added deterministic catalog import and verification scripts using the existing static VK catalog as the migration source.
- Added a repository layer that prefers Prisma data and falls back to the preserved static catalog when the database is unavailable during local development or build safety scenarios.
- Switched public home, product, and service pages to read through the repository layer instead of importing static arrays directly.

## How Migration Works

- `lib/catalog-data.ts` remains the migration source of truth during Package 1.
- `pnpm db:import:catalog` upserts products and services by slug and creates linked media rows for referenced images.
- `pnpm db:verify:catalog` validates counts, slugs, image paths, and category normalization after import.

## Rerun Commands

- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm db:seed`
- `pnpm db:import:catalog`
- `pnpm db:verify:catalog`

## Known Limitations

- This package does not add the admin CRUD panel yet.
- The local workspace currently needs a reachable PostgreSQL database to execute import and verification against Prisma models.
- Client-side cart helpers still rely on static in-browser item resolution, so Package 1 preserves source IDs in DB-backed catalog payloads for compatibility.

## Database Smoke Test Result

- Verified against a real local PostgreSQL instance on `localhost:5432`
- Prisma migration applied successfully and created `prisma/migrations/20260625122538_package_1_init/migration.sql`
- Catalog import succeeded with `71` products, `2` services, and `73` media rows
- Catalog verification passed with `0` errors and `0` warnings
- Production build passed with `DATABASE_URL` set and without static fallback
- Repo-wide lint still has two pre-existing unrelated VK script failures; Package 1 / 1.1 files are lint-clean

## Next Package

- Production Admin Panel
