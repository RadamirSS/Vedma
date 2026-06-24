#!/usr/bin/env python3
"""VK services/products exporter using Playwright with a persistent gitignored profile."""

from __future__ import annotations

import argparse
import json
import re
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlparse

ROOT = Path(__file__).resolve().parents[2]
PROFILE_DIR = ROOT / ".vk-browser-profile"
DEFAULT_OUTPUT = ROOT / "imports" / "vk" / "raw" / "vk_services_export.json"
PAGE_URL = "https://vk.com/bazhena13witch"
MARKET_URL = "https://vk.com/market-226854094"


def normalize_text(value: str | None) -> str:
    if not value:
        return ""
    return re.sub(r"\s+", " ", value).strip()


def best_image_url(url: str) -> str:
    url = url.replace("&amp;", "&")
    url = re.sub(r"([?&])cs=\d+x\d+", r"\1cs=0x0", url)
    url = re.sub(r"([?&])w=\d+", r"\1w=2560", url)
    url = re.sub(r"([?&])h=\d+", r"\1h=2560", url)
    return url


def detect_section(url: str, text: str = "") -> str:
    combined = f"{url} {text}".lower()
    if any(k in combined for k in ("market", "товар", "product")):
        return "products"
    if any(k in combined for k in ("uslugi", "услуг", "service")):
        return "services"
    return "unknown"


def scroll_page(page, rounds: int = 25) -> None:
    prev = 0
    for _ in range(rounds):
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(900)
        height = page.evaluate("document.body.scrollHeight")
        if height == prev:
            break
        prev = height


def collect_cards(page, section: str) -> list[dict]:
    return page.evaluate(
        """(section) => {
      const cards = new Map();
      const normalize = (s) => (s || '').replace(/\\s+/g, ' ').trim();
      const abs = (href) => {
        try { return new URL(href, location.origin).href.split('#')[0]; } catch { return null; }
      };
      const selectors = [
        "a[href*='w=product']",
        "a[href*='market']",
        "a[href*='uslugi']",
        ".market_row",
        ".MarketItem",
        "[class*='ServiceCard']",
        "[class*='MarketCard']"
      ];
      selectors.forEach((sel) => {
        document.querySelectorAll(sel).forEach((node) => {
          const linkEl = node.closest('a') || node.querySelector('a') || (node.tagName === 'A' ? node : null);
          const cardUrl = abs(linkEl?.getAttribute('href'));
          if (!cardUrl || !cardUrl.includes('vk.com')) return;
          const titleEl = node.querySelector("[class*='title'], [class*='Title'], .market_row_name, h3, h4") || linkEl;
          const title = normalize(titleEl?.textContent);
          if (!title || title.length < 2) return;
          const priceEl = node.querySelector("[class*='price'], [class*='Price'], .market_row_price");
          const priceText = normalize(priceEl?.textContent);
          const img = node.querySelector('img');
          const imageUrls = img?.src ? [img.src] : [];
          const categoryEl = node.querySelector("[class*='category'], [class*='subtitle']");
          const category = normalize(categoryEl?.textContent);
          const shortText = normalize(node.querySelector("[class*='description'], [class*='text'], p")?.textContent);
          const key = cardUrl + '|' + title.toLowerCase();
          if (!cards.has(key)) {
            cards.set(key, {
              sourceSection: section,
              cardUrl,
              title,
              priceText,
              category,
              shortText,
              fullText: shortText,
              imageUrls,
              scrapedAt: new Date().toISOString()
            });
          }
        });
      });
      return Array.from(cards.values());
    }""",
        section,
    )


