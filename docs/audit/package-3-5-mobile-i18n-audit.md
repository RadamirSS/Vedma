# Package 3.5 / 3.5.1 — Mobile UX & i18n Audit

Date: 2026-06-30  
Branch: `cursor/package-3-5-mobile-i18n-polish`

## Package 3.5 (foundation)

- Public routes under `app/[locale]/` (en, ru)
- Typed dictionaries in `lib/i18n/dictionaries/{en,ru}.ts`
- Middleware: upload rewrite preserved + locale redirect (cookie `bajena_locale` → Accept-Language → default `en`)
- Mobile header account button visible at ≤720px
- Checkout dark premium mobile CSS
- Login/register dual-card CTA layout
- LocaleSwitcher in header/footer
- hreflang/canonical metadata in `app/[locale]/layout.tsx`

## Package 3.5.1 — Hardcoded text closeout

### Fixed in this pass

| Area | File | Change |
|------|------|--------|
| Address autocomplete | `components/address-autocomplete.tsx` | All UI via `dict.address.*` |
| Checkout validation | `app/[locale]/checkout/actions.ts` | `dict.checkout.validation.*` + `mapCheckoutServerError()` |
| Account actions | `app/[locale]/account/actions.ts` | `dict.account.messages.*` |
| Contact method select | `components/checkout-view.tsx` | `dict.checkout.contactMethods.*` |
| Cart resolve errors | `components/cart-context.tsx`, `app/api/cart/resolve/route.ts` | Locale-aware `dict.cart.resolve*` |
| Add to cart fallback | `components/commerce/add-to-cart-button.tsx` | `dict.catalog.addToCart` |
| Telegram prefill | `lib/i18n/localized-directions.ts`, `components/catalog-card.tsx` | `dict.common.telegramLead*` |
| Service price prefix | `components/catalog-card.tsx` | `dict.catalog.fromPrice` instead of hardcoded «от» |
| SSR html lang | `middleware.ts`, `app/layout.tsx` | `x-bajena-locale` header → `<html lang>` |
| EN copy polish | `lib/i18n/dictionaries/en.ts` | «Insight work», «deep support for personal life situations» |

### Cyrillic grep audit (2026-06-30)

Command equivalent:

```bash
grep -RIn "[А-Яа-яЁё]" app/[locale] components lib \
  --exclude-dir=node_modules --exclude="ru.ts" --exclude-dir=admin
```

#### Customer-visible — fixed or acceptable

| Location | Status | Notes |
|----------|--------|-------|
| `components/address-autocomplete.tsx` | Fixed | Uses dictionary |
| `components/checkout-view.tsx` | Fixed | Contact methods localized |
| `components/cart-context.tsx` | Fixed | Resolve errors localized |
| `components/commerce/add-to-cart-button.tsx` | Fixed | Fallback localized |
| `components/catalog-card.tsx` | Fixed | Telegram prefill + fromPrice; DB `item.title`/`availability` may be RU |
| `components/header.tsx`, `footer.tsx` sigil «Б» | Acceptable | Brand mark on RU logo |
| `components/legal-notice.tsx` | Dead code | Unused; footer uses `dict.footer.disclaimer` |
| `components/lead-cta.tsx` defaults | Acceptable | All call sites pass dict props |

#### Admin / internal — allowed Russian

| Location | Notes |
|----------|-------|
| `components/admin/**` | Admin panel stays Russian |
| `app/[locale]/account/actions.ts:169` | Admin status history comment |
| `app/[locale]/account/{login,register,page}.tsx` | Admin-user redirect to `/admin/dashboard` |
| `lib/commerce/checkout.ts` | Internal throws mapped via `mapCheckoutServerError()` |
| `lib/auth/customer-account.ts` | Internal throws mapped via `mapRegisterServerError()` |
| `lib/i18n/map-checkout-error.ts` | Keyword matcher for RU internal errors |
| `lib/service-directions.ts` | Fallback seed data; UI uses `getLocalizedDirections(dict)` |

#### DB / catalog content — acceptable

- Product/service titles, descriptions, availability strings from database
- Review quotes in `lib/mock-data.ts`
- `formatPrice()` uses `ru-RU` number grouping (currency symbol only; not UI copy)

### EN copy review

- «diagnostics» direction → **Insight work**
- Hero/directions → **deep support for personal life situations**
- No «guaranteed», «medical», «accurate diagnosis», or «professional help» in EN dictionary
- Soft trust tone preserved in `dict.trust.softNotice`

### html lang / metadata

- **SSR:** `middleware.ts` sets `x-bajena-locale` on `/en/*` and `/ru/*` responses; root `app/layout.tsx` reads header → `<html lang="en|ru">`
- **Client fallback:** `components/locale-html-lang.tsx` syncs after navigation
- **Metadata alternates:** `app/[locale]/layout.tsx` — canonical + `languages.en`, `languages.ru`, `x-default`

### Risk areas unchanged

| Area | Status |
|------|--------|
| `/uploads/admin` rewrite | Unchanged |
| Media upload | Unchanged |
| `/api/address/suggest` | Unchanged (DaData) |
| Admin i18n | Russian only (by design) |

### Verification checklist

- [ ] `/en/checkout` empty form → English validation + address + Phone contact method
- [ ] `/ru/checkout` empty form → Russian validation + address + Телефон
- [ ] `/en/account/login` wrong password → English error
- [ ] `/en/account/register` mismatched email/password → English error
- [ ] `/en/account/orders/[id]` «I have paid» → English result
- [ ] `/admin/login` unchanged
- [ ] `/uploads/admin` existing image works
- [ ] `pnpm lint`, `pnpm build`, `pnpm db:verify:catalog` pass
