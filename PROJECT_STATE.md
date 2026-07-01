# Project State

Date: 2026-07-01
Repository: `Vedma`
Current branch: `main`
Main branch status: Package 3.5.6 deployed on https://bajena.it (2026-07-01)

## Package 3.5.6 deploy (live)

- Fix commit: `ed077df`
- Merge commit: `163b5c129aa7016eaec8fb3bef04fc9b95521e37`
- Previous server commit: `8ed298578f3ae31e8f49baf29534c38fd7806d2e`
- Header: cart removed from top bar; floating cart bottom-left; cart in desktop/mobile menu
- i18n: about/contacts/legal/reviews localized for EN; full audit doc
- `pnpm db:verify:catalog`: pass on server
- `vedma.service`: active after restart
- Status: **READY_FOR_EXTERNAL_REVIEW**

See `docs/packages/package-3-5-6-final-header-cart-i18n-closeout.md`.

## Package 3.5.5 deploy (live)

- Pricing fix commit: `74d1bb5`
- Merge commit: `12dc050d2905dec83ef897aa42ba02093ede7cab`
- Previous server commit: `12e807a2c42fac60bb425ae01110d61237193fd6`
- EN locale: USD display (`lib/pricing/format-price.ts`), rate fallback 90 (env `RUB_PER_USD` not set on server)
- RU locale: RUB display; exact vs `от`/`from` fixed via `priceIsFrom`
- `pnpm db:verify:catalog`: pass on server
- `vedma.service`: active after restart
- Status: **READY_FOR_EXTERNAL_REVIEW** (browser admin/mobile smoke partially deferred)

See `docs/packages/package-3-5-5-final-qa-usd-deploy.md`.

## Package 3.5.3 / 3.5.4 deploy (live)

- Merge commit: `12e807a2c42fac60bb425ae01110d61237193fd6`
- Previous server commit: `7110266e1f5c4f5679aad1dd28cc127c3e8b1e9d`
- Migration `20260630120000_package_3_5_3_service_translations`: applied
- VK import: 25 services upserted (24 new + 1 merge into `diagnostika-negativa`)
- Production catalog: 26 services total, 24 published, 2 draft (Walpurgis, Samhain)
- `pnpm db:verify:catalog`: pass on server
- `vedma.service`: active after restart
- Status: **READY_FOR_EXTERNAL_REVIEW**

See `docs/packages/package-3-5-3-vk-services-visual-i18n-qa.md`.

## Instruction Sources

- Global repo-independent rules from `~/.codex/AGENTS.md`
- Package 3.3 customer journey and catalog cleanup task
- Package 3.3 acceptance closeout and live verification
- Package 3.4 production ordering and media polish (in review)

## Current Snapshot

The repository now runs a merged public site, admin panel, and manual-commerce backbone on `main`:

- Packages 1, 1.1, 2, 2.1/2.2, 3, 3.1, 3.2, and 3.3 are merged into `main`.
- The public site is suitable for client-facing previews.
- Managers can configure catalog items through the admin panel.
- Payments remain manual placeholders.
- Package 3.3 customer journey cleanup is live on bajena.it.

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
  - `20260629120000_package_3_4_test_order_flags`
  - `20260630120000_package_3_5_3_service_translations`

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

Status: `MERGED` / `DEPLOYED` on https://bajena.it

Merge commit: `61beb7aa663d041df24d23b4b5aae17616e51cb2`  
Feature branch tip: `a3992251602fedee89937c13e301292657f3ad8e`

Implemented:

- removed public VK/import UI and orphan preview routes
- checkout cart resolve error and stale-cart messaging
- `/account` dashboard and improved order detail
- admin catalog form CMS cleanup (upload-first image, no source URL field)
- `metadataBase` → `NEXT_PUBLIC_SITE_URL` / `https://bajena.it`
- `.env` gitignore protection

Acceptance proof (2026-06-29):

- local checkout E2E: `ORD-20260629-042AGC` (`cmqzl07lo0004ca1s3msei3wr`), email `test+pkg33-1782759534687@bajena.it`
- live checkout E2E: `ORD-20260629-UKELYU` (`cmqzl3flz0004l7b8fgv5rwqy`), email `test+pkg33-live-1782759692016@bajena.it`
- live manager image upload: product `/uploads/admin/2026/06/1782759724908-pkg33-test.png`, service `/uploads/admin/2026/06/1782759771746-pkg33-test.png` (files persist under `shared/uploads-admin` after `systemctl restart vedma`)
- smoke-test catalog rows (`pkg33-upload-*`) removed after verification; smoke-test orders retained in DB

