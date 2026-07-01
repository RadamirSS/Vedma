# Package 3.5.3 — Full i18n & Visual Audit

Date: 2026-06-30  
Branch: `cursor/package-3-5-3-vk-services-visual-i18n-qa`

## Public / customer UI (Cyrillic grep)

Command:

```bash
rg -nP "[А-Яа-яЁё]" app/[locale] components lib \
  --glob '!**/node_modules/**' --glob '!**/ru.ts' --glob '!**/*.md'
```

### Allowed (not rendered as EN chrome)

| Location | Reason |
|----------|--------|
| `lib/i18n/dictionaries/ru.ts` | RU dictionary (excluded from grep) |
| `lib/vk-services/import-utils.ts` | Import script category labels stored in DB as RU |
| `lib/utils.ts` CATEGORY_TRANSLATIONS | Product category normalization for RU catalog |
| `lib/mock-data.ts` | Fallback seed / review content (DB content class) |
| `lib/service-directions.ts` | Base direction ids; titles overridden via `getLocalizedDirections()` |
| `lib/site-media.ts`, `lib/admin/settings.ts` | Default RU site settings / brand alt |
| `components/footer.tsx` sigil `Б` | Intentional brand mark |
| `lib/catalog-data.ts` | Static catalog seed (DB content) |

### Fixed in 3.5.3

| Issue | Fix |
|-------|-----|
| EN footer copyright showed RU `© Бажена / Магия Жизни` | `dict.footer.copyright` on EN; RU uses settings |
| EN headings «What Bajena works with» | → «Life areas I support» |
| EN reviews title | → «Client stories» |
| EN catalog button | → «Learn more» |
| Duplicate step numbering `01` + `1` | Removed inner `step-number` span; CSS counter only |
| Service cards EN category | `lib/i18n/service-categories.ts` |
| EN price format | `formatPrice(..., locale)` |

### Remaining acceptable Cyrillic on EN pages

- Review quotes from DB/mock when no EN translation exists (content, not chrome)
- Product/service titles from DB when viewed before import apply (fallback catalog)

## Public / customer UI (English on RU grep)

Suspicious patterns checked in components/pages. EN strings appear only in `lib/i18n/dictionaries/en.ts` and locale-aware code paths.

## Admin i18n (after Package 3.5.2 merge)

Admin chrome uses `lib/i18n/admin/dictionaries/{en,ru}.ts`. Cyrillic in admin grep outside dictionaries is limited to:

- Brand sigil / default site settings values
- DB-backed entity content in list cells
- Import utility labels (not admin UI)

Language switch: `/admin/login` + `AdminLocaleSwitcher` in panel shell — preserved from 3.5.2 merge.

## Visual QA checklist

- [x] Footer EN/RU brand text
- [x] Section step numbering single style
- [x] Homepage featured services: 8 cards
- [x] Services page uses DB + fallback with locale
- [ ] Full browser pass — requires local `pnpm dev` + DB import apply on server

## VK import

- 25 ready candidates in dry-run
- 30 not-ready excluded (`services.not-ready.json`)
- Import script: `pnpm vk:services:import:dry-run` / `pnpm vk:services:import:apply`