def enrich_detail(page, card: dict) -> dict:
    try:
        page.goto(card["cardUrl"], wait_until="domcontentloaded", timeout=45000)
        page.wait_for_timeout(1200)
        detail = page.evaluate(
            """() => {
          const normalize = (s) => (s || '').replace(/\\s+/g, ' ').trim();
          const urls = new Set();
          document.querySelectorAll("img[src], img[data-src]").forEach((img) => {
            const src = img.getAttribute('src') || img.getAttribute('data-src');
            if (src && /userapi|vk\\.com|vk\\.me|mycdn/i.test(src)) urls.add(src);
          });
          const title = normalize(document.querySelector("h1, .market_item_title, [class*='ServiceTitle'], [class*='market_title']")?.textContent);
          const priceText = normalize(document.querySelector("[class*='price'], [class*='Price'], .market_item_price")?.textContent);
          const fullText = normalize(document.querySelector(".market_item_description, [class*='description'], [class*='Description'], .service_description")?.textContent);
          const category = normalize(document.querySelector("[class*='category'], [class*='breadcrumb']")?.textContent);
          return { title, priceText, fullText, category, imageUrls: Array.from(urls) };
        }"""
        )
        merged_images = list(
            dict.fromkeys(
                [best_image_url(u) for u in (card.get("imageUrls") or []) + detail.get("imageUrls", []) if u]
            )
        )
        return {
            **card,
            "title": detail.get("title") or card.get("title", ""),
            "priceText": detail.get("priceText") or card.get("priceText", ""),
            "category": detail.get("category") or card.get("category", ""),
            "fullText": detail.get("fullText") or card.get("shortText", ""),
            "imageUrls": merged_images,
            "scrapedAt": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as exc:
        card["enrichError"] = str(exc)
        return card


def find_section_urls(page) -> dict[str, str]:
    links = page.evaluate(
        """() => {
      const out = [];
      document.querySelectorAll('a[href]').forEach((a) => {
        const href = a.getAttribute('href') || '';
        const text = (a.textContent || '').trim().toLowerCase();
        if (/услуг|товар|market|uslugi|product/i.test(href) || /услуг|товар/i.test(text)) {
          try { out.push({ href: new URL(href, location.origin).href, text }); } catch {}
        }
      });
      return out;
    }"""
    )
    result: dict[str, str] = {}
    for link in links:
        href = link["href"]
        text = link.get("text", "")
        section = detect_section(href, text)
        if section in ("services", "products") and section not in result:
            result[section] = href
    return result


def export_vk(output: Path, headless: bool, enrich: bool) -> dict:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError as exc:
        raise SystemExit("Install playwright: pip install playwright && playwright install chromium") from exc

    PROFILE_DIR.mkdir(parents=True, exist_ok=True)
    output.parent.mkdir(parents=True, exist_ok=True)

    all_cards: dict[str, dict] = {}

    with sync_playwright() as p:
        context = p.chromium.launch_persistent_context(
            user_data_dir=str(PROFILE_DIR),
            headless=headless,
            viewport={"width": 1400, "height": 900},
            locale="ru-RU",
        )
        page = context.pages[0] if context.pages else context.new_page()
        page.goto(PAGE_URL, wait_until="domcontentloaded", timeout=60000)
        page.wait_for_timeout(2000)

        if "login" in page.url.lower() or page.locator("input[name='login']").count() > 0:
            print("VK login required. Complete login in the opened browser, then re-run this script.")
            if not headless:
                input("Press Enter after logging in...")
                page.goto(PAGE_URL, wait_until="domcontentloaded", timeout=60000)
            else:
                context.close()
                raise SystemExit("Not authenticated. Run with --headed to log in once.")

        section_urls = find_section_urls(page)
        targets = [
            ("services", section_urls.get("services", PAGE_URL)),
            ("products", section_urls.get("products", MARKET_URL)),
        ]

        for section, url in targets:
            print(f"Exporting section '{section}' from {url}")
            page.goto(url, wait_until="domcontentloaded", timeout=60000)
            page.wait_for_timeout(1500)
            scroll_page(page)
            cards = collect_cards(page, section)
            print(f"  Found {len(cards)} cards")
            for card in cards:
                key = f"{card['cardUrl']}|{card['title'].lower()}"
                if key not in all_cards:
                    all_cards[key] = card

        items = list(all_cards.values())
        if enrich:
            print(f"Enriching {len(items)} detail pages...")
            for idx, card in enumerate(items, start=1):
                print(f"  [{idx}/{len(items)}] {card['title']}")
                items[idx - 1] = enrich_detail(page, card)
                time.sleep(0.35)

        context.close()

    export_data = {
        "exportedAt": datetime.now(timezone.utc).isoformat(),
        "sourcePage": PAGE_URL,
        "sections": ["services", "products"],
        "totalCards": len(items),
        "items": items,
    }
    output.write_text(json.dumps(export_data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Saved {len(items)} items to {output}")
    return export_data


def main() -> None:
    parser = argparse.ArgumentParser(description="Export VK services/products for bazhena13witch")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--headed", action="store_true", help="Show browser for manual VK login")
    parser.add_argument("--no-enrich", action="store_true", help="Skip detail page enrichment")
    args = parser.parse_args()
    export_vk(args.output, headless=not args.headed, enrich=not args.no_enrich)


if __name__ == "__main__":
    main()