See [docs/packages/package-3-3-customer-journey-cleanup.md](docs/packages/package-3-3-customer-journey-cleanup.md).

### Package 3.4

Status: `MERGED` / `DEPLOYED_TO_TEST` on https://bajena.it

Deploy commit: `839de2916462986b4437b2d1de1e5299ee2f635d` (+ TypeScript hotfix for DaData types)

Implemented:

- test/real order filtering in admin (ADMIN/MANAGER/DEMO scopes)
- site media slots at `/admin/media/site`
- customer registration at `/account/register`
- product/service/mixed checkout UX; PDF removed from checkout
- DaData address autocomplete via `/api/address/suggest`
- expanded delivery address fields on orders
- responsive CSS polish for public and admin UI
- `pnpm db:mark-test-orders` maintenance script

See [docs/packages/package-3-4-production-ordering-polish.md](docs/packages/package-3-4-production-ordering-polish.md).

### Package 3.4.1

Status: `MERGED` / `DEPLOYED_TO_TEST` on https://bajena.it

Implemented:

- customer register/login redirect fix; admin blocked from `/account`
- header “Оформить” removed; cart drawer remains primary checkout entry
- scary public disclaimers replaced with soft 18+ trust copy
- checkout reservation copy fixed; success panel only after order creation
- manual payment placeholder: “Я оплатил” → `PENDING` + status history (not `PAID`)
- customer cabinet dashboard and order detail polish
- admin order detail highlights customer payment mark

See [docs/packages/package-3-4-1-release-ux-closeout.md](docs/packages/package-3-4-1-release-ux-closeout.md).

### Package 3.4.2

Status: `MERGED` / `DEPLOYED_TO_TEST` on https://bajena.it

Implemented:

- checkout account modes (new vs existing customer)
- email/password confirmation on checkout and registration
- structured `fieldErrors` with inline highlighting
- single-field address UX with DaData status + manual fallback
- checkout success panel polish
- registration repeat email/password validation

See [docs/packages/package-3-4-2-checkout-ux-finalization.md](docs/packages/package-3-4-2-checkout-ux-finalization.md).

### Package 3.5

Status: `MERGED` / `DEPLOYED_TO_TEST` on https://bajena.it

Merge commit: `29acd63c66bbada48e06125f226b2d5ce148dcbb`  
Deployed commit: `7110266` (includes Caddy proxy redirect hotfix for `/` → `/en|ru`)

Implemented:

- removed inappropriate public meta-copy from homepage benefits section
- fixed service direction «точная диагностика» wording; EN uses «Insight work»
- mobile header: account button visible at ≤720px with compact label
- checkout dark premium mobile styling (readable labels/inputs/checkboxes)
- login/register dual-card CTA layout
- typed EN/RU i18n via `app/[locale]/` with middleware locale detection
- locale switcher (cookie `bajena_locale`), hreflang/canonical metadata, SSR `html lang`
- legacy `/products`, `/checkout`, `/account` redirect to detected locale
- localized checkout/account server validation and address autocomplete UI
- cart resolve errors and contact method select localized

Live smoke (2026-06-30):

- `/` Accept-Language en → `/en`, ru → `/ru` (after hotfix `7110266`)
- `/en`, `/ru`, `/admin/login`: HTTP 200
- EN checkout UI: English address block + Phone contact method
- RU checkout UI: Russian labels
- DaData: key present, `providerEnabled` true, suggestions returned
- `/uploads/admin/*`: HTTP 200, no locale redirect
- other server projects unchanged (astrology-panel.it, onix-ai.it, solanalisting.it)

Limitations:

- ~~admin remains Russian at `/admin`~~ → addressed in Package 3.5.2 (branch `cursor/package-3-5-2-admin-i18n`, not yet merged)
- catalog DB content still Russian on EN pages (UI chrome translated)
- payments/email unchanged
- full browser checkout E2E for PKG35 test emails not automated in deploy script (manual browser recommended)

See [docs/packages/package-3-5-mobile-i18n-polish.md](docs/packages/package-3-5-mobile-i18n-polish.md).

### Package 3.5.2

Status: `READY_FOR_REVIEW` on branch `cursor/package-3-5-2-admin-i18n` (not merged/deployed)

Implemented:

- independent admin i18n via `bajena_admin_locale` cookie (path `/admin`)
- typed dictionaries in `lib/i18n/admin/dictionaries/{ru,en}.ts`
- EN/RU switcher on login page and admin sidebar
- localized admin shell nav, forms, tables, filters, flash messages
- category dropdown labels translated in EN (DB values unchanged)
- `html lang` syncs to admin locale on `/admin/*`

