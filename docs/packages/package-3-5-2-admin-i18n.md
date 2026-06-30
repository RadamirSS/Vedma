# Package 3.5.2 — Admin Panel i18n EN/RU

Date: 2026-06-30  
Branch: `cursor/package-3-5-2-admin-i18n`  
Status: Ready for review (not merged/deployed)

## Summary

Adds complete EN/RU internationalization to the admin panel. Admin URLs remain at `/admin/*` (no `/en/admin`). Public customer i18n at `/en` and `/ru` is unchanged.

## Architecture

```
lib/i18n/admin/
  config.ts              — bajena_admin_locale cookie
  detect-locale.ts       — cookie/header/form detection
  get-admin-dictionary.ts
  constants.ts           — locale-aware enum/category helpers
  dictionaries/ru.ts     — AdminDictionary source
  dictionaries/en.ts     — typed mirror

components/admin/
  admin-locale-switcher.tsx
  admin-i18n-provider.tsx

app/admin/layout.tsx     — AdminI18nProvider wrapper
```

## Language detection

Priority for admin UI:

1. Cookie `bajena_admin_locale` (path `/admin`)
2. Cookie `bajena_locale` (public fallback)
3. `Accept-Language` — Russian → `ru`, else `en`
4. Default: `en`

## Features

- EN/RU switcher on `/admin/login` (before auth)
- EN/RU switcher in admin sidebar (after auth)
- Localized nav, forms, tables, filters, status labels, flash messages
- Category dropdown labels translated in EN (DB values stay Russian)
- `html lang` syncs to admin locale on `/admin/*`

## Pages translated

Dashboard, products, services, orders, requests, payments, customers, media (incl. site media), reviews, settings, users — list + detail + create forms.

## Not in scope

- Catalog DB content translation (titles/descriptions remain as stored)
- Customer account pages still use legacy `lib/admin/constants.ts` status labels
- Payments/email integration
- URL locale segments for admin

## Verification

```bash
pnpm lint
pnpm build
pnpm db:verify:catalog
```

## Deploy

Do not merge or deploy without owner approval.
