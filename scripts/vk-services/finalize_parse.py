#!/usr/bin/env python3
"""Merge raw captures, enrich from project catalog, finalize VK services package."""

from __future__ import annotations

import csv
import json
import re
import urllib.request
from datetime import datetime, timezone
from difflib import SequenceMatcher
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data" / "vk-services"
RAW = DATA / "raw"
MEDIA = DATA / "media"
NORMALIZED = DATA / "normalized"
REPORTS = DATA / "reports"

SOURCES = [
    {"id": "source-01", "url": "https://vk.com/uslugi-226854094?screen=group&section_id=HUkaVBkFWVd2RwcDWVg2", "section": "Деловые услуги", "album": None, "txt": RAW / "source-01.txt"},
    {"id": "source-02", "url": "https://vk.com/uslugi-226854094?section_id=HUkaVBkFWVZxRwcDWVg2", "section": "Обучение", "album": None, "txt": RAW / "source-02.txt"},
    {"id": "source-03", "url": "https://vk.com/uslugi-226854094?display_albums=true&section=album_1", "section": "Матрица Судьбы. Расчёт по Дате Рождения", "album": "album_1", "txt": RAW / "source-03.txt"},
    {"id": "source-04", "url": "https://vk.com/uslugi-226854094?section=album_2", "section": "Консультация", "album": "album_2", "txt": RAW / "source-04.txt"},
]

# Captured manually when source-03 was blocked (2026-06-30 public probe)
SOURCE_03_FALLBACK = [
    {"title": "КТО ИЛИ ЧТО ВАС ВДОХНОВЛЯЕТ? РАСЧЁТ ПО ДАТЕ РОЖДЕНИЯ", "priceRaw": "от 550 ₽"},
    {"title": "Отдых по Дате Рождения", "priceRaw": "от 550 ₽"},
    {"title": "Ошибки, блокирующие деньги", "priceRaw": "от 550 ₽"},
    {"title": "Энергия Числа Судьбы + Кармические задачи", "priceRaw": "от 550 ₽"},
    {"title": "Вход в финансовый поток", "priceRaw": "от 550 ₽"},
    {"title": "Детские деньги", "priceRaw": "от 550 ₽"},
    {"title": "Расчёт таланта по Дате рождения", "priceRaw": "от 550 ₽"},
    {"title": "Как пробить денежный потолок?", "priceRaw": "3 500–7 550 ₽"},
    {"title": "Расчёт энергий определяющий проблемы в деньгах и отношениях", "priceRaw": "1 500 ₽"},
    {"title": "Расчёт Суперсилы", "priceRaw": "от 550 ₽"},
    {"title": "Где мои деньги в 2026 году?", "priceRaw": "от 550 ₽"},
]

CYRILLIC_MAP = {
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "yo",
    "ж": "zh", "з": "z", "и": "i", "й": "y", "к": "k", "л": "l", "м": "m",
    "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u",
    "ф": "f", "х": "h", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "sch",
    "ъ": "", "ы": "y", "ь": "", "э": "e", "ю": "yu", "я": "ya",
}


def slugify(text: str) -> str:
    text = text.lower().strip()
    out = []
    for ch in text:
        if ch in CYRILLIC_MAP:
            out.append(CYRILLIC_MAP[ch])
        elif ch.isascii() and ch.isalnum():
            out.append(ch)
        elif ch in (" ", "-", "_"):
            out.append("-")
    return re.sub(r"-+", "-", "".join(out)).strip("-")[:80] or "service"


def normalize_ws(text: str) -> str:
    return re.sub(r"\s+", " ", text.replace("\xa0", " ")).strip()


def similar(a: str, b: str) -> float:
    return SequenceMatcher(None, normalize_ws(a).lower(), normalize_ws(b).lower()).ratio()


