#!/usr/bin/env python3
"""Generate lib/catalog-data.ts from cleaned VK catalog JSON."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CLEAN = ROOT / "imports" / "vk" / "clean" / "catalog_clean.json"
OUTPUT = ROOT / "lib" / "catalog-data.ts"

ACCENT_RULES = [
    (("таро", "расклад", "диагност"), "tarot", "☾"),
    (("свеч", "ритуал"), "candle", "♨"),
    (("амулет", "оберег"), "amulet", "◈"),
    (("род", "родов"), "rod", "♜"),
    (("игр", "трансформ"), "game", "◇"),
    (("камн", "браслет", "кристал"), "stone", "◇"),
]

DEFAULT_ACCENT = ("tarot", "✦")


def pick_accent(title: str, category: str, item_type: str) -> tuple[str, str]:
    text = f"{title} {category}".lower()
    for keywords, accent, icon in ACCENT_RULES:
        if any(k in text for k in keywords):
            return accent, icon
    if item_type == "product":
        return "amulet", "◈"
    return DEFAULT_ACCENT


def split_details(full_description: str) -> list[str]:
    text = re.sub(r"\s+", " ", (full_description or "")).strip()
    if not text:
        return ["Подробности уточняются при оформлении заявки."]
    parts = re.split(r"(?<=[.!?])\s+|\n+", text)
    parts = [p.strip() for p in parts if p.strip()]
    if len(parts) == 1 and len(parts[0]) > 180:
        chunks = re.split(r",\s+", parts[0])
        parts = [c.strip() for c in chunks if c.strip()]
    return parts[:4] if parts else ["Подробности уточняются при оформлении заявки."]


def infer_subtitle(item: dict) -> str:
    text = item.get("fullDescription") or item.get("shortDescription") or ""
    sentence = re.split(r"(?<=[.!?])\s+", text.strip())[0] if text else ""
    if sentence and len(sentence) <= 90:
        return sentence
    category = item.get("category") or ""
    if item["type"] == "product":
        return category or "Ручная работа"
    return "Онлайн / по записи"


def infer_badge(item: dict) -> str:
    category = (item.get("category") or "").strip()
    if category:
        return category[:40]
    return "Из каталога"


def infer_availability(item: dict) -> str | None:
    if item["type"] != "product":
        return None
    text = f"{item.get('fullDescription', '')} {item.get('shortDescription', '')}".lower()
    if any(k in text for k in ("под заказ", "на заказ", "предзаказ")):
        return "Под заказ"
    if any(k in text for k in ("в наличии", "есть в наличии", "доступно")):
        return "В наличии"
    return "Под заказ"


def ts_string(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def to_catalog_item(item: dict) -> dict:
    accent, icon = pick_accent(item["title"], item.get("category", ""), item["type"])
    price = item.get("priceFrom")
    if price is None:
        price = 0
    catalog = {
        "id": item["id"],
        "slug": item["slug"],
        "type": item["type"],
        "title": item["title"],
        "category": item.get("category") or ("Товары" if item["type"] == "product" else "Услуги"),
        "subtitle": infer_subtitle(item),
        "description": item.get("shortDescription") or item.get("fullDescription") or item["title"],
        "price": int(price),
        "badge": infer_badge(item),
        "icon": icon,
        "accent": accent,
        "details": split_details(item.get("fullDescription", "")),
        "sourceUrl": item.get("sourceUrl"),
    }
    if item.get("images"):
        catalog["image"] = item["images"][0]
    if item["type"] == "product":
        catalog["availability"] = infer_availability(item)
    return catalog


def render_ts(items: list[dict], var_name: str) -> str:
    lines = [f"export const {var_name} = ["]
    for item in items:
        lines.append("  {")
        for key, value in item.items():
            if value is None:
                continue
            if isinstance(value, list):
                inner = ", ".join(ts_string(v) for v in value)
                lines.append(f"    {key}: [{inner}],")
            elif isinstance(value, (int, float)):
                lines.append(f"    {key}: {value},")
            else:
                lines.append(f"    {key}: {ts_string(value)},")
        lines.append("  },")
    lines.append("] as const;")
    return "\n".join(lines)


def integrate(clean_path: Path, output_path: Path) -> dict:
    data = json.loads(clean_path.read_text(encoding="utf-8"))
    services = [to_catalog_item(i) for i in data.get("items", []) if i["type"] == "service"]
    products = [to_catalog_item(i) for i in data.get("items", []) if i["type"] == "product"]

  # fallback to mock-like minimum if export empty
    if not services and not products:
        raise SystemExit("Clean catalog is empty. Run VK export first.")

    content = [
        "// Auto-generated from imports/vk/clean/catalog_clean.json — do not edit manually.",
        'import type { CatalogItem } from "@/lib/catalog-types";',
        "",
        f"export const services: CatalogItem[] = {json.dumps(services, ensure_ascii=False, indent=2)};",
        "",
        f"export const products: CatalogItem[] = {json.dumps(products, ensure_ascii=False, indent=2)};",
        "",
    ]
    output_path.write_text("\n".join(content), encoding="utf-8")
    return {"services": len(services), "products": len(products)}


def main() -> None:
    parser = argparse.ArgumentParser(description="Integrate clean VK catalog into TypeScript")
    parser.add_argument("--clean", type=Path, default=DEFAULT_CLEAN)
    parser.add_argument("--out", type=Path, default=OUTPUT)
    args = parser.parse_args()
    if not args.clean.exists():
        raise SystemExit(f"Clean catalog not found: {args.clean}")
    stats = integrate(args.clean, args.out)
    print(f"Generated {args.out} with {stats['services']} services and {stats['products']} products")


if __name__ == "__main__":
    main()
