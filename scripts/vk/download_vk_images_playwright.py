#!/usr/bin/env python3
"""Download VK catalog images using Playwright authenticated session."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import time
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path

import sys

VK_SCRIPTS = Path(__file__).resolve().parent
if str(VK_SCRIPTS) not in sys.path:
    sys.path.insert(0, str(VK_SCRIPTS))
from normalize_vk_catalog import classify_type  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
PROFILE = ROOT / ".vk-browser-profile"
DEFAULT_RAW = ROOT / "imports" / "vk" / "raw" / "vk_services_export.json"
DEFAULT_MANIFEST = ROOT / "imports" / "vk" / "clean" / "image_manifest.json"
UPLOADS = ROOT / "public" / "uploads" / "vk"

MIN_BYTES = 4096
MIN_WIDTH = 120
MIN_HEIGHT = 120
PAGE_DELAY_SEC = 5.0
COOLDOWN_SEC = 90

PLACEHOLDER_PATTERNS = [
    re.compile(r"camera_", re.I),
    re.compile(r"deactivated_", re.I),
    re.compile(r"stub", re.I),
    re.compile(r"placeholder", re.I),
]


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


def classify_storage_type(item: dict) -> str:
    item_type, _ = classify_type(item)
    return "products" if item_type == "product" else "services"


def is_placeholder_url(url: str) -> bool:
    return not url or any(p.search(url) for p in PLACEHOLDER_PATTERNS) or "avatar" in url.lower()


def best_image_url(url: str) -> str:
    url = url.replace("&amp;", "&")
    url = re.sub(r"size=0x180", "size=1047x1297", url)
    url = re.sub(r"([?&])cs=\d+x\d+", r"\1cs=1047x1297", url)
    return url


def is_grey_placeholder(data: bytes) -> bool:
    try:
        from PIL import Image
        import statistics

        with Image.open(BytesIO(data)) as img:
            img = img.convert("L").resize((32, 32))
            pixels = list(img.getdata())
            if not pixels:
                return True
            return statistics.pstdev(pixels) < 8 and 100 < statistics.mean(pixels) < 200
    except Exception:
        return False


def image_dimensions(data: bytes) -> tuple[int | None, int | None]:
    try:
        from PIL import Image

        with Image.open(BytesIO(data)) as img:
            return img.size
    except Exception:
        return None, None


def merge_manifest(existing: dict, updated: dict, all_items: list[dict] | None = None) -> dict:
    updated_by_url = {e.get("sourceUrl"): e for e in updated.get("items", []) if e.get("sourceUrl")}
    existing_by_url = {e.get("sourceUrl"): e for e in existing.get("items", []) if e.get("sourceUrl")}
    merged_items: list[dict] = []
    source_items = all_items or existing.get("items", [])
    if all_items:
        for item in all_items:
            url = item.get("cardUrl", "")
            entry = updated_by_url.get(url) or existing_by_url.get(url)
            if entry:
                merged_items.append(entry)
            else:
                merged_items.append({"title": item.get("title", ""), "sourceUrl": url, "images": [], "failed": []})
    else:
        for entry in existing.get("items", []):
            url = entry.get("sourceUrl")
            if url and url in updated_by_url and updated_by_url[url].get("images"):
                merged_items.append({**entry, **updated_by_url[url]})
            else:
                merged_items.append(entry)
        for url, entry in updated_by_url.items():
            if url not in existing_by_url:
                merged_items.append(entry)
    stats = {
        "downloaded": sum(1 for e in merged_items if e.get("images")),
        "failed": sum(1 for e in merged_items if not e.get("images")),
        "skipped": existing.get("stats", {}).get("skipped", 0) + updated.get("stats", {}).get("skipped", 0),
        "duplicates": existing.get("stats", {}).get("duplicates", 0) + updated.get("stats", {}).get("duplicates", 0),
        "placeholders": existing.get("stats", {}).get("placeholders", 0) + updated.get("stats", {}).get("placeholders", 0),
        "captcha_blocked": existing.get("stats", {}).get("captcha_blocked", 0) + updated.get("stats", {}).get("captcha_blocked", 0),
    }
    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "source": updated.get("source") or existing.get("source"),
        "method": updated.get("method") or existing.get("method"),
        "stats": stats,
        "items": merged_items,
    }


def scrape_and_download(
    raw_path: Path,
    manifest_path: Path,
    headed: bool = False,
    limit: int | None = None,
    retry_failed: bool = False,
    merge: bool = False,
) -> dict:
    from playwright.sync_api import sync_playwright

    raw = json.loads(raw_path.read_text(encoding="utf-8"))
    items = raw.get("items", [])
    existing_manifest: dict = {}
    if merge and manifest_path.exists():
        existing_manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if retry_failed and existing_manifest:
        failed_urls = {
            e.get("sourceUrl")
            for e in existing_manifest.get("items", [])
            if e.get("sourceUrl") and not e.get("images")
        }
        items = [i for i in items if i.get("cardUrl") in failed_urls]
        print(f"Retrying {len(items)} items without images")
    if limit:
        items = items[:limit]

    PROFILE.mkdir(parents=True, exist_ok=True)
    manifest = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "source": str(raw_path),
        "method": "playwright_authenticated_session",
        "stats": {
            "downloaded": 0,
            "skipped": 0,
            "failed": 0,
            "duplicates": 0,
            "placeholders": 0,
            "captcha_blocked": 0,
        },
        "items": [],
    }
    seen_hashes: set[str] = set()
    slug_counts: dict[str, int] = {}

    print(f"Cooldown {COOLDOWN_SEC}s before VK requests...")
    time.sleep(COOLDOWN_SEC)

    with sync_playwright() as p:
        context = p.chromium.launch_persistent_context(
            str(PROFILE),
            headless=not headed,
            locale="ru-RU",
            viewport={"width": 1400, "height": 900},
            args=["--disable-blink-features=AutomationControlled"],
        )
        page = context.pages[0] if context.pages else context.new_page()
        page.goto("https://vk.com/market-226854094", wait_until="domcontentloaded", timeout=90000)
        time.sleep(6)
        market_blocked = "challenge" in page.url

        for idx, item in enumerate(items, start=1):
            title = item.get("title", "Без названия")
            card_url = item.get("cardUrl", "")
            base_slug = transliterate_slug(title)
            slug_counts[base_slug] = slug_counts.get(base_slug, 0) + 1
            slug = base_slug if slug_counts[base_slug] == 1 else f"{base_slug}-{slug_counts[base_slug]}"
            item_type = classify_storage_type(item)
            out_dir = UPLOADS / item_type / slug
            out_dir.mkdir(parents=True, exist_ok=True)

            entry = {
                "title": title,
                "slug": slug,
                "type": item_type,
                "sourceUrl": card_url,
                "images": [],
                "skipped": [],
                "failed": [],
            }

            print(f"[{idx}/{len(items)}] {title}")
            img_url = ""

            if card_url and not market_blocked:
                try:
                    page.goto(card_url, wait_until="domcontentloaded", timeout=60000)
                    time.sleep(PAGE_DELAY_SEC)
                    if "challenge" in page.url:
                        manifest["stats"]["captcha_blocked"] += 1
                        entry["failed"].append({"url": card_url, "reason": "captcha"})
                    else:
                        urls = page.evaluate(
                            """() => [...document.querySelectorAll('img')]
                              .map(i => i.currentSrc || i.src)
                              .filter(s => /userapi|impg|mycdn/.test(s) && !/(camera_|avatar|deactivated_)/.test(s))"""
                        )
                        if urls:
                            img_url = best_image_url(urls[0])
                except Exception as exc:
                    entry["failed"].append({"url": card_url, "reason": str(exc)})

            if img_url and not is_placeholder_url(img_url):
                resp = context.request.get(img_url, headers={"Referer": "https://vk.com/"})
                if resp.ok:
                    data = resp.body()
                    if len(data) >= MIN_BYTES and not is_grey_placeholder(data):
                        width, height = image_dimensions(data)
                        if not width or (width >= MIN_WIDTH and height and height >= MIN_HEIGHT):
                            digest = hashlib.sha256(data).hexdigest()
                            if digest not in seen_hashes:
                                seen_hashes.add(digest)
                                target = out_dir / "cover.jpg"
                                target.write_bytes(data)
                                public_path = "/" + str(target.relative_to(ROOT / "public")).replace("\\", "/")
                                entry["images"].append(public_path)
                                manifest["stats"]["downloaded"] += 1
                                print(f"  saved {public_path}")
                            else:
                                manifest["stats"]["duplicates"] += 1
                        else:
                            manifest["stats"]["skipped"] += 1
                    else:
                        manifest["stats"]["placeholders"] += 1
                else:
                    manifest["stats"]["failed"] += 1
            elif not entry["failed"]:
                manifest["stats"]["failed"] += 1

            manifest["items"].append(entry)
            time.sleep(1.5)

        context.close()

    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    if merge and existing_manifest:
        manifest = merge_manifest(existing_manifest, manifest, raw.get("items", []))
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--raw", type=Path, default=DEFAULT_RAW)
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--headed", action="store_true")
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--retry-failed", action="store_true", help="Only download items missing images in manifest")
    parser.add_argument("--merge", action="store_true", help="Merge results into existing manifest instead of replacing")
    args = parser.parse_args()
    manifest = scrape_and_download(
        args.raw,
        args.manifest,
        headed=args.headed,
        limit=args.limit,
        retry_failed=args.retry_failed,
        merge=args.merge,
    )
    print(json.dumps(manifest["stats"], indent=2))


if __name__ == "__main__":
    main()
