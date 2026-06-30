# Detail completion report

- enrichedAt: 2026-06-30T22:36:25.183925+00:00
- total: 55
- completed (full description): 1
- partial (screenshot/title): 54
- blocked: 0
- ready for import: 1
- not ready: 54
- screenshots saved: 55 (**note: captures are identical frames — Safari was not frontmost during batch; treat as invalid until re-captured**)
- images downloaded: 0
- image URL only: 0
- price tiers (from-price): 9

## Extraction
- Safari logged-in navigation via AppleScript
- Tab title + HTML shell + window screenshots
- JS Apple Events blocked unless enabled in Safari Developer settings
- Playwright blocked by VK robot challenge

## Enable full text capture
Safari → Settings → Advanced → Show features for web developers → Developer → **Allow JavaScript from Apple Events**
Then re-run `python3 scripts/vk-services/complete_details_safari.py`.
