#!/usr/bin/env python3
"""Semantic classification audit for VK catalog import."""

from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RAW_PATH = ROOT / "imports" / "vk" / "raw" / "vk_services_export.json"
CLEAN_PATH = ROOT / "imports" / "vk" / "clean" / "catalog_clean.json"
MANIFEST_PATH = ROOT / "imports" / "vk" / "clean" / "image_manifest.json"
AUDIT_PATH = ROOT / "docs" / "imports" / "vk-classification-audit.md"

KEYWORDS_FOCUS = (
    "расклад", "диагност", "чистк", "защит", "помощ", "консультац",
    "расчет", "игр", "практик", "ритуал", "обряд", "усилен", "освобож",
    "избавлен", "блокиров", "поток", "род", "негатив",
)

SERVICE_TITLE_PATTERNS = (
    re.compile(r"^диагностик", re.I),
    re.compile(r"трансформационн\w*\s+игр", re.I),
    re.compile(r"^расклад\b", re.I),
    re.compile(r"^консультац", re.I),
    re.compile(r"^расч[её]т\b", re.I),
    re.compile(r"^практик", re.I),
    re.compile(r"^ритуал\b", re.I),
    re.compile(r"^обряд\b", re.I),
    re.compile(r"^разбор\b", re.I),
    re.compile(r"^сопровожден", re.I),
    re.compile(r"^чистк", re.I),
)

PHYSICAL_TITLE_PATTERNS = (
    re.compile(r"алтарн\w*\s+подставк", re.I),
    re.compile(r"подставк\w*\s+для\s+алтар", re.I),
    re.compile(r"алтарн\w*\s+покрывал", re.I),
    re.compile(r"покрывал", re.I),
    re.compile(r"шоппер", re.I),
    re.compile(r"коробок", re.I),
    re.compile(r"бокал", re.I),
    re.compile(r"часы", re.I),
    re.compile(r"табличк", re.I),
    re.compile(r"коврик", re.I),
    re.compile(r"шпильк", re.I),
    re.compile(r"серьг", re.I),
    re.compile(r"браслет", re.I),
    re.compile(r"сумка", re.I),
)

PHYSICAL_SIGNALS = (
    "алтарн", "подставк", "покрывал", "шоппер", "свеч", "амулет", "браслет",
    "камн", "набор", "мешоч", "статуэт", "украшен", "инструмент", "предмет",
    "талисман", "оберег", "постер", "картин", "коробок", "бокал", "часы",
    "табличк", "коврик", "сумк", "шпильк", "серьг", "спичек", "минерал",
    "фигур", "мерч", "издел", "полиэстр", "алюмин", "металлич", "кристал",
    "агат", "аметист", "гематит", "флюорит",
)

PRODUCT_CATEGORY_HINTS = (
    "bracelet", "tablecloth", "souvenir", "gift", "accessor", "hair access",
    "carpet", "rug", "runner", "action figures", "fan merch", "figures", "merch",
)

PHYSICAL_DESCRIPTION_HINTS = (
    "размер:", "диаметр:", "материал:", "алюмин", "полиэстр", "металлич",
    "ручная работа", "доставка:", " см", "мм", "под заказ",
)

SERVICE_DESCRIPTION_HINTS = (
    "проводится", "по фотографии", "в режиме переписки", "по записи",
    "занимает около", "часов работы", "онлайн", "разбор родовых",
    "трансовая практика", "проработка",
)


def blob(item: dict) -> str:
    return " ".join(
        [
            item.get("title", ""),
            item.get("category", ""),
            item.get("shortText", item.get("shortDescription", "")),
            item.get("fullText", item.get("fullDescription", "")),
        ]
    ).lower()


def matched_keywords(text: str) -> list[str]:
    return [k for k in KEYWORDS_FOCUS if k in text]


def has_physical_title(title: str) -> bool:
    lower = title.lower()
    if any(p.search(title) for p in PHYSICAL_TITLE_PATTERNS):
        return True
    return any(s in lower for s in PHYSICAL_SIGNALS)


def has_physical_blob(text: str) -> bool:
    if any(s in text for s in PHYSICAL_SIGNALS):
        return True
    return any(p.search(text) for p in PHYSICAL_TITLE_PATTERNS)


