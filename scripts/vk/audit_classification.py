#!/usr/bin/env python3
"""Semantic classification audit for VK catalog import."""

from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLEAN_PATH = ROOT / "imports" / "vk" / "clean" / "catalog_clean.json"
RAW_PATH = ROOT / "imports" / "vk" / "raw" / "vk_services_export.json"
AUDIT_PATH = ROOT / "docs" / "imports" / "vk-classification-audit.md"
REPORT_PATH = ROOT / "docs" / "imports" / "vk-import-report.md"

KEYWORD_REVIEW = (
    "расклад", "диагност", "чистк", "защит", "помощ", "консультац", "расчет",
    "игр", "практик", "ритуал", "обряд", "усилен", "освобож", "избавлен",
    "блокиров", "поток", "род", "негатив",
)

PHYSICAL_NOUNS = (
    "алтарн", "подставк", "покрывал", "шоппер", "свеч", "амулет", "браслет",
    "камн", "набор", "мешоч", "статуэт", "украшен", "коробок", "бокал", "часы",
    "табличк", "коврик", "сумк", "шпильк", "серьг", "спичек", "фигур", "мерч",
)

SERVICE_WORK_PATTERNS = (
    (re.compile(r"^диагностик", re.I), "Title is a diagnostic session performed by practitioner"),
    (re.compile(r"трансформационн\w*\s+игр", re.I), "Transformational game — facilitated session (~2h work)"),
    (re.compile(r"^расклад\b", re.I), "Tarot/spread reading as a service"),
    (re.compile(r"^консультац", re.I), "Consultation service"),
    (re.compile(r"^расч[её]т\b", re.I), "Calculation/analysis service"),
    (re.compile(r"^практик", re.I), "Guided practice session"),
    (re.compile(r"^ритуал\b", re.I), "Ritual performed by practitioner"),
    (re.compile(r"^обряд\b", re.I), "Rite performed by practitioner"),
)


def blob(item: dict) -> str:
    return " ".join(
        [
            item.get("title", ""),
            item.get("category", ""),
            item.get("shortDescription", item.get("shortText", "")),
            item.get("fullDescription", item.get("fullText", "")),
        ]
    ).lower()


def has_keyword(text: str) -> list[str]:
    return [k for k in KEYWORD_REVIEW if k in text]


def has_physical_title(title: str) -> bool:
    t = title.lower()
    return any(n in t for n in PHYSICAL_NOUNS) or "подставк" in t and "алтар" in t


def has_physical_specs(text: str) -> bool:
    return bool(
        re.search(
            r"(размер|диаметр|материал|алюмин|полиэстр|металлич|доставк|см\b|мм\b|ручная работа)",
            text,
            re.I,
        )
    )


def has_product_vk_category(category: str) -> bool:
    hints = (
        "bracelet", "souvenir", "gift", "tablecloth", "carpet", "rug", "runner",
        "hair access", "action figures", "merch", "accessor",
    )
    lower = (category or "").lower()
    return any(h in lower for h in hints)


def excerpt(text: str, limit: int = 90) -> str:
    text = re.sub(r"\s+", " ", (text or "")).strip()
    if len(text) <= limit:
        return text
    return text[: limit - 1] + "…"


def audit_item(item: dict) -> dict:
    title = item.get("title", "")
    text = blob(item)
    category = item.get("category", "")
    keywords = has_keyword(text)
    reasons: list[str] = []

    for pattern, reason in SERVICE_WORK_PATTERNS:
        if pattern.search(title):
            return {
                "recommended_type": "service",
                "confidence": "high",
                "reason": reason,
                "needs_review": False,
                "keyword_hits": keywords,
            }

    if has_physical_title(title):
        reasons.append(f"Physical object in title ({title.split()[0] if title else 'n/a'})")
        if keywords:
            reasons.append(
                f"Service/spiritual keywords in text ({', '.join(keywords)}) describe use, not sold work"
            )
        conf = "high" if has_physical_specs(text) or has_product_vk_category(category) else "medium"
        needs = conf != "high"
        return {
            "recommended_type": "product",
            "confidence": conf,
            "reason": "; ".join(reasons) if reasons else "Physical goods title",
            "needs_review": needs,
            "keyword_hits": keywords,
        }

    if has_physical_specs(text):
        reasons.append("Description lists size/material/shipping — shipped physical item")
        if keywords:
            reasons.append(f"Keywords ({', '.join(keywords)}) are symbolic/marketing, not service offering")
        return {
            "recommended_type": "product",
            "confidence": "high",
            "reason": "; ".join(reasons),
            "needs_review": False,
            "keyword_hits": keywords,
        }

    if has_product_vk_category(category):
        reasons.append(f"VK Market category indicates merchandise: {category}")
        if "ритуал" in text or "практик" in text:
            reasons.append("Mentions ritual/practice as intended use of a physical tool")
        conf = "medium" if len(title.split()) <= 2 and not has_physical_specs(text) else "high"
        return {
            "recommended_type": "product",
            "confidence": conf,
            "reason": "; ".join(reasons),
            "needs_review": conf == "medium",
            "keyword_hits": keywords,
        }

    if keywords and not has_physical_title(title) and not has_physical_specs(text):
        service_kw = [k for k in keywords if k not in ("род", "негатив", "защит", "ритуал", "практик")]
        if service_kw:
            return {
                "recommended_type": "service",
                "confidence": "medium",
                "reason": f"Service-oriented keywords without clear physical product: {', '.join(service_kw)}",
                "needs_review": True,
                "keyword_hits": keywords,
            }

    return {
        "recommended_type": item.get("type", "product"),
        "confidence": "low",
        "reason": "Insufficient signals — manual review required",
        "needs_review": True,
        "keyword_hits": keywords,
    }


