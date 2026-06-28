# Server Demo Deployment Checklist

Date: 2026-06-29
Target branch: `main`

## Required Environment Variables

- `DATABASE_URL`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `DEMO_ADMIN_EMAIL`
- `DEMO_ADMIN_PASSWORD`
- optional: `DEMO_ADMIN_NAME`
- optional: `ALLOW_STATIC_CATALOG_FALLBACK=false`

## Platform Requirements

- PostgreSQL is required for the normal demo/pre-production build and runtime.
- SSL and a real domain should be configured before any client-facing demo.
- Backups should cover both PostgreSQL and uploaded files.

## Persistent Storage Requirements

These directories must survive deploys and restarts:

- `public/uploads/admin`
- `private/customer-files`

## Prisma / Database Steps

- `pnpm db:generate`
- apply schema migrations on the target server:
  - preferred production command: `pnpm exec prisma migrate deploy`
- verify seeded catalog state:
  - `pnpm db:verify:catalog`

## Seed Commands

- seed main admin:
  - `pnpm db:seed`
- seed read-only demo admin:
  - `DEMO_ADMIN_EMAIL="demo@example.com" DEMO_ADMIN_PASSWORD="replace-with-strong-password" pnpm db:seed:demo`

## Install / Build / Run Checklist

- `pnpm install`
- `pnpm db:generate`
- `pnpm exec prisma migrate deploy`
- `pnpm db:verify:catalog`
- `pnpm build`
- `pnpm start`

## Demo Readiness Notes

- Payments are manual placeholders only.
- Checkout creates the order immediately.
- The administrator confirms the order and sends payment details manually.
- Payment/order status updates are then visible in the customer account.
- Private customer PDFs are available only to `ADMIN` through `/admin/files/[id]`.
- The `DEMO` admin role is read-only and is intended for portfolio/client walkthroughs.