def is_service_title(title: str) -> bool:
    return any(p.search(title) for p in SERVICE_TITLE_PATTERNS)


def audit_item(item: dict) -> dict:
    title = (item.get("title") or "").strip()
    text = blob(item)
    category = item.get("category") or ""
    section = item.get("sourceSection", "")
    keywords = matched_keywords(text)

    physical_title = has_physical_title(title)
    physical_blob = has_physical_blob(text) or any(h in text for h in PHYSICAL_DESCRIPTION_HINTS)
    service_title = is_service_title(title)
    service_desc = any(h in text for h in SERVICE_DESCRIPTION_HINTS)
    merch_category = any(h in category.lower() for h in PRODUCT_CATEGORY_HINTS)

    recommended = "product"
    confidence = "high"
    needs_review = False
    reason_parts: list[str] = []

    if service_title:
        recommended = "service"
        confidence = "high"
        reason_parts.append("заголовок описывает выполняемую работу/сессию")
        if service_desc:
            reason_parts.append("описание подтверждает оказание услуги (срок, формат)")
    elif physical_title:
        recommended = "product"
        confidence = "high"
        reason_parts.append("заголовок — физический предмет (подставка, покрывало, украшение и т.д.)")
        if physical_blob:
            reason_parts.append("описание содержит размер/материал/доставку")
        if keywords:
            reason_parts.append(
                f"ключевые слова ({', '.join(keywords)}) относятся к назначению предмета, не к услуге"
            )
    elif physical_blob or merch_category:
        recommended = "product"
        confidence = "high" if physical_blob else "medium"
        if merch_category:
            reason_parts.append(f"категория VK Market указывает на товар: {category}")
        if physical_blob:
            reason_parts.append("описание физического изделия (размер, материал, объект)")
        if keywords and recommended == "product":
            reason_parts.append("сервисные слова в тексте не отменяют физическую природу товара")
    elif service_desc and not physical_blob:
        recommended = "service"
        confidence = "medium"
        reason_parts.append("описание указывает на выполняемую работу без признаков отгружаемого товара")
        needs_review = True
    else:
        recommended = "service"
        confidence = "low"
        needs_review = True
        reason_parts.append("недостаточно сигналов; требуется ручная проверка")

    # Edge cases from semantic review
    if title == "Вольт":
        recommended = "product"
        confidence = "medium"
        needs_review = True
        reason_parts = [
            "короткое брендовое название без явного типа в заголовке",
            "категория VK: Action figures and fan merch",
            "описание «для ритуальной работы» — контекст использования физического предмета",
        ]

    if "трансформационн" in title.lower() and "игр" in title.lower():
        recommended = "service"
        confidence = "high"
        needs_review = False
        reason_parts = [
            "трансформационная игра — проводимая Bazhena сессия (~2 часа)",
            "описание: проработка, трансовая практика, родовые программы",
            "не настольная игра как товар",
        ]

    if title.lower().startswith("диагностик"):
        recommended = "service"
        confidence = "high"
        needs_review = False
        reason_parts = [
            "диагностика выполняется Bazhena по фото/переписке",
            "описание проблемы клиента и формата работы, не физический товар",
        ]

    if physical_title and keywords:
        needs_review = False
        if confidence == "low":
            confidence = "high"

    if confidence == "low":
        needs_review = True
    elif confidence == "medium" and not physical_title and not service_title:
        needs_review = True

    return {
        "recommended_type": recommended,
        "confidence": confidence,
        "needs_review": needs_review,
        "classifier_reason": "; ".join(reason_parts),
        "keywords_hit": keywords,
    }


def md_cell(value: str) -> str:
    return (value or "—").replace("|", "\\|").replace("\n", " ")


def excerpt(text: str, limit: int = 90) -> str:
    text = re.sub(r"\s+", " ", (text or "")).strip()
    return text[: limit - 1] + "…" if len(text) > limit else text