def md_escape(value: str) -> str:
    return (value or "").replace("|", "\\|").replace("\n", " ")


def build_audit_table(items: list[dict]) -> tuple[list[dict], list[dict]]:
    rows = []
    keyword_section = []
    for item in items:
        audit = audit_item(item)
        image = (item.get("images") or [""])[0]
        row = {
            "title": item["title"],
            "current_type": item["type"],
            "vk_category": item.get("category", ""),
            "vk_section": item.get("sourceSection", ""),
            "price": item.get("priceLabel", ""),
            "sourceUrl": item.get("sourceUrl", ""),
            "image": image,
            "excerpt": excerpt(item.get("shortDescription", "")),
            "classifier_reason": audit["reason"],
            "recommended_type": audit["recommended_type"],
            "confidence": audit["confidence"],
            "needs_review": audit["needs_review"],
            "keyword_hits": audit["keyword_hits"],
            "id": item.get("id"),
            "slug": item.get("slug"),
        }
        rows.append(row)
        if audit["keyword_hits"]:
            keyword_section.append(row)
    return rows, keyword_section


def render_markdown(rows: list[dict], keyword_rows: list[dict]) -> str:
    lines = [
        "# VK Classification Audit",
        "",
        f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
        "",
        "## Summary",
        "",
        f"- Items audited: **{len(rows)}**",
        f"- Recommended services: **{sum(1 for r in rows if r['recommended_type'] == 'service')}**",
        f"- Recommended products: **{sum(1 for r in rows if r['recommended_type'] == 'product')}**",
        f"- Flagged `needsReview`: **{sum(1 for r in rows if r['needs_review'])}**",
        f"- Keyword-triggered review set: **{len(keyword_rows)}** items",
        "",
        "## Rules applied",
        "",
        "1. **Service** — action/work performed by Bazhena (диагностика, игра, расклад, консультация, etc.)",
        "2. **Product** — shipped physical object (алтарная подставка, браслет, покрывало, etc.)",
        "3. Spiritual keywords in description of a physical item do **not** reclassify as service",
        "4. **`needsReview=true`** when confidence is not high or type signals conflict",
        "",
        "## Full catalog (73 items)",
        "",
        "| # | Title | Current | VK category/section | Price | Image | Excerpt | Classifier reason | Recommended | Confidence |",
        "|---|-------|---------|---------------------|-------|-------|---------|-------------------|-------------|------------|",
    ]
    for i, r in enumerate(rows, 1):
        cat_sec = md_escape(f"{r['vk_category']} / {r['vk_section']}")
        lines.append(
            f"| {i} | {md_escape(r['title'])} | {r['current_type']} | {cat_sec} | {md_escape(r['price'])} "
            f"| `{md_escape(r['image'])}` | {md_escape(r['excerpt'])} | {md_escape(r['classifier_reason'])} "
            f"| **{r['recommended_type']}** | {r['confidence']} |"
        )

    lines.extend(
        [
            "",
            "## Keyword-triggered review",
            "",
            "Items whose title or description contains: "
            "расклад, диагностика, чистка, защита, помощь, консультация, расчёт, игра, практика, "
            "ритуал, обряд, усиление, освобождение, избавление, блокировка, поток, род, негатив.",
            "",
            "| Title | Keywords found | Current → Recommended | Confidence | needsReview | Notes |",
            "|-------|----------------|---------------------|------------|-------------|-------|",
        ]
    )
    for r in keyword_rows:
        kw = ", ".join(r["keyword_hits"])
        change = f"{r['current_type']} → {r['recommended_type']}"
        if r["current_type"] == r["recommended_type"]:
            change = r["current_type"]
        nr = "yes" if r["needs_review"] else "no"
        lines.append(
            f"| {md_escape(r['title'])} | {kw} | {change} | {r['confidence']} | {nr} | {md_escape(r['classifier_reason'])} |"
        )

    lines.extend(
        [
            "",
            "## Source URLs",
            "",
            "| # | Title | sourceUrl |",
            "|---|-------|-----------|",
        ]
    )
    for i, r in enumerate(rows, 1):
        lines.append(f"| {i} | {md_escape(r['title'])} | {r['sourceUrl']} |")

    return "\n".join(lines) + "\n"