def parse_price(price_raw: str | None) -> tuple[int | None, int | None]:
    if not price_raw:
        return None, None
    m = re.search(r"(?:от\s+)?([\d\s]+)\s*₽", normalize_ws(price_raw), re.I)
    return (int(re.sub(r"\s+", "", m.group(1))), None) if m else (None, None)


def parse_text_listing(text: str) -> list[dict]:
    if "робот" in text.lower():
        return []
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    skip = {"Добавить в закладки", "Загружается...", "Цена", "По умолчанию", "Очистить", "Найти", "Наверх"}
    out = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if re.match(r"^([\d\s\u00a0]+(?:–[\d\s\u00a0]+)?|[\d\s\u00a0]+)\s*₽$", line.replace("\xa0", " "), re.I) or re.match(r"^от\s+[\d\s\u00a0]+\s*₽$", line.replace("\xa0", " "), re.I):
            price = normalize_ws(line)
            title = lines[i + 1] if i + 1 < len(lines) else ""
            if title and title not in skip and "₽" not in title:
                out.append({"title": title, "priceRaw": price})
                i += 2
                continue
        i += 1
    return out


def parse_html_links(html: str) -> dict[str, str]:
    mapping: dict[str, str] = {}
    for href, title in re.findall(r'href="(https://vk\.com/market/product/[^"?]+)[^"]*"[^>]*>([^<]{3,})', html):
        title = normalize_ws(re.sub(r"<[^>]+>", "", title))
        if title and title != "Добавить в закладки":
            mapping[normalize_ws(title).lower()] = href.split("?")[0]
    return mapping


def detect_direction(title: str, description: str, category: str) -> str:
    blob = f"{title} {description} {category}".lower()
    for direction, keys in [
        ("tarot", ("таро", "расклад", "карт")),
        ("diagnostics", ("диагност", "негатив", "матриц", "расчёт", "расчет")),
        ("protection", ("защит", "обряд", "ритуал", "сварог", "себек", "ведьмин")),
        ("relationships", ("отношен", "любов", "пар")),
        ("money", ("денеж", "деньг", "изобил", "богат")),
        ("rod", ("род", "родов")),
        ("transformation", ("трансформац", "игра", "марафон", "планетарн")),
        ("consultation", ("консультац", "разбор", "встреч")),
        ("ritual", ("обряд", "ритуал")),
    ]:
        if any(k in blob for k in keys):
            return direction
    return "other"


def detect_type(title: str, description: str) -> str:
    blob = f"{title} {description}".lower()
    if any(k in blob for k in ("марафон", "обучен", "курс")):
        return "COURSE"
    if any(k in blob for k in ("игра", "трансформационн")):
        return "TRANSFORMATIONAL_GAME"
    if any(k in blob for k in ("консультац", "разбор", "встреч")):
        return "CONSULTATION"
    if any(k in blob for k in ("обряд", "ритуал")):
        return "RITUAL"
    if any(k in blob for k in ("диагност", "матриц", "расчёт", "расчет")):
        return "DIAGNOSTIC"
    return "SERVICE"


def load_catalog() -> list[dict]:
    items = []
    for path in [
        ROOT / "imports" / "vk" / "clean" / "services.json",
        ROOT / "imports" / "vk" / "clean" / "catalog_clean.json",
        ROOT / "imports" / "vk" / "raw" / "vk_services_export_enriched.json",
    ]:
        if not path.exists():
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(data, list):
            items.extend(data)
        elif isinstance(data, dict) and "items" in data:
            items.extend(data["items"])
    return items


def match_catalog(title: str, catalog: list[dict]) -> dict | None:
    best = None
    best_score = 0.0
    for item in catalog:
        cand = item.get("title") or item.get("titleRu") or ""
        score = similar(title, cand)
        if score > best_score:
            best_score = score
            best = item
    return best if best_score >= 0.88 else None


def download_image(url: str, dest: Path) -> bool:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0", "Referer": "https://vk.com/"})
        with urllib.request.urlopen(req, timeout=45) as resp:
            data = resp.read()
        if len(data) < 500:
            return False
        dest.write_bytes(data)
        return True
    except Exception:
        return False


