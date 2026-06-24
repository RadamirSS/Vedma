#!/usr/bin/env python3
"""Export VK market/services using HTTP fetch with Playwright fallback for market-226854094."""

from __future__ import annotations

import argparse
import json
import re
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from html import unescape
from pathlib import Path
from urllib.parse import urljoin

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUTPUT = ROOT / "imports" / "vk" / "raw" / "vk_services_export.json"
COMMUNITY_ID = "226854094"
MARKET_URL = f"https://vk.com/market-{COMMUNITY_ID}"
PAGE_URL = "https://vk.com/bazhena13witch"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.8",
    "Referer": "https://vk.com/",
}


def fetch(url: str, retries: int = 3) -> str:
    last_error: Exception | None = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=45) as resp:
                return resp.read().decode("utf-8", errors="ignore")
        except Exception as exc:
            last_error = exc
            time.sleep(2 + attempt * 2)
    raise RuntimeError(f"Failed to fetch {url}: {last_error}")


def strip_html(html: str) -> str:
    text = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", html, flags=re.S | re.I)
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.I)
    text = re.sub(r"<[^>]+>", "\n", text)
    text = unescape(text)
    return re.sub(r"\n{2,}", "\n", text)


def parse_market_listing(html: str) -> list[dict]:
    items: list[dict] = []
    seen: set[str] = set()

    for href in re.findall(r'href="(https://vk\.com/market/product/[^"]+)"', html):
        slug_url = href.split("?")[0]
        if slug_url in seen:
            continue
        seen.add(slug_url)
        items.append(
            {
                "sourceSection": "products",
                "cardUrl": slug_url,
                "title": "",
                "priceText": "",
                "category": "Товары",
                "shortText": "",
                "fullText": "",
                "imageUrls": [],
                "scrapedAt": datetime.now(timezone.utc).isoformat(),
            }
        )

  # fallback: parse visible titles from text/markdown-like content
    text = strip_html(html)
    for line in text.split("\n"):
        line = line.strip()
        if not line or "₽" not in line and "rub" not in line.lower():
            continue
        m = re.match(r"^(.+?)\s*([\d\s.,]+)\s*(₽|rub\.?)$", line, re.I)
        if not m:
            continue
        title = m.group(1).strip()
        price = re.sub(r"\s+", "", m.group(2)) + " ₽"
        key = title.lower()
        if key in seen:
            continue
        seen.add(key)
        items.append(
            {
                "sourceSection": "products",
                "cardUrl": MARKET_URL,
                "title": title,
                "priceText": price,
                "category": "Товары",
                "shortText": "",
                "fullText": "",
                "imageUrls": [],
                "scrapedAt": datetime.now(timezone.utc).isoformat(),
            }
        )
    return items


def parse_product_detail(html: str, card_url: str) -> dict:
    text = strip_html(html)
    title_match = re.search(r"^#\s*(.+)$", text, re.M)
    title = title_match.group(1).strip() if title_match else ""
    if not title:
        h1 = re.search(r"<h1[^>]*>(.*?)</h1>", html, re.S | re.I)
        if h1:
            title = strip_html(h1.group(1)).strip()

    price_match = re.search(r"([\d\s.,]+)\s*(₽|rub\.?)", text, re.I)
    price_text = ""
    if price_match:
        price_text = re.sub(r"\s+", "", price_match.group(1)) + " ₽"

    images = list(
        dict.fromkeys(
            re.findall(r"https://[^\"'\s>]+(?:userapi|mycdn)[^\"'\s>]+", html)
        )
    )
    images = [u.replace("&amp;", "&") for u in images]

    description = ""
    if title:
        idx = text.find(title)
        if idx >= 0:
            tail = text[idx + len(title) :]
            tail = re.sub(r"^\s*[\d\s.,₽rub.]+\s*", "", tail, flags=re.I)
            tail = re.sub(r"(Add to cart|Contact seller|Магия Жизни).*", "", tail, flags=re.S | re.I)
            description = tail.strip()

    related = re.findall(
        rf"https://vk\.com/market-{COMMUNITY_ID}\?w=product-{COMMUNITY_ID}_\d+", html
    )
    product_links = re.findall(
        r"https://vk\.com/market/product/[a-z0-9quot;\-]+-" + COMMUNITY_ID + r"-\d+",
        html,
        re.I,
    )

    return {
        "sourceSection": "products",
        "cardUrl": card_url,
        "title": title,
        "priceText": price_text,
        "category": "Товары",
        "shortText": description[:180],
        "fullText": description,
        "imageUrls": images,
        "relatedUrls": list(dict.fromkeys(related + product_links)),
        "scrapedAt": datetime.now(timezone.utc).isoformat(),
    }


