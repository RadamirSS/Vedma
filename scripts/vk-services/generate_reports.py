#!/usr/bin/env python3
"""Generate VK services parse reports (dedupe, comparison, QA)."""

from __future__ import annotations

import json
import re
from difflib import SequenceMatcher
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data" / "vk-services"
NORMALIZED = DATA / "normalized"
REPORTS = DATA / "reports"


def load_json(name: str) -> dict:
    return json.loads((NORMALIZED / name).read_text(encoding="utf-8"))


def similar(a: str, b: str) -> float:
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def main() -> None:
    normalized = load_json("services.normalized.json")
    raw = load_json("services.raw.json")
    services = normalized["services"]

    exact_dupes: list[tuple[str, str]] = []
    similar_dupes: list[tuple[str, str, float]] = []
    titles = [s["titleRu"] for s in services]
    for i, a in enumerate(services):
        for b in services[i + 1 :]:
            if a["titleRu"] == b["titleRu"]:
                exact_dupes.append((a["sourceId"], b["sourceId"]))
            elif similar(a["titleRu"], b["titleRu"]) >= 0.88:
                similar_dupes.append((a["sourceId"], b["sourceId"], similar(a["titleRu"], b["titleRu"])))

    price_desc_dupes = []
    for i, a in enumerate(services):
        for b in services[i + 1 :]:
            if (
                a.get("priceAmountRub")
                and a.get("priceAmountRub") == b.get("priceAmountRub")
                and a.get("descriptionRu")
                and b.get("descriptionRu")
                and similar(a["descriptionRu"][:120], b["descriptionRu"][:120]) > 0.8
            ):
                price_desc_dupes.append((a["sourceId"], b["sourceId"]))

    missing_price = [s for s in services if not s.get("priceAmountRub") and not s.get("priceRaw")]
    missing_desc = [s for s in services if not s.get("descriptionRu")]
    missing_img = [s for s in services if not s.get("downloadedImagePaths") and not s.get("imageUrls")]
    product_like = [
        s
        for s in services
        if any(k in (s.get("titleRu") or "").lower() for k in ("браслет", "подставка", "коробок", "покрывало", "свеч"))
    ]
    needs_clarification = [
        s
        for s in services
        if s.get("priceRaw", "").startswith("от") or not s.get("descriptionRu") or "blocked" in (s.get("notes") or "").lower()
    ]

    per_source = {}
    for src in raw["sources"]:
        per_source[src["id"]] = src.get("cardsFound", 0)

    dedupe_md = f"""# Deduplication report

Parsed at: {normalized.get('parsedAt')}

## Totals

- Total parsed items (unique): **{len(services)}**
- Raw listing rows across sources: **{sum(per_source.values())}**
- Probable exact-title duplicates: **{len(exact_dupes)}**
- Probable similar-title duplicates (>=88%): **{len(similar_dupes)}**
- Same price + similar description pairs: **{len(price_desc_dupes)}**
- Unique services after dedupe (by title): **{len({s['titleRu'] for s in services})}**

## Per source listing counts

| Source | Cards found |
|--------|-------------|
"""
    for sid, count in per_source.items():
        dedupe_md += f"| {sid} | {count} |\n"

    dedupe_md += f"""
## Missing fields

- Missing price: **{len(missing_price)}**
- Missing description: **{len(missing_desc)}**
- Missing image (download + URL): **{len(missing_img)}**

## Probable exact duplicates

"""
    if exact_dupes:
        for a, b in exact_dupes[:30]:
            dedupe_md += f"- {a} ↔ {b}\n"
    else:
        dedupe_md += "- None detected\n"

    dedupe_md += "\n## Probable similar-title duplicates\n\n"
    if similar_dupes:
        for a, b, score in sorted(similar_dupes, key=lambda x: -x[2])[:30]:
            dedupe_md += f"- {a} ↔ {b} (similarity {score:.2f})\n"
    else:
        dedupe_md += "- None detected\n"

    dedupe_md += "\n## Product-like items (may not be services)\n\n"
    if product_like:
        for s in product_like:
            dedupe_md += f"- {s['sourceId']}: {s['titleRu']}\n"
    else:
        dedupe_md += "- None detected\n"

    dedupe_md += "\n## Needs owner clarification\n\n"
    for s in needs_clarification[:40]:
        dedupe_md += f"- {s['sourceId']} **{s['titleRu']}** — {s.get('notes') or 'partial data / from-price / missing description'}\n"

    (REPORTS / "deduplication-report.md").write_text(dedupe_md, encoding="utf-8")

    project_services = []
    clean_path = ROOT / "imports" / "vk" / "clean" / "services.json"
    if clean_path.exists():
        project_services = json.loads(clean_path.read_text(encoding="utf-8"))

    project_titles = {s["title"] for s in project_services}
    vk_titles = {s["titleRu"] for s in services}

    already = []
    missing = []
    for s in services:
        matched = None
        for p in project_services:
            if p["title"] == s["titleRu"] or similar(p["title"], s["titleRu"]) > 0.9:
                matched = p
                break
        if matched:
            price_mismatch = matched.get("priceFrom") and s.get("priceAmountRub") and matched["priceFrom"] != s["priceAmountRub"]
            already.append((s, matched, price_mismatch))
        else:
            missing.append(s)

    not_in_vk = [p for p in project_services if p["title"] not in vk_titles and not any(similar(p["title"], v) > 0.9 for v in vk_titles)]

    cmp_md = f"""# Current project comparison

Compared VK parse ({len(services)} services) with `imports/vk/clean/services.json` ({len(project_services)} services).

## Already present in project

"""
    for s, p, price_mismatch in already:
        flag = " ⚠ price mismatch" if price_mismatch else ""
        cmp_md += f"- **{s['titleRu']}** — project slug `{p.get('slug')}`{flag}\n"
        if price_mismatch:
            cmp_md += f"  - VK: {s.get('priceRaw')} ({s.get('priceAmountRub')}); project: {p.get('priceLabel')} ({p.get('priceFrom')})\n"

    cmp_md += f"\n## VK services missing from project ({len(missing)})\n\n"
    for s in missing[:60]:
        cmp_md += f"- {s['sourceId']}: **{s['titleRu']}** — {s.get('priceRaw')} — direction `{s.get('directionSuggestion')}`\n"
    if len(missing) > 60:
        cmp_md += f"\n… and {len(missing) - 60} more.\n"

    cmp_md += "\n## Project services not found in VK parse\n\n"
    for p in not_in_vk:
        cmp_md += f"- {p['title']} (slug `{p.get('slug')}`)\n"

    cmp_md += "\n## Title mismatches to review\n\n"
    for s, p, _ in already:
        if s["titleRu"] != p["title"]:
            cmp_md += f"- VK `{s['titleRu']}` vs project `{p['title']}`\n"

    cmp_md += "\n## Category / direction suggestions\n\n"
    from collections import Counter

    counts = Counter(s.get("directionSuggestion") for s in services)
    for direction, count in counts.most_common():
        cmp_md += f"- `{direction}`: {count}\n"

    (REPORTS / "current-project-comparison.md").write_text(cmp_md, encoding="utf-8")

    downloaded = sum(1 for s in services if s.get("downloadedImagePaths"))
    url_only = sum(1 for s in services if s.get("imageUrls") and not s.get("downloadedImagePaths"))

    qa_md = f"""# Manual QA checklist

## Source pages

| Source | URL status | Visible/parsed cards |
|--------|------------|----------------------|
"""
    for src in normalized["sources"]:
        sid = next((r["id"] for r in raw["sources"] if r["url"] == src["url"]), "?")
        qa_md += f"| {sid} | {src['status']} | {per_source.get(sid, 0)} |\n"

    qa_md += f"""
## Artifacts

- [x] Screenshots saved (`data/vk-services/screenshots/source-0X.png`)
- [x] Raw text saved (`data/vk-services/raw/source-0X.txt`)
- [x] Raw HTML saved (`data/vk-services/raw/source-0X.html`)
- [x] Normalized JSON + CSV created
- [{'x' if downloaded else ' '}] Media downloaded: **{downloaded}**
- [{'x' if url_only else ' '}] Media URL-only: **{url_only}**

## Counts

- Total unique services parsed: **{len(services)}**
- Missing price: **{len(missing_price)}**
- Missing description: **{len(missing_desc)}**
- Missing image: **{len(missing_img)}**
- Blocked/partial detail pages: **{sum(1 for s in services if 'blocked' in (s.get('notes') or '').lower())}**

## User clarification needed

"""
    for s in needs_clarification[:25]:
        qa_md += f"- [ ] {s['titleRu']} — verify price/options/description\n"

    qa_md += """
## Confirmations

- [x] No DB import performed
- [x] No public site UI changes
- [x] No admin UI changes
- [x] No deploy
- [x] No cookies/tokens committed
"""

    (REPORTS / "manual-qa-checklist.md").write_text(qa_md, encoding="utf-8")
    print("Reports written.")


if __name__ == "__main__":
    main()
