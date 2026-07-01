# Package 3.5.5 — Final QA, EN USD Pricing, Production Deploy

Date: 2026-07-01  
Branch: `cursor/package-3-5-5-final-qa-usd-deploy` → merged to `main`  
Deployed: https://bajena.it

## Commits

| Item | Hash |
|------|------|
| Pricing fix commit | `74d1bb5` |
| Merge commit | `12dc050d2905dec83ef897aa42ba02093ede7cab` |
| Deployed app build | `12dc050` (restarted `vedma.service` 2026-07-01) |
| Previous server commit | `12e807a2c42fac60bb425ae01110d61237193fd6` |
| Docs / smoke scripts on `main` | `8ed2985` (no runtime rebuild required) |

## USD pricing (EN locale)

- Module: `lib/pricing/format-price.ts`, `lib/pricing/config.ts`, `lib/pricing/detect-from-price.ts`
- **RU public/customer:** RUB (`5 500 ₽`, `от 550 ₽`)
- **EN public/customer:** USD (`$61`, `from $6`)
- `priceUsd` from DB preferred when non-null
- Otherwise `priceRub / RUB_PER_USD` with whole-dollar rounding
- Env: `RUB_PER_USD` or `PRICE_USD_RUB_RATE` (1 USD = N RUB)
- **Production:** env not set → documented fallback **90** (logged at build/runtime)
- Orders/cart backend remain RUB-canonical; USD is display-only

## Exact vs from-price

- `CatalogItem.priceIsFrom` derived from `priceLabel` (`от` / `from`) and known VK from-price slugs
- Exact example: `/en/services/obryad-svaroga-kovanaya-sudba` → `$61` (no `from`)
- Exact RU: `/ru/services/obryad-svaroga-kovanaya-sudba` → `5 500 ₽` (no `от`)
- From EN: `/en/services/vhod-v-finansovyy-potok` → `from $6`
- From RU: `/ru/services/vhod-v-finansovyy-potok` → `от 550 ₽`

## Verification

| Check | Result |
|-------|--------|
| `pnpm lint` | Pass (local) |
| `pnpm build` | Pass (local + server) |
| `pnpm db:verify:catalog` | Pass on server; local DB unavailable |
| Live HTTP smoke | `/` 307, `/en` `/ru` `/en/services` service pages `/admin/login` → 200 |
| EN catalog prices | USD in card `.price` cells; no `₽` in visible prices |
| RU catalog prices | RUB in card `.price` cells |
| Cart API `priceIsFrom` | `false` for exact-price Svarog service |
| DaData suggest | suggestions returned |
| `/uploads/vk/.../cover.jpg` | 200 |
| `/uploads/admin/...` known PNG | 200 |
| Other projects | astrology-panel.it, onix-ai.it → 200; solanalisting `/health` → 405 (service up) |
| `vedma.service` | active after restart |

## Checkout smoke (integration)

Script: `scripts/pkg355-checkout-smoke.ts` (server, no browser cookies)

| Locale label | Order number | Payment after «Я оплатил» stub |
|--------------|--------------|--------------------------------|
| EN | `ORD-20260701-12M8AC` | `PENDING` (not `PAID`) |
| RU | `ORD-20260701-TSTCL7` | `PENDING` (not `PAID`) |

Emails: `test+pkg355-en-<ts>@bajena.it`, `test+pkg355-ru-<ts>@bajena.it`  
Total stored: 5500 RUB each.

## Admin / browser QA (partial)

| Item | Result |
|------|--------|
| Admin login page | 200 |
| Admin EN/RU switch (post-login) | Not re-verified in browser this package (carried from 3.5.3) |
| ADMIN / MANAGER / DEMO permissions | Roles present in DB; route guards unchanged; browser re-smoke recommended |
| PNG upload (new file) | Existing admin PNG URL 200; new upload browser smoke not run |

## Public visual QA

- EN/RU footers: localized (Bajena / Magic of Life; Бажена / Магия Жизни)
- No broken “with with” on homepage
- Desktop HTTP checks pass
- Mobile 390px layout: not re-tested in browser this package

## Remaining limitations

- Payments, email, Lava not connected
- 30 VK not-ready services unpublished
- Screenshot/placeholder service images need owner replacement
- `RUB_PER_USD` not set on production `.env` (fallback 90 in use)
- Full browser checkout/admin/mobile E2E still recommended before client handoff

## Status

**READY_FOR_EXTERNAL_REVIEW** with noted browser-smoke gaps above.
