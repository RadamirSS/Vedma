#!/usr/bin/env python3
"""Build enriched/import/translation outputs from Safari detail batch."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
NORM = ROOT / "data" / "vk-services" / "normalized"
DETAIL = ROOT / "data" / "vk-services" / "detail"
REPORTS = DETAIL / "reports"

PRIORITY_A = [
    "Определение (диагностика) негатива",
    "Разбор ситуации на метафорических картах",
    "Консультация",
    "Ответ на один вопрос",
    "Распаковка Матрицы Судьбы",
    "Защита Себека",
    'Защита "Ведьмин Круг"',
    "Усиление связи с Родом",
    "Вход в финансовый поток",
    "Как пробить денежный потолок?",
    "Матрица Судьбы на 2026 год",
    "ОБРЯД СВАРОГА «КОВАНАЯ СУДЬБА»",
]


def priority(title: str) -> str:
    if title in PRIORITY_A:
        return "A"
    if any(s in title for s in ("Купало", "Самайн", "Маслен", "Равноденствие", "Спас", "Лугнасад", "Солнцестояние")):
        return "C"
    return "B"


def ready(s: dict) -> bool:
    has_text = bool(s.get("descriptionRu") or s.get("shortDescriptionRu"))
    has_media = bool(s.get("downloadedImagePaths") or s.get("imageUrls") or s.get("screenshotPaths"))
    return bool(s.get("titleRu") and s.get("priceRaw") and has_text and has_media and s.get("confidence") in {"high", "medium"})


def main() -> None:
    batch = DETAIL / "reports" / "_batch_results.json"
    if not batch.exists():
        raise SystemExit("Run complete_details_safari.py first")

    services = json.loads(batch.read_text(encoding="utf-8"))
    ts = datetime.now(timezone.utc).isoformat()

    completed = sum(1 for s in services if s.get("descriptionRu"))
    partial = sum(1 for s in services if not s.get("descriptionRu") and s.get("screenshotPaths"))
    blocked = sum(1 for s in services if s.get("extractionMethod") == "blocked" and not s.get("screenshotPaths"))
    candidates = [s for s in services if ready(s)]
    not_ready = [s for s in services if not ready(s)]

    enriched = {
        "enrichedAt": ts,
        "sourceBranch": "cursor/vk-services-detail-completion",
        "totalServices": len(services),
        "completedServices": completed,
        "partialServices": partial,
        "blockedServices": blocked,
        "services": services,
    }
    (NORM / "services.enriched.json").write_text(json.dumps(enriched, ensure_ascii=False, indent=2), encoding="utf-8")

    (NORM / "services.import-candidates.json").write_text(json.dumps({
        "generatedAt": ts,
        "services": [{
            "sourceId": s["sourceId"], "readyForImport": True, "titleRu": s["titleRu"],
            "slugSuggestion": s.get("slugSuggestion"), "directionSuggestion": s.get("directionSuggestion"),
            "priceAmountRub": s.get("priceAmountRub"), "priceRaw": s.get("priceRaw"),
            "shortDescriptionRu": s.get("shortDescriptionRu"), "descriptionRu": s.get("descriptionRu"),
            "imageSource": (s.get("downloadedImagePaths") or s.get("imageUrls") or s.get("screenshotPaths") or [None])[0],
            "localImagePath": (s.get("downloadedImagePaths") or s.get("screenshotPaths") or [None])[0],
            "needsTranslation": True, "needsOwnerReview": s.get("needsOwnerClarification", False),
        } for s in candidates],
    }, ensure_ascii=False, indent=2), encoding="utf-8")

    (NORM / "services.not-ready.json").write_text(json.dumps({
        "generatedAt": ts,
        "services": [{
            "sourceId": s["sourceId"], "titleRu": s["titleRu"],
            "missing": [x for x, ok in [
                ("description", bool(s.get("descriptionRu") or s.get("shortDescriptionRu"))),
                ("image", bool(s.get("downloadedImagePaths") or s.get("imageUrls") or s.get("screenshotPaths"))),
                ("confidence", s.get("confidence") in {"high", "medium"}),
            ] if not ok],
            "extractionMethod": s.get("extractionMethod"),
            "clarificationQuestion": s.get("clarificationQuestion"),
        } for s in not_ready],
    }, ensure_ascii=False, indent=2), encoding="utf-8")

    brief = {
        "updatedAt": ts,
        "services": [{
            "sourceId": s["sourceId"], "titleRu": s["titleRu"],
            "shortDescriptionRu": s.get("shortDescriptionRu"), "descriptionRu": s.get("descriptionRu"),
            "termsTransliterated": ["Матрица Судьбы", "Таро", "Род", "обряд", "марафон"],
            "sensitiveWordingNotes": "Avoid guaranteed outcomes; keep soft premium tone.",
            "recommendedEnTitleDraft": None,
            "recommendedEnShortDescriptionDraft": None,
            "recommendedEnToneNotes": "Warm, mystical, non-pressuring.",
        } for s in services],
    }
    (NORM / "services.translation-brief.json").write_text(json.dumps(brief, ensure_ascii=False, indent=2), encoding="utf-8")

    # checklist
    md = "# Detail completion checklist\n\n| sourceId | title | P | status | desc | image | notes |\n|---|---|---|---|---|---|---|\n"
    for s in services:
        md += f"| {s['sourceId']} | {s['titleRu'][:35]} | {priority(s['titleRu'])} | "
        st = "completed" if s.get("descriptionRu") else ("partial" if s.get("screenshotPaths") else "blocked")
        md += f"{st} | {'yes' if s.get('descriptionRu') else 'no'} | "
        img = "yes" if s.get("downloadedImagePaths") or s.get("imageUrls") else ("screenshot" if s.get("screenshotPaths") else "no")
        md += f"{img} | {(s.get('notes') or '')[:50]} |\n"
    (REPORTS / "detail-completion-checklist.md").write_text(md, encoding="utf-8")

    # owner clarifications
    oc = "# Owner clarifications needed\n\n## Priority A\n\n"
    for s in services:
        if priority(s["titleRu"]) == "A" and s.get("needsOwnerClarification"):
            oc += f"- **{s['titleRu']}** — {s.get('clarificationQuestion') or 'missing detail fields'}\n"
    oc += "\n## Priority B/C (from-price / seasonal)\n\n"
    for s in services:
        if priority(s["titleRu"]) != "A" and s.get("needsOwnerClarification"):
            oc += f"- **{s['titleRu']}** — {s.get('clarificationQuestion') or 'missing detail fields'}\n"
    (REPORTS / "owner-clarifications-needed.md").write_text(oc, encoding="utf-8")

    shots = sum(1 for s in services if s.get("screenshotPaths"))
    imgs = sum(1 for s in services if s.get("downloadedImagePaths"))
    url_only = sum(1 for s in services if s.get("imageUrls") and not s.get("downloadedImagePaths"))
    tiers = sum(1 for s in services if s.get("priceIsFrom") or s.get("priceOptions"))

    (REPORTS / "detail-completion-report.md").write_text(f"""# Detail completion report

- enrichedAt: {ts}
- total: {len(services)}
- completed (full description): {completed}
- partial (screenshot/title): {partial}
- blocked: {blocked}
- ready for import: {len(candidates)}
- not ready: {len(not_ready)}
- screenshots saved: {shots} (**note: captures are identical frames — Safari was not frontmost during batch; treat as invalid until re-captured**)
- images downloaded: {imgs}
- image URL only: {url_only}
- price tiers (from-price): {tiers}

## Extraction
- Safari logged-in navigation via AppleScript
- Tab title + HTML shell + window screenshots
- JS Apple Events blocked unless enabled in Safari Developer settings
- Playwright blocked by VK robot challenge

## Enable full text capture
Safari → Settings → Advanced → Show features for web developers → Developer → **Allow JavaScript from Apple Events**
Then re-run `python3 scripts/vk-services/complete_details_safari.py`.
""", encoding="utf-8")

    print(json.dumps({"total": len(services), "completed": completed, "partial": partial, "candidates": len(candidates)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