Verification (2026-06-30, branch):

- `pnpm lint`: passed
- `pnpm build`: passed (with `ALLOW_STATIC_CATALOG_FALLBACK=true` — local DB credentials unavailable)
- `pnpm db:verify:catalog`: skipped locally (DB auth failure; run on server before deploy)

See [docs/packages/package-3-5-2-admin-i18n.md](docs/packages/package-3-5-2-admin-i18n.md) and [docs/audit/package-3-5-2-admin-i18n-audit.md](docs/audit/package-3-5-2-admin-i18n-audit.md).

## DB And Fallback Behavior

- With the active local `.env`, `DATABASE_URL` points to PostgreSQL and `ALLOW_STATIC_CATALOG_FALLBACK="false"`.
- In normal verification mode, build must use the real DB and fail if PostgreSQL is unavailable.
- Static fallback is allowed only when explicitly enabled.
- Normal merged-branch verification uses the real DB and does not use static fallback.

## Current Validation Status

Verified on 2026-06-30 on `main` (Package 3.5 deploy to bajena.it):

- `pnpm lint`: passed (local pre-merge)
- `pnpm build`: passed (local + server)
- `pnpm db:verify:catalog`: passed (local + server)
- `pnpm exec prisma migrate deploy`: no pending migrations (server)
- `vedma.service`: active on `127.0.0.1:3020`
- Caddy validate: valid
- locale redirects: `/` → `/en|ru` per Accept-Language; legacy `/products` → locale-prefixed
- DaData `/api/address/suggest`: `providerEnabled` true, suggestions returned
- `/uploads/admin/*`: HTTP 200
- EN/RU public UI chrome verified via live HTTP
- existing projects: astrology-panel.it, onix-ai.it, solanalisting.it — OK

Previously verified on 2026-06-30 (Packages 3.4.x):

- `pnpm install --frozen-lockfile`: passed
- `pnpm db:generate`: passed
- `pnpm exec prisma migrate deploy`: no pending migrations
- `pnpm db:mark-test-orders`: 2 total test orders retained (`ordersMarked: 0`)
- `pnpm db:verify:catalog`: passed (0 errors)
- `pnpm build`: passed on server (after DaData TypeScript type fix)
- `vedma.service`: active on `127.0.0.1:3020`
- Caddy validate: valid; bajena.it `/` 200, `/account` 307, `/admin/login` 200
- DaData `/api/address/suggest`: `providerEnabled` true, suggestions returned
- live product checkout smoke: `ORD-20260630-HSCE1R` (`test+deploy-1782823094@bajena.it`)
- live service checkout smoke: `ORD-20260630-K3PENZ` (`test+deploy-service-1782823094@bajena.it`)
- «Я оплатил» placeholder: payment status `PENDING`, not `PAID`
- customer register/login: pages render repeat fields; customer auth OK
- admin/demo scopes: production/test separation verified
- existing projects: astrology-panel.it, onix-ai.it, solanalisting.it — OK

Previously verified on 2026-06-29 (Package 3.3):

- `pnpm lint`: passed
- `pnpm build`: passed (production DB via SSH tunnel; `staticGenerationMaxConcurrency: 1`)
- `pnpm db:verify:catalog`: passed (0 errors; 2 warnings for server-only service images when verified locally)
- local browser checkout E2E: passed
- live public smoke on bajena.it: passed
- live browser checkout E2E: passed
- live manager image upload (product + service): passed
- server deploy on `main` at `61beb7aa663d041df24d23b4b5aae17616e51cb2`: `vedma` active

## Remaining Limitations

- Payments remain manual placeholders; no online provider, webhook, or invoicing automation exists
- No real email sending yet; email is collected for future confirmations/receipts
- No Lava integration
- Customers cannot self-download private PDFs
- Customer account creation through checkout and `/account/register`
- Smoke-test orders from acceptance E2E remain in production DB (marked by `test+pkg33-*@bajena.it` emails)
- DaData address suggestions connected on bajena.it server (configured during 2026-06-30 deploy)

## Merge Readiness

Status: `MERGED_AND_DEPLOYED_TO_TEST`

Packages 3.3, 3.4, 3.4.1, and 3.4.2 are merged to `main` and deployed to https://bajena.it for pre-production testing.

## Recommended Next Package

### Package 4

Do not start until owner approves pre-production testing on bajena.it and confirms payment/email integration scope.