def playwright_export() -> list[dict]:
    from playwright.sync_api import sync_playwright

    profile = ROOT / ".vk-browser-profile"
    profile.mkdir(parents=True, exist_ok=True)
    items: dict[str, dict] = {}

    with sync_playwright() as p:
        context = p.chromium.launch_persistent_context(
            str(profile),
            headless=True,
            locale="ru-RU",
            viewport={"width": 1400, "height": 900},
        )
        page = context.pages[0] if context.pages else context.new_page()
        page.goto(MARKET_URL, wait_until="domcontentloaded", timeout=90000)
        page.wait_for_timeout(3000)
        if "challenge" in page.url or "робот" in page.inner_text("body")[:400]:
            context.close()
            return []

        for _ in range(25):
            show_more = page.get_by_text("Показать ещё", exact=False)
            if show_more.count() and show_more.first.is_visible():
                show_more.first.click()
                page.wait_for_timeout(1000)
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            page.wait_for_timeout(600)

        cards = page.evaluate(
            """() => {
          const map = new Map();
          document.querySelectorAll('a[href*="/market/product/"]').forEach((a) => {
            const href = a.href.split('?')[0];
            const text = (a.textContent || '').replace(/\\s+/g, ' ').trim();
            const title = text.replace(/\\d[\\d\\s]*\\s*₽/g, '').trim();
            const pm = text.match(/(\\d[\\d\\s]*)\\s*₽/);
            const priceText = pm ? pm[1].replace(/\\s/g, '') + ' ₽' : '';
            const img = a.querySelector('img')?.src || null;
            if (!map.has(href)) {
              map.set(href, { cardUrl: href, title, priceText, imageUrls: img ? [img] : [] });
            } else {
              const cur = map.get(href);
              if (title.length > cur.title.length) cur.title = title;
              if (priceText && !cur.priceText) cur.priceText = priceText;
              if (img && !cur.imageUrls.length) cur.imageUrls = [img];
            }
          });
          return Array.from(map.values());
        }"""
        )

        service_links = page.evaluate(
            """() => Array.from(document.querySelectorAll('a[href]'))
              .map(a => ({ href: a.href, text: (a.textContent||'').trim() }))
              .filter(x => /услуг|service|uslugi/i.test(x.href + ' ' + x.text) && !/market\\/product/.test(x.href))
              .slice(0, 20)"""
        )

        for card in cards:
            key = card["cardUrl"]
            try:
                page.goto(card["cardUrl"], wait_until="domcontentloaded", timeout=45000)
                page.wait_for_timeout(1200)
                detail = page.evaluate(
                    """() => {
                  const normalize = (s) => (s || '').replace(/\\s+/g, ' ').trim();
                  const imgs = [...document.querySelectorAll('img[src*="userapi"], img[src*="mycdn"]')].map(i => i.src);
                  const body = document.body.innerText;
                  const title = normalize(document.querySelector('h1')?.textContent);
                  const pm = body.match(/(\\d[\\d\\s]*)\\s*₽/);
                  const priceText = pm ? pm[1].replace(/\\s/g, '') + ' ₽' : '';
                  const fullText = normalize(document.querySelector('[class*="description"], [class*="Description"]')?.textContent || body.split('\\n').slice(3, 12).join(' '));
                  return { title, priceText, fullText, imageUrls: imgs };
                }"""
                )
                items[key] = {
                    "sourceSection": "products",
                    "cardUrl": key,
                    "title": detail.get("title") or card.get("title", ""),
                    "priceText": detail.get("priceText") or card.get("priceText", ""),
                    "category": "Товары",
                    "shortText": (detail.get("fullText") or "")[:180],
                    "fullText": detail.get("fullText") or "",
                    "imageUrls": list(dict.fromkeys((card.get("imageUrls") or []) + detail.get("imageUrls", []))),
                    "scrapedAt": datetime.now(timezone.utc).isoformat(),
                }
            except Exception:
                items[key] = {
                    "sourceSection": "products",
                    "cardUrl": key,
                    "title": card.get("title", ""),
                    "priceText": card.get("priceText", ""),
                    "category": "Товары",
                    "shortText": "",
                    "fullText": "",
                    "imageUrls": card.get("imageUrls") or [],
                    "scrapedAt": datetime.now(timezone.utc).isoformat(),
                }

        for link in service_links:
            href = link.get("href")
            if not href:
                continue
            try:
                page.goto(href, wait_until="domcontentloaded", timeout=45000)
                page.wait_for_timeout(1200)
                detail = page.evaluate(
                    """() => {
                  const normalize = (s) => (s || '').replace(/\\s+/g, ' ').trim();
                  const imgs = [...document.querySelectorAll('img[src*="userapi"], img[src*="mycdn"]')].map(i => i.src);
                  return {
                    title: normalize(document.querySelector('h1')?.textContent),
                    priceText: normalize((document.body.innerText.match(/(\\d[\\d\\s]*)\\s*₽/) || [])[0] || ''),
                    fullText: normalize(document.querySelector('[class*="description"], [class*="Description"]')?.textContent),
                    imageUrls: imgs
                  };
                }"""
                )
                if detail.get("title"):
                    items[href] = {
                        "sourceSection": "services",
                        "cardUrl": href,
                        "title": detail["title"],
                        "priceText": detail.get("priceText", ""),
                        "category": "Услуги",
                        "shortText": (detail.get("fullText") or "")[:180],
                        "fullText": detail.get("fullText") or "",
                        "imageUrls": detail.get("imageUrls") or [],
                        "scrapedAt": datetime.now(timezone.utc).isoformat(),
                    }
            except Exception:
                continue

        context.close()

    return list(items.values())


