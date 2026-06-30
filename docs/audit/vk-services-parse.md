# VK Services Parse — Bazhena

Date: 2026-06-30  
Branch: `cursor/vk-services-parse`

## Scope

Data collection only from VK **uslugi** pages for community `226854094` (Магия Жизни / Bazhena). No DB import, no UI changes, no deploy.

## Sources

| ID | URL | Section |
|----|-----|---------|
| source-01 | [Деловые услуги](https://vk.com/uslugi-226854094?screen=group&section_id=HUkaVBkFWVd2RwcDWVg2) | Деловые услуги |
| source-02 | [Обучение](https://vk.com/uslugi-226854094?section_id=HUkaVBkFWVZxRwcDWVg2) | Обучение |
| source-03 | [album_1](https://vk.com/uslugi-226854094?display_albums=true&section=album_1) | Матрица Судьбы |
| source-04 | [album_2](https://vk.com/uslugi-226854094?section=album_2) | Консультация |

## Access method

1. **Public Playwright (Chromium)** — primary method; listing pages accessible without login for sources 01, 02, 04.
2. **VK robot challenge** — appeared after repeated automated detail-page fetches; blocked full descriptions/images download.
3. **Manual fallback** — source-03 album listing restored from earlier public probe snapshot (11 cards) when automated fetch hit challenge.

Safari logged-in session was not used (no matching tabs detected via AppleScript).

## Scripts

- `scripts/vk-services/parse_vk_services.py` — Playwright listing + detail capture
- `scripts/vk-services/finalize_parse.py` — merge raw text/HTML, dedupe, normalize
- `scripts/vk-services/generate_reports.py` — dedupe, project comparison, QA checklist

## Output layout

```
data/vk-services/
  raw/           # HTML, text, extraction notes
  screenshots/   # source-01..04.png
  media/         # downloaded covers (when available)
  normalized/    # JSON + CSV
  reports/       # dedupe, comparison, QA
```

## Known gaps

- **Descriptions**: detail pages blocked by VK challenge during batch fetch; titles/prices captured from listings.
- **Images**: direct image download blocked; `imageUrls` empty unless later enriched manually.
- **source-01 partial scroll**: saved listing text contains 24 visible cards (lazy-load did not complete in final capture); full section may contain more items on live VK page.

## Safety

- No cookies, tokens, or Safari session data committed.
- `.env` and browser profiles not included.

## Next steps (not in this task)

- Owner-assisted re-fetch of blocked detail pages from logged-in Safari (save HTML per service).
- Import into DB after review.
- English translation drafts.
