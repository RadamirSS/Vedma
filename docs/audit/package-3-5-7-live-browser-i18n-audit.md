# Package 3.5.7 — Live Browser / i18n Audit

Date: 2026-07-01  
Target: https://bajena.it  
Tooling: Playwright Chromium @ 390×844, `scripts/check-en-catalog-cyrillic.ts`

## Automated browser QA (Playwright)

Project: `chromium-390`  
Base URL: `https://bajena.it`  
Result: **6/6 passed** (25.5s)

| Test | Result |
|------|--------|
| EN `/en/services` + `/en/products` — no Cyrillic in `.product-card` | Pass |
| `/en/account/login` loads (heading + email field) | Pass |
| Broken `localStorage` `{bad` — `/en` does not crash | Pass |
| EN add-to-cart → drawer → `/en/cart` | Pass |
| RU add-to-cart → drawer opens | Pass |
| Header account @ 390px — «Account»/«Кабинет», no «Acct.»/«Каб.» | Pass |

## Cyrillic static scan

```
PKG357_BASE_URL=https://bajena.it pnpm tsx scripts/check-en-catalog-cyrillic.ts
→ check-en-catalog-cyrillic: ok (/en/services, /en/products)
```

Note: initial deploy failed scan due to RU availability «Под заказ» on EN product cards — fixed in `01df760` with `dict.catalog.availability`.

## Manual spot checks (HTTP + markup)

| Route | Status | Notes |
|-------|--------|-------|
| `/en` | 200 | Floating cart SVG present |
| `/en/services` | 200 | EN service titles |
| `/en/products` | 200 | EN product titles + «Made to order» |
| `/en/account/login` | 200 | Was 500 (`useAdminI18n` in `SubmitButton`) — fixed `dc2b468` |
| `/ru/account/login` | 200 | RU labels |

## Admin (manual recommended)

Not fully automated in this package. Prior packages confirmed admin EN/RU cookie switch via `bajena_admin_locale`. Re-check dashboard, services, products, orders in browser before client handoff.

## Other production sites

| Site | HTTP |
|------|------|
| astrology-panel.it | 200 |
| onix-ai.it | 200 |
| solanalisting.it | 404 |

## Known limitations

- Product EN titles use slug-based overlay (`product-translations.en.json`); quality is functional, not marketing-polished
- DB-backed review bodies may still contain RU on EN routes (documented exception from 3.5.6)
- Playwright matrix: only Chromium @ 390px in CI run; config includes 768 and 1366 projects for local runs

## Conclusion

Package 3.5.7 success criteria met on production: safe cart storage, localized EN catalog cards, SVG floating cart, account label UX, customer status labels, login/register pages, browser QA documented.
