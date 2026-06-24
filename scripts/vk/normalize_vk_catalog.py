#!/usr/bin/env python3
"""Normalize VK raw export into clean catalog JSON and review reports."""

from __future__ import annotations

import argparse
import csv
import json
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_RAW = ROOT / "imports" / "vk" / "raw" / "vk_services_export.json"
DEFAULT_MANIFEST = ROOT / "imports" / "vk" / "clean" / "image_manifest.json"
CLEAN_DIR = ROOT / "imports" / "vk" / "clean"

def transliterate_slug(text: str) -> str:
    table = {
        "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "yo",
        "ж": "zh", "з": "z", "и": "i", "й": "y", "к": "k", "л": "l", "м": "m",
        "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u",
        "ф": "f", "х": "h", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "sch", "ъ": "",
        "ы": "y", "ь": "", "э": "e", "ю": "yu", "я": "ya",
    }
    out = []
    for ch in text.lower():
        if ch in table:
            out.append(table[ch])
        elif ch.isalnum():
            out.append(ch)
        elif ch in (" ", "-", "_"):
            out.append("-")
    slug = re.sub(r"-+", "-", "".join(out)).strip("-")
    return slug or "item"


def parse_price(price_text: str) -> tuple[str, int | None, int | None, str | None]:
    text = (price_text or "").strip()
    if not text:
        return "", None, None, None
    lower = text.lower()
    if "бесплат" in lower:
        return text, 0, 0, "RUB"
    if "договор" in lower:
        return text, None, None, None

    numbers = []
    for match in re.findall(r"\d[\d\s.,]*", text):
        normalized = match.replace(" ", "").replace(",", "")
        if normalized.isdigit():
            numbers.append(int(normalized))
    if not numbers:
        return text, None, None, None

    currency = "RUB" if "₽" in text or "руб" in lower else None
    if len(numbers) >= 2 and ("-" in text or "–" in text or "до" in lower):
        return text, min(numbers), max(numbers), currency
    value = numbers[0]
    return text, value, value, currency


SERVICE_ACTION_SIGNALS = (
    "расклад", "диагност", "чистк", "консультац", "расчет", "практик",
    "ритуал", "обряд", "разбор", "сопровожден", "таро", "прогноз",
    "расстанов", "консульт", "помощ",
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
)

