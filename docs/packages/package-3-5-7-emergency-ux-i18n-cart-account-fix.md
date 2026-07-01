# Package 3.5.7 — Emergency UX/i18n/Cart/Account Bugfix

Date: 2026-07-01  
Branch: `cursor/package-3-5-7-emergency-ux-i18n-cart-account-fix` → `main`  
Deployed: https://bajena.it

## Commits

| Item | Hash |
|------|------|
| Main fix | `e5a0ef2` |
| EN availability labels | `01df760` |
| Customer SubmitButton fix | `dc2b468` |
| E2E selector fix | `e8c1f4e` |
| Previous server commit | `163b5c129aa7016eaec8fb3bef04fc9b95521e37` |
| Live server commit | `e8c1f4e` (after hotfixes) |

## Cart crash + reliability

- Added `lib/commerce/cart-storage.ts` — safe parse/write for `bazhena-cart` localStorage
- `CartProvider` uses safe read/write; invalid JSON resets cart without React crash
- Badge `count` = sum of raw `items[].qty` (immediate), not only resolved lines
- After resolve, stale catalog slugs pruned from `items`
- `resolveCartEntries(entries, locale)` + `getPublishedCatalogMap(locale)` for localized titles/prices
- `scripts/cart-storage-smoke.ts` — unit-style smoke (no DB)

## Header / floating cart

- `FloatingCartButton` — inline SVG basket icon (no «Cart»/«Корз.» text)
- Safe-area insets on mobile/desktop FAB position
- Account button: full «Account»/«Кабинет» ≥361px; icon-only ≤360px (no «Acct.»/«Каб.»)

## EN catalog localization

- Services: `scripts/fix-public-en-translations.ts` + `data/catalog/legacy-services-en.json`
  - Deploy run: 1 legacy service updated (`transformatsionnaya-igra-denezhnyy-magnit`); 23 already had EN
- Products: `lib/catalog/product-localization.ts` + `data/catalog/product-translations.en.json` (71 slugs)
- `getPublishedProducts(locale)` / `getProductBySlug(slug, locale)`
- Localized product display categories (`PRODUCT_CATEGORY_LABELS_EN`)
- Localized availability chip on EN cards (`dict.catalog.availability`)

## Customer account i18n

- `dict.account.orderStatuses` / `paymentStatuses` (EN + RU)
- Customer account pages no longer import admin `ORDER_STATUS_LABELS`
- `SubmitButton` works outside `AdminI18nProvider` (fixes `/account/login` 500)

## QA tooling

- `@playwright/test` + `e2e/pkg357-smoke.spec.ts` + `playwright.config.ts`
- `scripts/check-en-catalog-cyrillic.ts`
- npm scripts: `qa:cart-storage`, `qa:en-catalog`, `qa:e2e:pkg357`, `catalog:build-en-products`, `catalog:fix-en-services`

## Deploy steps (executed)

```bash
git pull origin main
pnpm install --no-frozen-lockfile
pnpm db:generate
pnpm exec prisma migrate deploy
pnpm tsx scripts/fix-public-en-translations.ts --apply
pnpm db:verify:catalog
pnpm build
systemctl restart vedma
```

## Verification (live)

| Check | Result |
|-------|--------|
| `pnpm lint` / `pnpm build` | Pass (local + server) |
| `pnpm db:verify:catalog` | Pass on server |
| `fix-public-en-translations --apply` | 1 updated, 23 skipped |
| `check-en-catalog-cyrillic` @ bajena.it | Pass (`/en/services`, `/en/products`) |
| Playwright `pkg357-smoke` @ 390px | 6/6 pass |
| `/en/account/login` | 200 (was 500 before SubmitButton fix) |
| `vedma.service` | active |
| Other sites | astrology-panel.it 200, onix-ai.it 200, solanalisting.it 404 |

## Status

**READY_FOR_EXTERNAL_REVIEW**

See `docs/audit/package-3-5-7-live-browser-i18n-audit.md`.
