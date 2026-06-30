# Package 3.5.2 — Admin Panel i18n Audit

Date: 2026-06-30  
Branch: `cursor/package-3-5-2-admin-i18n`

## Scope

Localize admin UI chrome to EN/RU while keeping `/admin/*` URLs unchanged and public `/en`/`/ru` routing independent.

## Baseline (pre-3.5.2)

| Area | Files with Cyrillic |
|------|---------------------|
| `app/admin/` | 24 |
| `components/admin/` | 7 |
| `lib/admin/` | 6 |
| **Total** | **37** (+ `lib/auth/session.ts` role labels) |

Highest concentration: `app/admin/actions.ts`, `lib/admin/constants.ts`, `components/admin/catalog-entity-form.tsx`.

## Architecture

| Item | Value |
|------|-------|
| Cookie | `bajena_admin_locale` (path `/admin`, 1 year) |
| Fallback | `bajena_locale` → Accept-Language → `en` |
| Dictionaries | `lib/i18n/admin/dictionaries/{ru,en}.ts` |
| Detection | `getAdminLocaleFromCookies()`, `getAdminLocaleFromForm()` |
| Provider | `AdminI18nProvider` in `app/admin/layout.tsx` |
| Switcher | `AdminLocaleSwitcher` on login + sidebar |

## Pages in scope

- `/admin/login`
- `/admin/dashboard`
- `/admin/products`, `/admin/products/new`, `/admin/products/[id]`
- `/admin/services`, `/admin/services/new`, `/admin/services/[id]`
- `/admin/orders`, `/admin/orders/[id]`
- `/admin/requests`, `/admin/requests/[id]`
- `/admin/payments`
- `/admin/customers`, `/admin/customers/[id]`
- `/admin/media`, `/admin/media/[id]`, `/admin/media/site`
- `/admin/reviews`, `/admin/reviews/new`, `/admin/reviews/[id]`
- `/admin/settings`
- `/admin/users`, `/admin/users/new`, `/admin/users/[id]`

## Post-implementation Cyrillic audit

### Allowed remaining Cyrillic

| Location | Reason |
|----------|--------|
| `lib/i18n/admin/dictionaries/ru.ts` | RU dictionary source |
| `lib/admin/constants.ts` | Legacy exports for **customer** account pages (`ORDER_STATUS_LABELS`, etc.) — not admin UI |
| `lib/admin/settings.ts` | Default site content values (user-editable DB seed) |
| `lib/admin/slug.ts` | Transliteration map (not UI) |
| `lib/admin/media.ts` | Fallback strings when `dict` not passed (defensive) |
| `app/admin/actions.ts` | DB status history default comment (internal audit trail) |
| `app/admin/(panel)/orders/[id]/page.tsx` | Match on stored RU customer payment comment |
| `components/admin/admin-shell.tsx` | Brand sigil «Б» |
| DB-rendered content | Product/service/order/customer titles, notes, settings values |

### Admin UI chrome

No hardcoded Russian labels/buttons/notices remain in admin pages or shared admin components outside dictionaries.

## Public regression

- Public `/en` and `/ru` routes unchanged
- `bajena_locale` cookie independent from `bajena_admin_locale`
- Middleware still skips `/admin` from locale redirect

## Verification checklist

- [x] `/admin/login` EN/RU switch before login
- [x] Admin shell EN/RU switch after login
- [x] All panel pages use `dict.admin.*`
- [x] Server actions use `dict.actions.*` flash messages
- [x] `pnpm lint`, `pnpm build` pass
- [ ] Manual ADMIN/MANAGER/DEMO permission smoke (recommended before deploy)
- [ ] Manual media PNG upload smoke (recommended before deploy)
