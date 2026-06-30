#!/usr/bin/env python3
"""Resilient VK uslugi parser — text-first listing, slow detail fetch."""

from __future__ import annotations

import csv
import json
import re
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data" / "vk-services"
RAW = DATA / "raw"
SCREENSHOTS = DATA / "screenshots"
MEDIA = DATA / "media"
NORMALIZED = DATA / "normalized"
REPORTS = DATA / "reports"

SOURCES = [
    {"id": "source-01", "url": "https://vk.com/uslugi-226854094?screen=group&section_id=HUkaVBkFWVd2RwcDWVg2", "section": "Деловые услуги", "album": None},
    {"id": "source-02", "url": "https://vk.com/uslugi-226854094?section_id=HUkaVBkFWVZxRwcDWVg2", "section": "Обучение", "album": None},
    {"id": "source-03", "url": "https://vk.com/uslugi-226854094?display_albums=true&section=album_1", "section": "Матрица Судьбы. Расчёт по Дате Рождения", "album": "album_1"},
    {"id": "source-04", "url": "https://vk.com/uslugi-226854094?section=album_2", "section": "Консультация", "album": "album_2"},
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


def parse_price(price_raw: str | None) -> tuple[int | None, int | None, str]:
    if not price_raw:
        return None, None, "RUB"
    m = re.search(r"(?:от\s+)?([\d\s]+)\s*₽", normalize_ws(price_raw), re.I)
    return (int(re.sub(r"\s+", "", m.group(1))), None, "RUB") if m else (None, None, "RUB")


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


def parse_text_listing(text: str) -> list[dict[str, Any]]:
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    skip = {"Добавить в закладки", "Загружается...", "Цена", "По умолчанию", "Очистить", "Найти"}
    out: list[dict[str, Any]] = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if re.match(r"^(от\s+)?[\d\s\u00a0]+\s*₽$", line.replace("\xa0", " "), re.I):
            price = normalize_ws(line)
            title = lines[i + 1] if i + 1 < len(lines) else ""
            if title and title not in skip and not re.match(r"^(от\s+)?[\d\s\u00a0]+\s*₽$", title.replace("\xa0", " ")):
                out.append({"title": title, "priceRaw": price, "itemUrl": None, "imageUrl": None})
                i += 2
                continue
        i += 1
    return out


def parse_link_listing(page) -> list[dict[str, Any]]:
    return page.evaluate(
        """() => {
      const normalize = (s) => (s || '').replace(/\\s+/g, ' ').trim();
      const byUrl = new Map();
      document.querySelectorAll('a[href*="market/product"]').forEach((a) => {
        const href = a.href.split('?')[0];
        const text = normalize(a.textContent);
        if (!text || text === 'Добавить в закладки') return;
        const img = a.querySelector('img')?.src || a.closest('div')?.querySelector('img')?.src || null;
        const pm = text.match(/(от\\s+)?([\\d\\s]+)\\s*₽/i);
        const title = text.replace(/(от\\s+)?[\\d\\s]+\\s*₽/g, '').trim() || text;
        const price = pm ? pm[0].replace(/\\s+/g, ' ').trim() : null;
        const cur = byUrl.get(href) || { itemUrl: href, title: '', priceRaw: null, imageUrl: null };
        if (title && title !== 'Добавить в закладки' && title.length > cur.title.length) cur.title = title;
        if (price && !cur.priceRaw) cur.priceRaw = price;
        if (img && !cur.imageUrl) cur.imageUrl = img;
        byUrl.set(href, cur);
      });
      return Array.from(byUrl.values()).filter((c) => c.title);
    }"""
    )


def is_blocked(text: str) -> bool:
    low = text.lower()
    return "не робот" in low or "робот" in low[:200] or len(text) < 300


def scroll_and_load(page, rounds: int = 25) -> None:
    for _ in range(rounds):
        for label in ("Закрыть", "Продолжить", "Понятно"):
            btn = page.get_by_role("button", name=label)
            if btn.count():
                try:
                    btn.first.click(timeout=500)
                except Exception:
                    pass
        show = page.get_by_text("Показать ещё", exact=False)
        if show.count() and show.first.is_visible():
            try:
                show.first.click()
                page.wait_for_timeout(800)
            except Exception:
                pass
        prev = page.evaluate("document.body.scrollHeight")
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(650)
        if page.evaluate("document.body.scrollHeight") == prev:
            break


def parse_detail(page, url: str) -> dict[str, Any]:
    try:
        page.goto(url, wait_until="domcontentloaded", timeout=60000)
        page.wait_for_timeout(2000)
        text = page.inner_text("body")
        if is_blocked(text):
            return {"blocked": True}
    except Exception as exc:
        return {"error": str(exc)}

    return page.evaluate(
        """() => {
      const normalize = (s) => (s || '').replace(/\\s+/g, ' ').trim();
      const body = document.body.innerText;
      const title = normalize(document.querySelector('h1')?.textContent);
      const priceMatch = body.match(/(от\\s+)?([\\d\\s]+)\\s*₽/);
      const priceRaw = priceMatch ? priceMatch[0].replace(/\\s+/g, ' ').trim() : null;
      const idx = body.indexOf('Описание');
      let description = '';
      if (idx >= 0) {
        const tail = body.slice(idx + 'Описание'.length);
        const end = tail.search(/Показать|Пожаловаться|Комментарии|О продавце/);
        description = normalize(end > 0 ? tail.slice(0, end) : tail.slice(0, 2500));
      }
      const images = [...new Set([...document.querySelectorAll('img')].map(i => i.src)
        .filter(s => s && /userapi|mycdn|vkuserphoto|sun\\d+-/.test(s) && !/emoji|icon|camera/.test(s)))];
      const durationMatch = description.match(/(\\d+\\s*(?:час|ч\\.?|мин|минут)[^.\\n]{0,40})/i);
      return { title, priceRaw, descriptionRu: description, durationRaw: durationMatch?.[1] || null, imageUrls: images.slice(0,8),
        availabilityRaw: body.includes('Обычно отвечает') ? 'Обычно отвечает за несколько часов' : null,
        buttonTexts: [...document.querySelectorAll('button,a[role=button]')].map(e => normalize(e.textContent)).filter(Boolean).slice(0,8) };
    }"""
    )


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


def merge(a: dict, b: dict) -> dict:
    out = {**a, **b}
    for k in ("title", "priceRaw", "descriptionRu", "durationRaw"):
        if not out.get(k):
            out[k] = a.get(k) or b.get(k)
    imgs = list(dict.fromkeys((b.get("imageUrls") or []) + ([a["imageUrl"]] if a.get("imageUrl") else [])))
    out["imageUrls"] = [u for u in imgs if u]
    return out


def main() -> None:
    from playwright.sync_api import sync_playwright

    for d in (RAW, SCREENSHOTS, MEDIA, NORMALIZED, REPORTS):
        d.mkdir(parents=True, exist_ok=True)

    parsed_at = datetime.now(timezone.utc).isoformat()
    source_meta: list[dict] = []
    all_listings: list[dict] = []
    access_notes = []

    print("Waiting 90s for VK rate limit cooldown...")
    time.sleep(90)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(locale="ru-RU", viewport={"width": 1400, "height": 1200})

        for src in SOURCES:
            sid = src["id"]
            print(f"Listing {sid}...")
            notes = []
            cards: list[dict] = []
            try:
                page.goto(src["url"], wait_until="domcontentloaded", timeout=90000)
                page.wait_for_timeout(5000)
                scroll_and_load(page)
                html = page.content()
                text = page.inner_text("body")
                page.screenshot(path=str(SCREENSHOTS / f"{sid}.png"), full_page=True)
                (RAW / f"{sid}.html").write_text(html, encoding="utf-8")
                (RAW / f"{sid}.txt").write_text(text, encoding="utf-8")

                if is_blocked(text):
                    notes.append("VK robot challenge shown")
                    (RAW / f"{sid}-extraction-notes.md").write_text(
                        f"# {sid}\n\n- Login/challenge gated during automated fetch\n- Saved screenshot/HTML/text for evidence\n- Section: {src['section']}\n",
                        encoding="utf-8",
                    )
                else:
                    link_cards = parse_link_listing(page)
                    text_cards = parse_text_listing(text)
                    cards = link_cards if len(link_cards) >= len(text_cards) else text_cards
                    if link_cards and text_cards:
                        by_title = {normalize_ws(c["title"]).lower(): c for c in text_cards if c.get("title")}
                        for lc in link_cards:
                            t = normalize_ws(lc.get("title", "")).lower()
                            if t in by_title and not lc.get("priceRaw"):
                                lc["priceRaw"] = by_title[t].get("priceRaw")
                    notes.append("public Playwright")

                for idx, card in enumerate(cards, start=1):
                    all_listings.append({**card, "sourceId": sid, "sourceUrl": src["url"], "sourceSection": src["section"], "sourceAlbum": src["album"], "orderIndex": idx})

                source_meta.append({"id": sid, "url": src["url"], "status": "parsed" if cards else ("blocked" if is_blocked(text) else "partial"), "section": src["section"], "album": src["album"], "cardsFound": len(cards), "notes": "; ".join(notes) or "ok"})
                print(f"  {len(cards)} cards")
                time.sleep(8)
            except Exception as exc:
                source_meta.append({"id": sid, "url": src["url"], "status": "blocked", "section": src["section"], "album": src["album"], "cardsFound": 0, "notes": str(exc)})
                access_notes.append(str(exc))

        url_map: dict[str, dict] = {}
        title_map: dict[str, dict] = {}
        for item in all_listings:
            key = item.get("itemUrl") or f"title:{normalize_ws(item.get('title','')).lower()}"
            if key in url_map:
                url_map[key]["appearances"] = url_map[key].get("appearances", []) + [{"sourceId": item["sourceId"], "orderIndex": item["orderIndex"]}]
                for f in ("itemUrl", "priceRaw", "imageUrl", "title"):
                    if not url_map[key].get(f) and item.get(f):
                        url_map[key][f] = item[f]
            else:
                item["appearances"] = [{"sourceId": item["sourceId"], "orderIndex": item["orderIndex"]}]
                url_map[key] = item

        unique = list(url_map.values())
        print(f"Details for {len(unique)} unique items...")
        detail_page = browser.new_page(locale="ru-RU")
        raw_items = []
        for i, listing in enumerate(unique, 1):
            detail = {}
            if listing.get("itemUrl"):
                detail = parse_detail(detail_page, listing["itemUrl"])
                if i % 15 == 0:
                    print(f"  detail {i}/{len(unique)}")
                time.sleep(2.5)
            merged = merge(listing, detail)
            merged["sourceItemUrl"] = listing.get("itemUrl")
            raw_items.append(merged)

        browser.close()

    media_manifest = []
    services = []
    slug_counts: dict[str, int] = {}

    for n, item in enumerate(raw_items, 1):
        title = normalize_ws(item.get("title") or "")
        slug = slugify(title)
        slug_counts[slug] = slug_counts.get(slug, 0) + 1
        if slug_counts[slug] > 1:
            slug = f"{slug}-{slug_counts[slug]}"
        desc = normalize_ws(item.get("descriptionRu") or "")
        rub, usd, cur = parse_price(item.get("priceRaw"))
        imgs = list(dict.fromkeys(item.get("imageUrls") or []))
        downloaded = []
        if imgs:
            ext = ".webp" if ".webp" in imgs[0].lower() else ".png" if ".png" in imgs[0].lower() else ".jpg"
            fname = f"{slug}-01{ext}"
            dest = MEDIA / fname
            if download_image(imgs[0], dest):
                downloaded.append(f"data/vk-services/media/{fname}")
                media_manifest.append({"sourceImageUrl": imgs[0], "localPath": str(dest.relative_to(ROOT)), "serviceTitle": title})
            time.sleep(0.2)

        notes = []
        if item.get("blocked"):
            notes.append("Detail blocked by VK challenge; listing fields kept.")
        if len(item.get("appearances", [])) > 1:
            notes.append(f"In {len(item['appearances'])} sources.")

        services.append({
            "sourceId": f"vk-service-{n:03d}",
            "sourceUrl": item.get("sourceUrl"), "sourceItemUrl": item.get("sourceItemUrl"),
            "sourceSection": item.get("sourceSection"), "sourceAlbum": item.get("sourceAlbum"),
            "orderIndex": item.get("orderIndex"), "titleRu": title, "slugSuggestion": slug,
            "categorySuggestion": item.get("sourceSection"), "typeSuggestion": detect_type(title, desc),
            "directionSuggestion": detect_direction(title, desc, item.get("sourceSection") or ""),
            "shortDescriptionRu": desc[:180] if desc else None, "descriptionRu": desc or None,
            "priceRaw": item.get("priceRaw"), "priceAmountRub": rub, "priceAmountUsd": usd, "currencySuggestion": cur,
            "durationRaw": item.get("durationRaw"), "availabilityRaw": item.get("availabilityRaw"),
            "imageUrls": imgs, "downloadedImagePaths": downloaded, "tagsRaw": [], "optionsRaw": [],
            "buttonTexts": item.get("buttonTexts") or [], "reviewsRaw": item.get("reviewsRaw"),
            "appearances": item.get("appearances") or [], "notes": " ".join(notes),
        })

    access = "public-playwright" if services else "public-playwright-partial"
    if any("robot" in (s.get("notes") or "") for s in source_meta):
        access = "public-playwright-with-vk-challenge"

    (NORMALIZED / "services.raw.json").write_text(json.dumps({"parsedAt": parsed_at, "accessMethod": access, "sources": source_meta, "items": raw_items, "mediaManifest": media_manifest}, ensure_ascii=False, indent=2), encoding="utf-8")
    (NORMALIZED / "services.normalized.json").write_text(json.dumps({"parsedAt": parsed_at, "sources": [{"url": s["url"], "status": s["status"], "notes": f"{s['section']}; cards={s['cardsFound']}; {s['notes']}"} for s in source_meta], "services": services}, ensure_ascii=False, indent=2), encoding="utf-8")

    with (NORMALIZED / "services.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["sourceId","titleRu","slugSuggestion","categorySuggestion","directionSuggestion","priceRaw","priceAmountRub","durationRaw","sourceUrl","sourceItemUrl","downloadedImagePaths","notes"])
        w.writeheader()
        for s in services:
            row = {k: s.get(k) for k in w.fieldnames}
            row["downloadedImagePaths"] = ";".join(s.get("downloadedImagePaths") or [])
            w.writerow(row)

    (NORMALIZED / "services.translation-brief.json").write_text(json.dumps({"parsedAt": parsed_at, "services": [{"sourceId": s["sourceId"], "titleRu": s["titleRu"], "shortDescriptionRu": s.get("shortDescriptionRu"), "descriptionRu": s.get("descriptionRu"), "recommendedEnTitleDraft": None, "recommendedEnShortDescriptionDraft": None, "translationNotes": "Russian source preserved."} for s in services]}, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Done: {len(services)} services")


if __name__ == "__main__":
    main()