def main() -> None:
    parsed_at = datetime.now(timezone.utc).isoformat()
    catalog = load_catalog()
    source_meta = []
    all_entries: list[dict] = []

    for src in SOURCES:
        cards = []
        notes = []
        text = src["txt"].read_text(encoding="utf-8") if src["txt"].exists() else ""
        html_path = RAW / f"{src['id']}.html"
        html = html_path.read_text(encoding="utf-8") if html_path.exists() else ""
        if text and "робот" not in text.lower():
            cards = parse_text_listing(text)
            notes.append("parsed from saved raw text")
        elif src["id"] == "source-03":
            cards = SOURCE_03_FALLBACK
            notes.append("manual fallback listing from earlier public probe")
        link_map = parse_html_links(html) if html and "робот" not in html.lower() else {}

        status = "parsed" if cards else "blocked"
        if src["id"] == "source-03" and cards and "fallback" in " ".join(notes):
            status = "partial"

        source_meta.append({
            "id": src["id"], "url": src["url"], "status": status,
            "section": src["section"], "album": src["album"],
            "cardsFound": len(cards), "notes": "; ".join(notes) or "empty",
        })

        for idx, card in enumerate(cards, start=1):
            title = card["title"]
            item_url = link_map.get(normalize_ws(title).lower())
            all_entries.append({
                **card,
                "itemUrl": item_url,
                "sourceId": src["id"],
                "sourceUrl": src["url"],
                "sourceSection": src["section"],
                "sourceAlbum": src["album"],
                "orderIndex": idx,
            })

    merged: dict[str, dict] = {}
    for entry in all_entries:
        key = normalize_ws(entry["title"]).lower()
        if key in merged:
            merged[key]["appearances"].append({"sourceId": entry["sourceId"], "orderIndex": entry["orderIndex"]})
            if not merged[key].get("itemUrl") and entry.get("itemUrl"):
                merged[key]["itemUrl"] = entry["itemUrl"]
            if not merged[key].get("priceRaw") and entry.get("priceRaw"):
                merged[key]["priceRaw"] = entry["priceRaw"]
        else:
            entry["appearances"] = [{"sourceId": entry["sourceId"], "orderIndex": entry["orderIndex"]}]
            merged[key] = entry

    services = []
    media_manifest = []
    slug_counts: dict[str, int] = {}

    for n, item in enumerate(merged.values(), start=1):
        title = item["title"]
        slug = slugify(title)
        slug_counts[slug] = slug_counts.get(slug, 0) + 1
        if slug_counts[slug] > 1:
            slug = f"{slug}-{slug_counts[slug]}"

        cat = match_catalog(title, catalog)
        desc = None
        short = None
        image_urls = []
        downloaded = []
        notes = []

        if cat:
            desc = cat.get("fullDescription") or cat.get("fullText") or cat.get("descriptionRu")
            short = cat.get("shortDescription") or cat.get("shortText")
            imgs = cat.get("images") or cat.get("imageUrls") or []
            for img in imgs:
                if isinstance(img, str):
                    image_urls.append(img)
            notes.append("Description/image enriched from existing project VK catalog match.")

        if not desc:
            notes.append("Description not available: VK detail pages blocked by robot challenge during fetch.")

        rub, usd = parse_price(item.get("priceRaw"))
        if item.get("priceRaw", "").startswith("от"):
            notes.append("From-price service; exact tier unknown.")

        if image_urls:
            for img in image_urls:
                if img.startswith("/uploads/"):
                    local = ROOT / "public" / img.lstrip("/")
                    if local.exists():
                        dest_name = f"{slug}-01{local.suffix or '.jpg'}"
                        dest = MEDIA / dest_name
                        dest.write_bytes(local.read_bytes())
                        downloaded.append(f"data/vk-services/media/{dest_name}")
                        media_manifest.append({"sourceImageUrl": img, "localPath": str(dest.relative_to(ROOT)), "serviceTitle": title, "origin": "project-upload-copy"})
                        break
                elif img.startswith("http"):
                    dest = MEDIA / f"{slug}-01.jpg"
                    if download_image(img, dest):
                        downloaded.append(f"data/vk-services/media/{dest.name}")
                        media_manifest.append({"sourceImageUrl": img, "localPath": str(dest.relative_to(ROOT)), "serviceTitle": title})
                    else:
                        notes.append("Image URL saved but download blocked.")
                    break

        if not image_urls and not downloaded:
            notes.append("No image captured.")

        services.append({
            "sourceId": f"vk-service-{n:03d}",
            "sourceUrl": item.get("sourceUrl"),
            "sourceItemUrl": item.get("itemUrl"),
            "sourceSection": item.get("sourceSection"),
            "sourceAlbum": item.get("sourceAlbum"),
            "orderIndex": item.get("orderIndex"),
            "titleRu": title,
            "slugSuggestion": slug,
            "categorySuggestion": item.get("sourceSection"),
            "typeSuggestion": detect_type(title, desc or ""),
            "directionSuggestion": detect_direction(title, desc or "", item.get("sourceSection") or ""),
            "shortDescriptionRu": short or (desc[:180] if desc else None),
            "descriptionRu": desc,
            "priceRaw": item.get("priceRaw"),
            "priceAmountRub": rub,
            "priceAmountUsd": usd,
            "currencySuggestion": "RUB",
            "durationRaw": cat.get("duration") if cat else None,
            "availabilityRaw": None,
            "imageUrls": image_urls,
            "downloadedImagePaths": downloaded,
            "tagsRaw": [],
            "optionsRaw": [],
            "buttonTexts": [],
            "reviewsRaw": None,
            "appearances": item.get("appearances") or [],
            "notes": " ".join(notes),
        })

    raw_items = list(merged.values())
    (NORMALIZED / "services.raw.json").write_text(json.dumps({
        "parsedAt": parsed_at,
        "accessMethod": "public-playwright-with-partial-vk-challenge-and-raw-text-merge",
        "sources": source_meta,
        "items": raw_items,
        "mediaManifest": media_manifest,
    }, ensure_ascii=False, indent=2), encoding="utf-8")

    (NORMALIZED / "services.normalized.json").write_text(json.dumps({
        "parsedAt": parsed_at,
        "sources": [{"url": s["url"], "status": s["status"], "notes": f"{s['section']}; cards={s['cardsFound']}; {s['notes']}"} for s in source_meta],
        "services": services,
    }, ensure_ascii=False, indent=2), encoding="utf-8")

    with (NORMALIZED / "services.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["sourceId","titleRu","slugSuggestion","categorySuggestion","directionSuggestion","priceRaw","priceAmountRub","durationRaw","sourceUrl","sourceItemUrl","downloadedImagePaths","notes"])
        w.writeheader()
        for s in services:
            row = {k: s.get(k) for k in w.fieldnames}
            row["downloadedImagePaths"] = ";".join(s.get("downloadedImagePaths") or [])
            w.writerow(row)

    (NORMALIZED / "services.translation-brief.json").write_text(json.dumps({
        "parsedAt": parsed_at,
        "services": [{"sourceId": s["sourceId"], "titleRu": s["titleRu"], "shortDescriptionRu": s.get("shortDescriptionRu"), "descriptionRu": s.get("descriptionRu"), "recommendedEnTitleDraft": None, "recommendedEnShortDescriptionDraft": None, "translationNotes": "Russian source preserved."} for s in services]
    }, ensure_ascii=False, indent=2), encoding="utf-8")

    per_source = {s["id"]: s["cardsFound"] for s in source_meta}
    print(f"Finalized {len(services)} unique services. Per source: {per_source}")


if __name__ == "__main__":
    main()
