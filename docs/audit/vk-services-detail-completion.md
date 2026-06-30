# VK Services Detail Completion

Branch: `cursor/vk-services-detail-completion`  
Base: `cursor/vk-services-parse`

## Goal

Enrich 55 parsed VK uslugi services with descriptions, images, and detail metadata using the owner's logged-in Safari session.

## Method

1. **Safari AppleScript navigation** — open each `sourceItemUrl` in Safari (logged-in session).
2. **Tab title** — confirm title and price from VK page title.
3. **HTML shell** — save `source of document` (SPA bootstrap; no rendered description without JS).
4. **Window screenshot** — bounds-based `screencapture -R` after scroll.
5. **Optional JS/clipboard** — requires Safari → Developer → *Allow JavaScript from Apple Events*.

Playwright/Chromium remains blocked by VK robot challenge. Cookie export is not used.

## Scripts

- `scripts/vk-services/complete_details_safari.py` — batch detail capture
- `scripts/vk-services/finalize_enrichment.py` — build enriched JSON, import candidates, reports

## Outputs

```
data/vk-services/detail/
  raw-html/ raw-text/ screenshots/ media/ manual-notes/ reports/
data/vk-services/normalized/
  services.enriched.json
  services.import-candidates.json
  services.not-ready.json
  services.translation-brief.json (updated)
```

## Owner action for full text

Enable **Allow JavaScript from Apple Events** in Safari Developer settings, then re-run the batch script.

No DB import, no UI changes, no secrets committed.
