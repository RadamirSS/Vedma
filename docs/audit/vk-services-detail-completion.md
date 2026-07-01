# VK Services Detail Completion

Branch: `cursor/vk-services-detail-completion`

## Status (after JS Apple Events enabled)

- **55** services processed via logged-in Safari
- **25** with full descriptions (>100 chars) via `document.body.innerText`
- **52** with image URLs; **55** valid per-service screenshots
- **25** ready for import (`services.import-candidates.json`)
- **30** not ready (short/missing description, often «от» price tiers)

## Method

Safari AppleScript navigation + JS Apple Events (`complete_details_safari.py`).

## Scripts

```bash
python3 scripts/vk-services/complete_details_safari.py
python3 scripts/vk-services/enrich_from_catalog.py
python3 scripts/vk-services/finalize_enrichment.py
```

No DB import. No secrets committed.