def load_items() -> list[dict]:
    raw = json.loads(RAW_PATH.read_text(encoding="utf-8"))
    clean = json.loads(CLEAN_PATH.read_text(encoding="utf-8"))
    clean_by_url = {i["sourceUrl"]: i for i in clean["items"]}
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    img_by_url = {e["sourceUrl"]: (e.get("images") or [""])[0] for e in manifest["items"]}

    rows = []
    for raw_item in raw["items"]:
        url = raw_item.get("cardUrl", "")
        clean_item = clean_by_url.get(url, {})
        merged = {**raw_item, **clean_item}
        audit = audit_item(raw_item)
        rows.append(
            {
                "title": raw_item.get("title", ""),
                "current_type": clean_item.get("type", audit["recommended_type"]),
                "vk_category": raw_item.get("category", ""),
                "vk_section": raw_item.get("sourceSection", ""),
                "price": clean_item.get("priceLabel") or raw_item.get("priceText", ""),
                "source_url": url,
                "image_path": (clean_item.get("images") or [img_by_url.get(url, "")])[0],
                "short_excerpt": excerpt(
                    raw_item.get("shortText") or clean_item.get("shortDescription", "")
                ),
                "classifier_reason": audit["classifier_reason"],
                "recommended_final_type": audit["recommended_type"],
                "confidence": audit["confidence"],
                "needs_review": audit["needs_review"],
                "keywords_hit": audit["keywords_hit"],
                "slug": clean_item.get("slug", ""),
                "id": clean_item.get("id", ""),
            }
        )
    return rows


def generate_markdown(rows: list[dict]) -> str:
    services = sum(1 for r in rows if r["recommended_final_type"] == "service")
    products = sum(1 for r in rows if r["recommended_final_type"] == "product")
    review = sum(1 for r in rows if r["needs_review"])

    lines = [
        "# VK Classification Audit",
        "",
        f"Дата: {datetime.now(timezone.utc).strftime('%Y-%m-%d')}",
        "",
        "## Summary",
        "",
        f"- **Items audited:** {len(rows)}",
        f"- **Recommended services:** {services}",
        f"- **Recommended products:** {products}",
        f"- **Recommended needsReview:** {review}",
        "",
        "## Rules applied",
        "",
        "- **Service:** действие/работа, которую выполняет Bazhena (диагностика, игра-сессия, расклад, консультация).",
        "- **Product:** физический отгружаемый предмет, даже если в описании есть «ритуал», «защита», «практика».",
        "- **needsReview:** только при реальной неоднозначности (низкая/средняя уверенность без явного типа в заголовке).",
        "",
        "## Full catalog (73 items)",
        "",
        "| # | Title | Current | VK category / section | Price | Source URL | Image | Excerpt | Reason | Recommended | Confidence | Review |",
        "|---:|---|---|---|---|---|---|---|---|---|---|---|",
    ]

    for idx, row in enumerate(rows, 1):
        lines.append(
            "| {idx} | {title} | {current} | {cat} | {price} | {url} | `{img}` | {excerpt} | {reason} | {rec} | {conf} | {review} |".format(
                idx=idx,
                title=md_cell(row["title"]),
                current=row["current_type"],
                cat=md_cell(f"{row['vk_category']} / {row['vk_section']}"),
                price=md_cell(row["price"]),
                url=md_cell(row["source_url"]),
                img=md_cell(row["image_path"]),
                excerpt=md_cell(row["short_excerpt"]),
                reason=md_cell(row["classifier_reason"]),
                rec=row["recommended_final_type"],
                conf=row["confidence"],
                review="yes" if row["needs_review"] else "no",
            )
        )

    focus = [r for r in rows if r["keywords_hit"]]
    lines.extend(
        [
            "",
            f"## Keyword focus review ({len(focus)} items)",
            "",
            "Проверены позиции с: "
            + ", ".join(KEYWORDS_FOCUS)
            + ".",
            "",
            "| Title | Keywords | Current | Recommended | Confidence | Reason |",
            "|---|---|---|---|---|---|",
        ]
    )
    for row in focus:
        lines.append(
            "| {title} | {kw} | {cur} | {rec} | {conf} | {reason} |".format(
                title=md_cell(row["title"]),
                kw=md_cell(", ".join(row["keywords_hit"])),
                cur=row["current_type"],
                rec=row["recommended_final_type"],
                conf=row["confidence"],
                reason=md_cell(row["classifier_reason"]),
            )
        )

    changed = [
        r
        for r in rows
        if r["current_type"] != r["recommended_final_type"]
        or r["needs_review"] != (r.get("_prev_needs_review") is True)
    ]
    type_changes = [r for r in rows if r["current_type"] != r["recommended_final_type"]]
    if type_changes:
        lines.extend(["", "## Type changes recommended", ""])
        for r in type_changes:
            lines.append(
                f"- **{r['title']}:** {r['current_type']} → {r['recommended_final_type']} ({r['confidence']})"
            )
    else:
        lines.extend(["", "## Type changes recommended", "", "_None — current types match audit recommendations._"])

    return "\n".join(lines) + "\n"