def crawl_products(seed_urls: list[str], max_items: int = 120) -> list[dict]:
    queue = list(dict.fromkeys(seed_urls))
    seen_pages: set[str] = set()
    items: dict[str, dict] = {}

    while queue and len(items) < max_items:
        url = queue.pop(0)
        if url in seen_pages:
            continue
        seen_pages.add(url)
        try:
            html = fetch(url)
        except Exception:
            continue
        if "робот" in html[:5000] or "запросы" in html[:5000]:
            break

        item = parse_product_detail(html, url)
        if item.get("title"):
            key = item["title"].lower()
            if key not in items:
                items[key] = item
            for rel in item.get("relatedUrls", []):
                if rel not in seen_pages and rel not in queue:
                    queue.append(rel)
            slug_links = re.findall(
                r"https://vk\.com/market/product/[^\"'\s<]+", html
            )
            for rel in slug_links:
                rel = rel.split("?")[0]
                if rel not in seen_pages and rel not in queue:
                    queue.append(rel)
        time.sleep(1.2)

    return list(items.values())


def export_all(output: Path) -> dict:
    items: list[dict] = []

    try:
        items = playwright_export()
    except Exception:
        items = []

    if not items:
        try:
            listing_html = fetch(MARKET_URL)
            listing_items = parse_market_listing(listing_html)
            seed_urls = [i["cardUrl"] for i in listing_items if "/market/product/" in i["cardUrl"]]
            if not seed_urls:
                seed_urls = [
                    "https://vk.com/market/product/altarnaya-podstavka-quotarkhangel-gavriilquot-226854094-12690357"
                ]
            items = crawl_products(seed_urls)
        except Exception:
            items = crawl_products(
                [
                    "https://vk.com/market/product/altarnaya-podstavka-quotarkhangel-gavriilquot-226854094-12690357"
                ]
            )

    export_data = {
        "exportedAt": datetime.now(timezone.utc).isoformat(),
        "sourcePage": PAGE_URL,
        "marketPage": MARKET_URL,
        "sections": ["services", "products"],
        "totalCards": len(items),
        "items": items,
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(export_data, ensure_ascii=False, indent=2), encoding="utf-8")
    return export_data


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    data = export_all(args.output)
    print(f"Exported {data['totalCards']} items to {args.output}")


if __name__ == "__main__":
    main()
