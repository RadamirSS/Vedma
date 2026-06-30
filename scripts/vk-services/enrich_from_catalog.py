#!/usr/bin/env python3
"""Cross-reference enriched batch with existing VK catalog descriptions (no invention)."""

from __future__ import annotations

import csv
import json
import re
from difflib import SequenceMatcher
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
NORM = ROOT / "data" / "vk-services" / "normalized"
DETAIL = ROOT / "data" / "vk-services" / "detail"
BATCH = DETAIL / "reports" / "_batch_results.json"


def sim(a: str, b: str) -> float:
    return SequenceMatcher(None, a.lower().strip(), b.lower().strip()).ratio()


def load_catalog_rows() -> list[dict]:
    rows = []
    desc_csv = ROOT / "imports" / "vk" / "clean" / "descriptions.csv"
    if desc_csv.exists():
        with desc_csv.open(encoding="utf-8") as f:
            rows.extend(list(csv.DictReader(f)))
    for path in [ROOT / "imports" / "vk" / "clean" / "services.json"]:
        if path.exists():
            for item in json.loads(path.read_text(encoding="utf-8")):
                rows.append({
                    "title": item.get("title"),
                    "shortDescription": item.get("shortDescription"),
                    "fullDescription": item.get("fullDescription"),
                    "sourceUrl": item.get("sourceUrl"),
                    "priceLabel": item.get("priceLabel"),
                })
    return rows


def product_id(url: str | None) -> str | None:
    if not url:
        return None
    m = re.search(r"(\d{6,})$", url.split("?")[0])
    return m.group(1) if m else None


TITLE_ALIASES = {
    "определение (диагностика) негатива": "диагностика негатива",
}


def main() -> None:
    if not BATCH.exists():
        raise SystemExit("Missing batch results")

    services = json.loads(BATCH.read_text(encoding="utf-8"))
    catalog = load_catalog_rows()
    matched = 0

    for svc in services:
        if svc.get("descriptionRu"):
            continue
        hit = None
        pid = product_id(svc.get("sourceItemUrl"))
        for row in catalog:
            if pid and pid in (row.get("sourceUrl") or ""):
                hit = row
                break
        if not hit:
            alias = TITLE_ALIASES.get(svc["titleRu"].lower())
            for row in catalog:
                ct = (row.get("title") or "").lower()
                if alias and alias == ct:
                    hit = row
                    break
                if sim(svc["titleRu"], row.get("title") or "") >= 0.72:
                    hit = row
                    break
        if hit:
            desc = hit.get("fullDescription") or hit.get("shortDescription")
            if desc:
                svc["descriptionRu"] = desc
                svc["shortDescriptionRu"] = (hit.get("shortDescription") or desc)[:180]
                svc["extractionMethod"] = "catalog_crossref"
                svc["confidence"] = "medium"
                svc["notes"] = (svc.get("notes") or "") + " Description from existing imports/vk catalog match."
                matched += 1

    BATCH.write_text(json.dumps(services, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"catalog matches: {matched}")


if __name__ == "__main__":
    main()