def apply_audit(clean: dict, rows: list[dict]) -> tuple[dict, list[dict]]:
    changed = []
    by_id = {item["id"]: item for item in clean["items"]}
    for row in rows:
        item = by_id.get(row["id"])
        if not item:
            continue
        old = {
            "type": item["type"],
            "needsReview": item.get("needsReview", False),
            "reviewReasons": list(item.get("reviewReasons", [])),
        }
        item["type"] = row["recommended_type"]
        if row["needs_review"]:
            item["needsReview"] = True
            if "audit_review" not in item.get("reviewReasons", []):
                item.setdefault("reviewReasons", []).append("audit_review")
        new = {
            "type": item["type"],
            "needsReview": item.get("needsReview", False),
            "reviewReasons": item.get("reviewReasons", []),
        }
        if old != new:
            changed.append(
                {
                    "title": item["title"],
                    "before": old,
                    "after": new,
                    "confidence": row["confidence"],
                    "reason": row["classifier_reason"],
                }
            )
    services = [i for i in clean["items"] if i["type"] == "service"]
    products = [i for i in clean["items"] if i["type"] == "product"]
    clean["services"] = len(services)
    clean["products"] = len(products)
    clean["generatedAt"] = datetime.now(timezone.utc).isoformat()
    return clean, changed


def update_report(services: int, products: int, needs_review: int) -> None:
    if not REPORT_PATH.exists():
        return
    text = REPORT_PATH.read_text(encoding="utf-8")
    replacements = [
        (r"\| Услуг \| \d+ \|", f"| Услуг | {services} |"),
        (r"\| Товаров \| \d+ \|", f"| Товаров | {products} |"),
        (r"\| Позиций на ручную проверку \(`needsReview`\) \| \d+ \|", f"| Позиций на ручную проверку (`needsReview`) | {needs_review} |"),
    ]
    for pattern, repl in replacements:
        text = re.sub(pattern, repl, text)
    if "## Classification audit" not in text:
        text += (
            "\n## Classification audit\n\n"
            f"See [`vk-classification-audit.md`](./vk-classification-audit.md) — "
            f"{services} services, {products} products, {needs_review} flagged for review.\n"
        )
    REPORT_PATH.write_text(text, encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="VK classification audit")
    parser.add_argument("--apply", action="store_true", help="Apply audit recommendations to catalog_clean.json")
    args = parser.parse_args()

    clean = json.loads(CLEAN_PATH.read_text(encoding="utf-8"))
    rows, keyword_rows = build_audit_table(clean["items"])
    AUDIT_PATH.parent.mkdir(parents=True, exist_ok=True)
    AUDIT_PATH.write_text(render_markdown(rows, keyword_rows), encoding="utf-8")
    print(f"Wrote {AUDIT_PATH}")

    changed: list[dict] = []
    if args.apply:
        clean, changed = apply_audit(clean, rows)
        CLEAN_PATH.write_text(json.dumps(clean, ensure_ascii=False, indent=2), encoding="utf-8")
        services_path = CLEAN_PATH.parent / "services.json"
        products_path = CLEAN_PATH.parent / "products.json"
        services_path.write_text(
            json.dumps([i for i in clean["items"] if i["type"] == "service"], ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        products_path.write_text(
            json.dumps([i for i in clean["items"] if i["type"] == "product"], ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        needs_review = sum(1 for i in clean["items"] if i.get("needsReview"))
        update_report(clean["services"], clean["products"], needs_review)
        print(f"Applied {len(changed)} classification changes")

    needs = sum(1 for r in rows if r["needs_review"])
    print(f"Recommended: {sum(1 for r in rows if r['recommended_type']=='service')} services, "
          f"{sum(1 for r in rows if r['recommended_type']=='product')} products, {needs} needsReview")


if __name__ == "__main__":
    main()