def apply_audit(rows: list[dict]) -> list[dict]:
    clean = json.loads(CLEAN_PATH.read_text(encoding="utf-8"))
    by_url = {i["sourceUrl"]: i for i in clean["items"]}
    changes = []

    for row in rows:
        item = by_url.get(row["source_url"])
        if not item:
            continue
        prev_type = item["type"]
        prev_review = item.get("needsReview", False)
        prev_reasons = list(item.get("reviewReasons", []))

        new_type = row["recommended_final_type"]
        new_review = row["needs_review"]
        new_reasons = [r for r in prev_reasons if r not in ("ambiguous_type", "audit_review")]
        if new_review:
            new_reasons.append("audit_review" if row["confidence"] != "low" else "ambiguous_type")
        new_reasons = sorted(set(new_reasons))

        if prev_type != new_type or prev_review != new_review or prev_reasons != new_reasons:
            changes.append(
                {
                    "title": item["title"],
                    "from_type": prev_type,
                    "to_type": new_type,
                    "from_review": prev_review,
                    "to_review": new_review,
                    "confidence": row["confidence"],
                }
            )
            item["type"] = new_type
            item["needsReview"] = new_review
            item["reviewReasons"] = new_reasons
            item["id"] = f"vk-{'p' if new_type == 'product' else 's'}-{item['id'].split('-')[-1]}"

    services = [i for i in clean["items"] if i["type"] == "service"]
    products = [i for i in clean["items"] if i["type"] == "product"]
    clean["services"] = len(services)
    clean["products"] = len(products)
    clean["generatedAt"] = datetime.now(timezone.utc).isoformat()

    CLEAN_PATH.write_text(json.dumps(clean, ensure_ascii=False, indent=2), encoding="utf-8")
    (CLEAN_PATH.parent / "services.json").write_text(
        json.dumps(services, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (CLEAN_PATH.parent / "products.json").write_text(
        json.dumps(products, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    import csv

    with (CLEAN_PATH.parent / "needs_review.csv").open("w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["id", "title", "type", "reasons", "sourceUrl"])
        for item in clean["items"]:
            if item.get("needsReview"):
                writer.writerow(
                    [item["id"], item["title"], item["type"], ";".join(item.get("reviewReasons", [])), item["sourceUrl"]]
                )

    return changes


def main() -> None:
    parser = argparse.ArgumentParser(description="VK classification audit")
    parser.add_argument("--apply", action="store_true", help="Apply audit recommendations to catalog_clean.json")
    args = parser.parse_args()

    rows = load_items()
    clean = json.loads(CLEAN_PATH.read_text(encoding="utf-8"))
    prev_by_url = {i["sourceUrl"]: i for i in clean["items"]}
    for row in rows:
        prev = prev_by_url.get(row["source_url"], {})
        row["_prev_needs_review"] = prev.get("needsReview", False)

    AUDIT_PATH.parent.mkdir(parents=True, exist_ok=True)
    AUDIT_PATH.write_text(generate_markdown(rows), encoding="utf-8")
    print(f"Wrote {AUDIT_PATH}")

    changes: list[dict] = []
    if args.apply:
        changes = apply_audit(rows)
        print(f"Applied {len(changes)} classification updates")

    services = sum(1 for r in rows if r["recommended_final_type"] == "service")
    products = sum(1 for r in rows if r["recommended_final_type"] == "product")
    review = sum(1 for r in rows if r["needs_review"])
    print(f"Recommended: {services} services, {products} products, {review} needsReview")
    if changes:
        for c in changes[:20]:
            print(f"  changed: {c['title'][:50]} | {c['from_type']}->{c['to_type']} | review {c['from_review']}->{c['to_review']}")


if __name__ == "__main__":
    main()