PHYSICAL_PRODUCT_SIGNALS = (
    "алтарн", "подставк", "покрывал", "шоппер", "свеч", "амулет", "браслет",
    "камн", "набор", "мешоч", "статуэт", "украшен", "инструмент", "предмет",
    "талисман", "оберег", "постер", "картин", "коробок", "бокал", "часы",
    "табличк", "коврик", "сумк", "шпильк", "серьг", "спичек", "минерал",
    "фигур", "мерч", "издел", "полиэстр", "алюмин", "металлич", "кристал",
    "агат", "аметист", "гематит", "флюорит",
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

PRODUCT_CATEGORY_HINTS = (
    "action figures", "fan merch", "carpet", "rug", "runner", "hair access",
    "tablecloth", "souvenir", "gift", "accessor", "figures", "merch",
)

PHYSICAL_DESCRIPTION_HINTS = (
    "размер:", "диаметр:", "материал:", "алюмин", "полиэстр", "металлич",
    "ручная работа", "в наличии", "под заказ", "доставка:", "см",
)


def item_text_blob(item: dict) -> str:
    return " ".join(
        [
            item.get("title", ""),
            item.get("category", ""),
            item.get("shortText", ""),
            item.get("fullText", ""),
        ]
    ).lower()


def is_definitive_service_title(title: str) -> bool:
    return any(pattern.search(title) for pattern in SERVICE_TITLE_PATTERNS)


def has_physical_signal(text: str) -> bool:
    if any(signal in text for signal in PHYSICAL_PRODUCT_SIGNALS):
        return True
    return any(pattern.search(text) for pattern in PHYSICAL_TITLE_PATTERNS)


def has_service_action_signal(text: str) -> bool:
    return any(signal in text for signal in SERVICE_ACTION_SIGNALS)


def has_product_category(category: str) -> bool:
    lower = (category or "").lower()
    return any(hint in lower for hint in PRODUCT_CATEGORY_HINTS)


def has_physical_description(text: str) -> bool:
    return any(hint in text for hint in PHYSICAL_DESCRIPTION_HINTS)


def classify_type(item: dict) -> tuple[str, bool]:
    title = (item.get("title") or "").strip()
    title_lower = title.lower()
    blob = item_text_blob(item)
    category = item.get("category") or ""

    if is_definitive_service_title(title):
        return "service", False

    if has_physical_signal(title_lower):
        return "product", False

    if has_product_category(category):
        return "product", False

    if has_physical_signal(blob) or has_physical_description(blob):
        return "product", False

    if has_service_action_signal(title_lower) and not has_physical_signal(blob):
        return "service", False

    if has_service_action_signal(blob) and not has_physical_signal(blob):
        return "service", False

    # Short branded titles sold in VK Market with merch category (e.g. «Вольт»)
    if title and len(title.split()) <= 2 and has_product_category(category):
        return "product", False

    return "service", True


def first_sentence(text: str) -> str:
    text = re.sub(r"\s+", " ", (text or "")).strip()
    if not text:
        return ""
    parts = re.split(r"(?<=[.!?])\s+", text)
    return parts[0][:180]


def load_manifest(path: Path) -> dict[str, dict]:
    if not path.exists():
        return {}
    data = json.loads(path.read_text(encoding="utf-8"))
    by_url: dict[str, dict] = {}
    by_title: dict[str, dict] = {}
    for entry in data.get("items", []):
        source_url = entry.get("sourceUrl", "")
        if source_url:
            by_url[source_url] = entry
        title_key = (entry.get("title") or "").strip().lower()
        if title_key:
            by_title[title_key] = entry
    return {"by_url": by_url, "by_title": by_title}


def get_manifest_entry(manifest_index: dict[str, dict], card_url: str, title: str) -> dict:
    by_url = manifest_index.get("by_url", {})
    by_title = manifest_index.get("by_title", {})
    if card_url in by_url:
        return by_url[card_url]
    title_key = title.strip().lower()
    if title_key in by_title:
        return by_title[title_key]
    return {}


def normalize(raw_path: Path, manifest_path: Path, out_dir: Path) -> dict:
    raw = json.loads(raw_path.read_text(encoding="utf-8"))
    manifest_index = load_manifest(manifest_path)
    items_in = raw.get("items", [])
    clean_items = []
    failed_items = []
    slug_counts: dict[str, int] = {}
    seen_keys: set[str] = set()

    for item in items_in:
        title = (item.get("title") or "").strip()
        card_url = item.get("cardUrl") or ""
        dedupe_key = f"{card_url}|{title.lower()}"
        if not title or dedupe_key in seen_keys:
            continue
        seen_keys.add(dedupe_key)

        item_type, type_unclear = classify_type(item)
        base_slug = item.get("_slug") or transliterate_slug(title)
        slug_counts[base_slug] = slug_counts.get(base_slug, 0) + 1
        slug = base_slug if slug_counts[base_slug] == 1 else f"{base_slug}-{slug_counts[base_slug]}"

        price_label, price_from, price_to, currency = parse_price(item.get("priceText", ""))
        short_description = first_sentence(item.get("shortText") or item.get("fullText") or "")
        full_description = (item.get("fullText") or item.get("shortText") or "").strip()

        manifest_entry = get_manifest_entry(manifest_index, card_url, title)
        images = manifest_entry.get("images") or []

        needs_review = False
        review_reasons = []
        if type_unclear:
            needs_review = True
            review_reasons.append("ambiguous_type")
        if not price_label and price_from is None:
            needs_review = True
            review_reasons.append("missing_price")
        if not full_description:
            needs_review = True
            review_reasons.append("missing_description")
        if not images:
            needs_review = True
            review_reasons.append("missing_images")
        if item.get("enrichError"):
            needs_review = True
            review_reasons.append(f"enrich_error:{item['enrichError']}")

        clean = {
            "id": f"vk-{'p' if item_type == 'product' else 's'}-{len(clean_items) + 1}",
            "type": item_type,
            "title": title,
            "slug": slug,
            "priceLabel": price_label,
            "priceFrom": price_from,
            "priceTo": price_to,
            "currency": currency,
            "category": (item.get("category") or ("Товары" if item_type == "product" else "Услуги")).strip(),
            "shortDescription": short_description or full_description[:180],
            "fullDescription": full_description,
            "images": images,
            "sourceUrl": card_url,
            "sourcePlatform": "vk",
            "status": "published",
            "needsReview": needs_review,
            "reviewReasons": review_reasons,
            "sourceSection": item.get("sourceSection", "unknown"),
        }
        if not title:
            failed_items.append({"cardUrl": card_url, "reason": "missing_title"})
            continue
        clean_items.append(clean)

    services = [i for i in clean_items if i["type"] == "service"]
    products = [i for i in clean_items if i["type"] == "product"]

    out_dir.mkdir(parents=True, exist_ok=True)
    catalog_clean = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "sourcePage": raw.get("sourcePage"),
        "total": len(clean_items),
        "services": len(services),
        "products": len(products),
        "items": clean_items,
    }
    (out_dir / "catalog_clean.json").write_text(
        json.dumps(catalog_clean, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (out_dir / "services.json").write_text(
        json.dumps(services, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (out_dir / "products.json").write_text(
        json.dumps(products, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (out_dir / "failed_items.json").write_text(
        json.dumps(failed_items, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    with (out_dir / "descriptions.csv").open("w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["id", "type", "title", "category", "priceLabel", "shortDescription", "sourceUrl"])
        for item in clean_items:
            writer.writerow(
                [
                    item["id"],
                    item["type"],
                    item["title"],
                    item["category"],
                    item["priceLabel"],
                    item["shortDescription"],
                    item["sourceUrl"],
                ]
            )

    md_lines = ["# Описания импортированного каталога VK\n"]
    for item in clean_items:
        md_lines.append(f"## {item['title']}\n")
        md_lines.append(f"- **Тип:** {item['type']}")
        md_lines.append(f"- **Категория:** {item['category']}")
        md_lines.append(f"- **Цена:** {item['priceLabel'] or '—'}")
        md_lines.append(f"- **Кратко:** {item['shortDescription']}")
        md_lines.append(f"- **Полное:** {item['fullDescription']}")
        md_lines.append(f"- **Источник:** {item['sourceUrl']}\n")
    (out_dir / "descriptions.md").write_text("\n".join(md_lines), encoding="utf-8")

    with (out_dir / "needs_review.csv").open("w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["id", "title", "type", "reasons", "sourceUrl"])
        for item in clean_items:
            if item["needsReview"]:
                writer.writerow(
                    [
                        item["id"],
                        item["title"],
                        item["type"],
                        ";".join(item["reviewReasons"]),
                        item["sourceUrl"],
                    ]
                )

    return catalog_clean


def main() -> None:
    parser = argparse.ArgumentParser(description="Normalize VK export")
    parser.add_argument("--raw", type=Path, default=DEFAULT_RAW)
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--out", type=Path, default=CLEAN_DIR)
    args = parser.parse_args()
    if not args.raw.exists():
        raise SystemExit(f"Raw export not found: {args.raw}")
    result = normalize(args.raw, args.manifest, args.out)
    print(
        f"Normalized {result['total']} items "
        f"({result['services']} services, {result['products']} products)"
    )


if __name__ == "__main__":
    main()
