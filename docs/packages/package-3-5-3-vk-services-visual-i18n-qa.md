# Package 3.5.3 — VK Ready Services + Visual/i18n QA

Date: 2026-07-01  
Branch: `main` (merged from `cursor/package-3-5-3-vk-services-visual-i18n-qa`)  
Base: `main`  
**Merged and deployed to https://bajena.it (Package 3.5.4, 2026-07-01).**

## Deployment (Package 3.5.4)

| Item | Value |
|------|-------|
| Merge commit | `12e807a2c42fac60bb425ae01110d61237193fd6` |
| Previous server commit | `7110266e1f5c4f5679aad1dd28cc127c3e8b1e9d` |
| Deployed commit | `12e807a2c42fac60bb425ae01110d61237193fd6` |
| Migration | `20260630120000_package_3_5_3_service_translations` applied |
| Import apply | 25 upserted (24 create + 1 update on first run) |
| Idempotent re-run | 0 create, 25 update |
| `pnpm db:verify:catalog` | pass on server |
| Production status | **READY_FOR_EXTERNAL_REVIEW** |

## Merged inputs

1. `cursor/package-3-5-2-admin-i18n` (commit `517a33f`) — admin EN/RU dictionaries, locale switcher
2. `cursor/vk-services-detail-completion` (commit `97a0730`) — 25 import candidates, 30 not-ready, screenshots

## VK import approach

- Script: `scripts/vk-services/import_ready_services.ts`
- Commands: `pnpm vk:services:import:dry-run`, `pnpm vk:services:import:apply`
- Source: `data/vk-services/normalized/services.import-candidates.json`
- Only `readyForImport: true` (25 services)
- Upsert by slug; `sourceId` stored for idempotency
- Duplicate merge: `vk-service-052` → existing `diagnostika-negativa`
- 30 not-ready services remain in `services.not-ready.json` — not published

### Publication rules

- Most Priority A / regular services → `PUBLISHED`
- Seasonal: Walpurgis (`vk-service-029`), Samhain (`vk-service-040`) → `DRAFT`

### Images

- VK 50×50-style avatar URLs **not** used
- Prefer: existing upload → screenshot copy on apply → category placeholder
- Report: `data/vk-services/reports/import-ready-services-report.md`

## EN translations

- Prisma `Service.translations` JSON field (migration `20260630120000_package_3_5_3_service_translations`)
- Structure: `{ ru: { title, shortDescription, description }, en: { ... } }`
- Overlay file: `data/vk-services/normalized/services.import-translations.en.json`
- Display: `lib/catalog/service-localization.ts` + `getPublishedServices(locale)`

## Visual / text fixes

- EN footer copyright localized
- EN headings: life areas, client stories, learn more
- Process steps: fixed duplicate numbering
- Homepage: 8 featured service cards
- Service category labels localized on EN cards

## Verification

| Check | Result |
|-------|--------|
| `pnpm lint` | Pass (pre-merge local) |
| `pnpm build` | Pass (local + server) |
| `pnpm vk:services:import:dry-run` | 25 planned (24 create, 1 update) pre-apply |
| `pnpm vk:services:import:apply` | Applied on bajena.it 2026-07-01 |
| `pnpm db:verify:catalog` | Pass on production DB |
| Live HTTP `/en`, `/ru`, `/admin/login` | 200 |
| Live services catalog | 24 published cards on `/en/services` |
| DaData `/api/address/suggest` | suggestions OK |
| `/uploads/admin/...` | 200 (known PNG) |
| Full checkout E2E | Manual browser recommended (CLI blocked by Next cookies scope) |
| ADMIN/MANAGER/DEMO permissions | Manual smoke recommended |

## Remaining limitations

- Payments / Lava / email not connected
- 30 VK services need owner clarification (`services.not-ready.json`)
- Some service images are screenshots/placeholders — replace in admin media
- Walpurgis + Samhain imported as **DRAFT** (seasonal)
- Tier pricing on «Как пробить денежный потолок» needs owner confirmation

## Docs

- Audit: `docs/audit/package-3-5-3-full-i18n-visual-audit.md`
- Import report: `data/vk-services/reports/import-ready-services-report.md`
