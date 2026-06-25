# Package 1 Preflight Audit

- Static catalog source of truth: `lib/catalog-data.ts`
- Current product count: 71
- Current service count: 2
- Current product image folders under `public/uploads/vk/products`: 132
- Current service image folders under `public/uploads/vk/services`: 6

## Current Catalog Fields

- Shared fields: `id`, `slug`, `type`, `title`, `category`, `subtitle`, `description`, `price`, `badge`, `icon`, `accent`, `details`, `image`, `sourceUrl`
- Product-only optional field in current source: `availability`

## Static Routes Currently Using Catalog Data

- `app/page.tsx` renders featured products and services from `lib/mock-data.ts`
- `app/products/page.tsx` renders the full product catalog from `lib/mock-data.ts`
- `app/products/[slug]/page.tsx` uses static params and product lookup from `lib/mock-data.ts`
- `app/services/page.tsx` renders the service catalog from `lib/mock-data.ts`
- `app/services/[slug]/page.tsx` uses static params and service lookup from `lib/mock-data.ts`

## Risks Before Migration

- The public catalog currently depends on in-repo static arrays, so switching to DB access can break build-time rendering if the repository layer does not fall back safely.
- The catalog uses 71 product records and 2 service records, but the uploads tree contains more image folders than public items. This suggests preserved legacy or duplicate asset variants that must not be deleted during migration.
- Public components expect presentation fields such as `icon`, `accent`, `details`, and `availability`; the DB layer must either preserve or reconstruct those values so the visual design remains unchanged.
- Client-side cart helpers still resolve items from static data by `id`, so DB-backed page payloads must preserve source item identifiers to avoid cart mismatches during this package.
