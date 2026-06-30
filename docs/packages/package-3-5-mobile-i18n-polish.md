# Package 3.5 — Mobile UX Polish and i18n EN/RU

Date: 2026-06-30  
Branch: `cursor/package-3-5-mobile-i18n-polish`  
Status: Ready for review (not deployed)

## Summary

Package 3.5 fixes client-reported mobile UX/text issues and adds typed EN/RU i18n for the public site and customer flows. Admin panel remains Russian at `/admin`.

## Text cleanup

Removed from public UI:

- Homepage benefits section meta-copy: «Без запугивания, давления и обещаний невозможного. Тон сайта — мягкий, уверенный и глубокий.»
- Service direction tarot card: «Точная диагностика…» → «Диагностика через символы и интуицию.» (RU) / «Intuitive insight through symbols and archetypes.» (EN dictionary)

Grep proof (public code): no matches for forbidden phrases.

## Mobile header

- Account button uses `account-btn` class; visible at ≤720px (was hidden)
- Compact label «Каб.» / «Acct.» at narrow widths
- Account link added to mobile menu dropdown
- Locale switcher (EN/RU) in header and footer

## Checkout visual fix

Scoped `.checkout-grid` dark premium overrides:

- Dark burgundy glass cards
- Gold labels, ivory input text, readable placeholders
- Checkbox rows wrap without overflow
- Logout link styled as gold text-link (not browser default blue)

## Login/register CTA

- Login: dual-card layout — sign-in form + prominent «Create account» secondary button
- Register: prominent «Already have an account — sign in» button at top
- Benefit text: account needed to see order history and payment status

## i18n architecture

```
lib/i18n/
  config.ts           — locales, cookie, Accept-Language detection
  routing.ts          — localizeHref, stripLocale, getLocaleFromPathname
  get-dictionary.ts   — typed dictionary loader
  dictionaries/en.ts  — English UI chrome
  dictionaries/ru.ts  — Russian UI chrome
  localized-directions.ts

app/[locale]/         — all public/customer pages
middleware.ts         — upload rewrite + locale redirect
components/locale-switcher.tsx
components/locale-html-lang.tsx
```

## Language detection

Priority:

1. Cookie `bajena_locale` (manual choice, 1 year)
2. `Accept-Language` — Russian locales → `/ru`, else `/en`
3. Default: English

Manual switch via header/footer EN/RU toggle sets cookie and navigates to equivalent route. Cart preserved in localStorage.

## Routes

| URL | Behavior |
|-----|----------|
| `/` | Redirect to `/en` or `/ru` per detection |
| `/en`, `/ru` | Localized homepage |
| `/en/products`, `/ru/checkout`, etc. | Localized public routes |
| `/products`, `/checkout`, `/account` | Legacy redirect to detected locale |
| `/admin/*` | Unchanged |
| `/api/*` | Unchanged |
| `/uploads/admin/*` | Rewrite unchanged |

## SEO

- `html lang` synced via `LocaleHtmlLang`
- Per-locale metadata title/description
- `alternates.canonical` and `alternates.languages` (en, ru, x-default: en)

## Limitations

- Admin panel remains Russian only
- Catalog content (product/service titles, descriptions, reviews) still from DB in Russian on both locales — full catalog translation is phase 2
- Payments remain manual placeholders
- Email not connected
- Not deployed to production without owner approval

## Verification

```bash
pnpm lint        # pass
pnpm build       # pass
pnpm db:verify:catalog  # pass
```

## Smoke checklist

- [ ] `/` + Accept-Language: ru → `/ru`
- [ ] `/` + Accept-Language: en → `/en`
- [ ] Manual EN↔RU switch persists
- [ ] `/ru/checkout` and `/en/checkout` readable on mobile
- [ ] Cart survives language switch
- [ ] `/admin/login` unchanged
- [ ] `/uploads/admin/...` rewrite works
- [ ] Mobile 390px: account visible, registration CTA obvious
