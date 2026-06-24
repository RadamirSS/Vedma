#!/usr/bin/env python3
"""Download and validate VK catalog images."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from io import BytesIO
from pathlib import Path
from urllib.parse import urlparse

import urllib.request

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_RAW = ROOT / "imports" / "vk" / "raw" / "vk_services_export.json"
DEFAULT_MANIFEST = ROOT / "imports" / "vk" / "clean" / "image_manifest.json"
UPLOADS = ROOT / "public" / "uploads" / "vk"

MIN_BYTES = 4096
MIN_WIDTH = 120
MIN_HEIGHT = 120

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
)
REFERER = "https://vk.com/"

PLACEHOLDER_PATTERNS = [
    re.compile(r"camera_", re.I),
    re.compile(r"deactivated_", re.I),
    re.compile(r"stub", re.I),
    re.compile(r"placeholder", re.I),
    re.compile(r"/images/blank", re.I),
]


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


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


def guess_extension(url: str, content_type: str | None) -> str:
    path = urlparse(url).path.lower()
    for ext in (".jpg", ".jpeg", ".png", ".webp", ".gif"):
        if path.endswith(ext):
            return ".jpg" if ext == ".jpeg" else ext
    if content_type:
        if "png" in content_type:
            return ".png"
        if "webp" in content_type:
            return ".webp"
        if "gif" in content_type:
            return ".gif"
    return ".jpg"


def is_placeholder_url(url: str) -> bool:
    return any(p.search(url) for p in PLACEHOLDER_PATTERNS)


def fetch_image(url: str) -> tuple[bytes | None, str | None, str | None]:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": USER_AGENT, "Referer": REFERER},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = resp.read()
            content_type = resp.headers.get("Content-Type")
            return data, content_type, None
    except Exception as exc:
        return None, None, str(exc)


def image_dimensions(data: bytes) -> tuple[int | None, int | None]:
    try:
        from PIL import Image
    except ImportError:
        return None, None
    try:
        with Image.open(BytesIO(data)) as img:
            return img.size
    except Exception:
        return None, None


def is_grey_placeholder(data: bytes) -> bool:
    try:
        from PIL import Image
        import statistics
    except ImportError:
        return False
    try:
        with Image.open(BytesIO(data)) as img:
            img = img.convert("L").resize((32, 32))
            pixels = list(img.getdata())
            if not pixels:
                return True
            stdev = statistics.pstdev(pixels)
            mean = statistics.mean(pixels)
            return stdev < 8 and 100 < mean < 200
    except Exception:
        return False


def classify_type(item: dict) -> str:
    section = (item.get("sourceSection") or "").lower()
    text = " ".join(
        [
            item.get("title", ""),
            item.get("category", ""),
            item.get("fullText", ""),
            item.get("shortText", ""),
        ]
    ).lower()
    service_keywords = ("диагност", "расклад", "таро", "игр", "консульт", "практик", "прогноз")
    product_keywords = (
        "свеч", "амулет", "оберег", "браслет", "набор", "камн", "ритуал", "товар",
        "подставк", "покрывал", "коробок", "шоппер", "алтар"
    )
    if section == "services" or any(k in text for k in service_keywords):
        if not any(k in text for k in product_keywords):
            return "services"
    if section == "products" or any(k in text for k in product_keywords):
        return "products"
    return "services"


def fetch(url: str) -> str:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": USER_AGENT, "Referer": REFERER},
    )
    with urllib.request.urlopen(req, timeout=45) as resp:
        return resp.read().decode("utf-8", errors="ignore")


def enrich_image_urls_from_page(card_url: str) -> list[str]:
    try:
        html = fetch(card_url)
    except Exception:
        return []
    if "робот" in html[:5000] or "запросы" in html[:5000]:
        return []
    urls = re.findall(r"https://[^\"'\s>]+(?:userapi|mycdn)[^\"'\s>]+", html)
    return [u.replace("&amp;", "&") for u in dict.fromkeys(urls)]


def download_images(raw_path: Path, manifest_path: Path) -> dict:
    raw = load_json(raw_path)
    items = raw.get("items", [])
    manifest = {
        "generatedAt": raw.get("exportedAt"),
        "source": str(raw_path),
        "stats": {
            "downloaded": 0,
            "skipped": 0,
            "failed": 0,
            "duplicates": 0,
            "placeholders": 0,
        },
        "items": [],
    }
    seen_hashes: dict[str, str] = {}
    slug_counts: dict[str, int] = {}

    for item in items:
        title = item.get("title", "Без названия")
        base_slug = transliterate_slug(title)
        slug_counts[base_slug] = slug_counts.get(base_slug, 0) + 1
        slug = base_slug if slug_counts[base_slug] == 1 else f"{base_slug}-{slug_counts[base_slug]}"
        item_type = classify_type(item)
        out_dir = UPLOADS / item_type / slug
        out_dir.mkdir(parents=True, exist_ok=True)

        entry = {
            "title": title,
            "slug": slug,
            "type": item_type,
            "sourceUrl": item.get("cardUrl"),
            "images": [],
            "skipped": [],
            "failed": [],
        }

        urls = item.get("imageUrls") or []
        if not urls:
            urls = enrich_image_urls_from_page(item.get("cardUrl", ""))
        for idx, url in enumerate(urls):
            if not url or is_placeholder_url(url):
                manifest["stats"]["placeholders"] += 1
                entry["skipped"].append({"url": url, "reason": "placeholder_url"})
                continue

            data, content_type, error = fetch_image(url)
            if error or not data:
                manifest["stats"]["failed"] += 1
                entry["failed"].append({"url": url, "reason": error or "empty"})
                continue

            if len(data) < MIN_BYTES:
                manifest["stats"]["skipped"] += 1
                entry["skipped"].append({"url": url, "reason": f"too_small_{len(data)}b"})
                continue

            digest = hashlib.sha256(data).hexdigest()
            if digest in seen_hashes:
                manifest["stats"]["duplicates"] += 1
                entry["skipped"].append({"url": url, "reason": f"duplicate_of_{seen_hashes[digest]}"})
                continue

            width, height = image_dimensions(data)
            if width and height and (width < MIN_WIDTH or height < MIN_HEIGHT):
                manifest["stats"]["skipped"] += 1
                entry["skipped"].append({"url": url, "reason": f"too_small_{width}x{height}"})
                continue

            if is_grey_placeholder(data):
                manifest["stats"]["placeholders"] += 1
                entry["skipped"].append({"url": url, "reason": "grey_placeholder"})
                continue

            ext = guess_extension(url, content_type)
            filename = "cover" + ext if idx == 0 else f"gallery-{idx:02d}{ext}"
            target = out_dir / filename
            target.write_bytes(data)
            seen_hashes[digest] = str(target.relative_to(ROOT))
            public_path = "/" + str(target.relative_to(ROOT / "public")).replace("\\", "/")
            entry["images"].append(public_path)
            manifest["stats"]["downloaded"] += 1

        item["_slug"] = slug
        item["_type"] = item_type
        manifest["items"].append(entry)

    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    enriched_raw = raw_path.with_name("vk_services_export_enriched.json")
    enriched_raw.write_text(json.dumps(raw, ensure_ascii=False, indent=2), encoding="utf-8")
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser(description="Download VK catalog images")
    parser.add_argument("--raw", type=Path, default=DEFAULT_RAW)
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    args = parser.parse_args()
    if not args.raw.exists():
        raise SystemExit(f"Raw export not found: {args.raw}")
    manifest = download_images(args.raw, args.manifest)
    print(json.dumps(manifest["stats"], indent=2))


if __name__ == "__main__":
    main()
