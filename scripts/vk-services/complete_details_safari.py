#!/usr/bin/env python3
"""Complete VK service details via logged-in Safari (slow, user-session safe)."""

from __future__ import annotations

import json
import re
import subprocess
import time
from datetime import datetime, timezone
from html import unescape
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DETAIL = ROOT / "data" / "vk-services" / "detail"
NORM = ROOT / "data" / "vk-services" / "normalized"
REPORTS = DETAIL / "reports"

PRIORITY_A = [
    "Определение (диагностика) негатива",
    "Разбор ситуации на метафорических картах",
    "Консультация",
    "Ответ на один вопрос",
    "Распаковка Матрицы Судьбы",
    "Защита Себека",
    'Защита "Ведьмин Круг"',
    "Усиление связи с Родом",
    "Вход в финансовый поток",
    "Как пробить денежный потолок?",
    "Матрица Судьбы на 2026 год",
    "ОБРЯД СВАРОГА «КОВАНАЯ СУДЬБА»",
]


def run_applescript(script: str, timeout: int = 180) -> str:
    proc = subprocess.run(["osascript", "-e", script], capture_output=True, text=True, timeout=timeout)
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.strip() or proc.stdout.strip())
    return proc.stdout.strip()


def safari_bounds() -> tuple[int, int, int, int]:
    raw = run_applescript('tell application "Safari" to get bounds of front window')
    parts = [int(x.strip()) for x in raw.split(",")]
    left, top, right, bottom = parts
    return left, top, right - left, bottom - top


def safari_open_and_prepare(url: str, wait_s: float = 11.0) -> None:
    run_applescript(
        f'''
        tell application "Safari"
          activate
          if (count of windows) = 0 then make new document
          set URL of current tab of front window to "{url}"
          delay {wait_s}
        end tell
        tell application "System Events"
          tell process "Safari"
            set frontmost to true
            delay 0.4
            key code 115
            delay 0.2
            repeat 6 times
              key code 125
              delay 0.2
            end repeat
          end tell
        end tell
        '''
    )


def safari_tab_title() -> str:
    return run_applescript('tell application "Safari" to return name of current tab of front window')


def safari_page_source() -> str:
    return run_applescript('tell application "Safari" to return source of document of front window')


def safari_try_clipboard() -> str | None:
    try:
        run_applescript(
            '''
            tell application "Safari" to activate
            delay 0.6
            tell application "System Events"
              tell process "Safari"
                set frontmost to true
                delay 0.3
                keystroke "a" using command down
                delay 0.3
                keystroke "c" using command down
                delay 0.3
              end tell
            end tell
            '''
        )
        clip = run_applescript("return (the clipboard as text)")
        if clip and "vk.com" in clip.lower() and len(clip) > 80:
            if "TASK TITLE" not in clip and "Cursor Agent" not in clip:
                return clip
    except Exception:
        pass
    return None


def safari_try_js(expr: str) -> str | None:
    esc = expr.replace("\\", "\\\\").replace('"', '\\"')
    try:
        return run_applescript(
            f'tell application "Safari" to return do JavaScript "{esc}" in current tab of front window'
        )
    except Exception:
        return None


def safari_screenshot(dest: Path) -> bool:
    try:
        x, y, w, h = safari_bounds()
        subprocess.run(["screencapture", "-x", "-R", f"{x},{y},{w},{h}", str(dest)], check=True, timeout=30)
        return dest.exists() and dest.stat().st_size > 10000
    except Exception:
        return False


def normalize_ws(text: str) -> str:
    return re.sub(r"\s+", " ", text.replace("\xa0", " ")).strip()


def parse_tab_title(title: str) -> dict[str, Any]:
    out: dict[str, Any] = {}
    m = re.search(r"купить за\s+([\d\s]+)\s*руб", title, re.I)
    if m:
        out["priceRaw"] = normalize_ws(m.group(1)) + " ₽"
    m2 = re.match(r"^(.+?)\s*-\s*купить", title)
    if m2:
        out["titleRu"] = normalize_ws(m2.group(1))
    return out


def parse_body_text(text: str) -> dict[str, Any]:
    if not text or "робот" in text.lower():
        return {"blocked": True}
    out: dict[str, Any] = {}
    lines = [normalize_ws(l) for l in text.split("\n") if normalize_ws(l)]
    body = "\n".join(lines)
    pm = re.search(r"(от\s+)?([\d\s]+)\s*₽", body)
    if pm:
        out["priceRaw"] = pm.group(0)
    idx = body.find("Описание")
    if idx >= 0:
        tail = body[idx + len("Описание") :]
        end = re.search(r"Показать|Пожаловаться|Комментарии|О продавце", tail)
        desc = normalize_ws(tail[: end.start()] if end else tail[:5000])
        if len(desc) > 20:
            out["descriptionRu"] = desc
            out["shortDescriptionRu"] = desc[:180]
    dm = re.search(r"(\d+\s*(?:час|ч\.?|мин|минут)[^.\\n]{0,60})", body, re.I)
    if dm:
        out["durationRaw"] = dm.group(1)
    if "Обычно отвечает" in body:
        out["availabilityRaw"] = "Обычно отвечает за несколько часов"
    tags = re.findall(r"#\w+", body)
    if tags:
        out["tagsRaw"] = tags
    return out


def parse_images(html: str, js_imgs: str | None = None) -> list[str]:
    urls = re.findall(r'https://[^"\'\\>\s]+(?:userapi|sun\d+-|mycdn|vkuserphoto)[^"\'\\>\s]+', html)
    if js_imgs:
        urls.extend([u.strip() for u in js_imgs.split("\n") if u.strip()])
    clean = []
    for u in urls:
        u = unescape(u.replace("&amp;", "&"))
        if any(x in u for x in ("emoji", "icon", "camera", "sticker")):
            continue
        clean.append(u)
    return list(dict.fromkeys(clean))[:8]


def download_image(url: str, dest: Path) -> bool:
    import urllib.request

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


def priority_for(title: str) -> str:
    if title in PRIORITY_A:
        return "A"
    if any(s in title for s in ("Купало", "Самайн", "Маслен", "Равноденствие", "Спас", "Лугнасад", "Солнцестояние")):
        return "C"
    return "B"


def extract_service(service: dict[str, Any]) -> dict[str, Any]:
    sid = service["sourceId"]
    slug = service["slugSuggestion"]
    url = service.get("sourceItemUrl")
    base = f"{sid}-{slug}"

    result: dict[str, Any] = {
        **service,
        "detailCollectedAt": datetime.now(timezone.utc).isoformat(),
        "extractionMethod": "blocked",
        "confidence": "low",
        "needsOwnerClarification": False,
        "clarificationQuestion": None,
        "screenshotPaths": [],
        "priceIsFrom": bool(str(service.get("priceRaw", "")).strip().lower().startswith("от")),
        "priceOptions": [],
        "includedItemsRaw": [],
        "processRaw": [],
        "resultRaw": [],
        "formatRaw": None,
        "ageLimitRaw": None,
        "bookingCtaRaw": None,
    }

    if not url:
        result["needsOwnerClarification"] = True
        result["clarificationQuestion"] = "Нет sourceItemUrl."
        return result

    safari_open_and_prepare(url)
    tab = safari_tab_title()
    tab_data = parse_tab_title(tab)
    page_text = safari_try_js("document.body.innerText") or safari_try_clipboard()
    method = "safari_js" if page_text and safari_try_js("'ok'") else ("safari_clipboard" if page_text else "safari_tab_html")
    html = safari_page_source()

    (DETAIL / "raw-html" / f"{base}.html").write_text(html, encoding="utf-8")
    text_path = DETAIL / "raw-text" / f"{base}.txt"

    parsed: dict[str, Any] = {}
    if page_text:
        text_path.write_text(page_text, encoding="utf-8")
        parsed = parse_body_text(page_text)
    else:
        text_path.write_text(f"Tab: {tab}\n\nJS/clipboard unavailable. Enable Safari → Settings → Developer → Allow JavaScript from Apple Events.\n", encoding="utf-8")
        parsed = {"blocked": "робот" in html.lower()}

    shot = DETAIL / "screenshots" / f"{base}.png"
    if safari_screenshot(shot):
        result["screenshotPaths"].append(str(shot.relative_to(ROOT)))

    if tab_data.get("titleRu"):
        result["titleRu"] = tab_data["titleRu"]
    if tab_data.get("priceRaw"):
        result["priceRaw"] = tab_data["priceRaw"]

    if not parsed.get("blocked"):
        for k in ("descriptionRu", "shortDescriptionRu", "durationRaw", "availabilityRaw", "priceRaw", "tagsRaw"):
            if parsed.get(k):
                result[k] = parsed[k]
        result["extractionMethod"] = method
        result["confidence"] = "high" if result.get("descriptionRu") else "medium"
    else:
        result["extractionMethod"] = "screenshot_only" if result["screenshotPaths"] else "blocked"
        note = " Safari session: title/HTML captured; full text needs JS Apple Events or manual copy."
        result["notes"] = (result.get("notes") or "") + note

    js_imgs = safari_try_js('[...document.querySelectorAll("img")].map(i=>i.src).filter(s=>/userapi|sun|mycdn|vkuserphoto/.test(s)).join("\\n")')
    result["imageUrls"] = parse_images(html, js_imgs)
    downloaded = []
    for i, img in enumerate(result["imageUrls"][:2], start=1):
        ext = ".webp" if ".webp" in img.lower() else ".png" if ".png" in img.lower() else ".jpg"
        dest = DETAIL / "media" / f"{base}-{i:02d}{ext}"
        if download_image(img, dest):
            downloaded.append(str(dest.relative_to(ROOT)))
    result["downloadedImagePaths"] = downloaded

    if result.get("priceIsFrom"):
        result["needsOwnerClarification"] = True
        result["clarificationQuestion"] = f"Цена «{result.get('priceRaw')}» — какие тарифы показывать на сайте?"

    if not result.get("descriptionRu"):
        result["needsOwnerClarification"] = True
        if not result.get("clarificationQuestion"):
            result["clarificationQuestion"] = "Нужно описание: включите Allow JavaScript from Apple Events или сохраните текст карточки вручную."

    return result


def main() -> None:
    for d in [
        DETAIL / "raw-html", DETAIL / "raw-text", DETAIL / "screenshots",
        DETAIL / "media", DETAIL / "manual-notes", REPORTS,
    ]:
        d.mkdir(parents=True, exist_ok=True)

    services_in = json.loads((NORM / "services.normalized.json").read_text(encoding="utf-8"))["services"]
    order = sorted(services_in, key=lambda s: ({"A": 0, "B": 1, "C": 2}[priority_for(s["titleRu"])], s.get("orderIndex") or 999))

    results = []
    checklist = []
    for i, svc in enumerate(order, 1):
        print(f"[{i}/{len(order)}] {svc['sourceId']}", flush=True)
        try:
            out = extract_service(svc)
        except Exception as exc:
            out = {**svc, "extractionMethod": "blocked", "confidence": "low", "needsOwnerClarification": True, "clarificationQuestion": str(exc), "screenshotPaths": [], "priceIsFrom": False, "priceOptions": [], "detailCollectedAt": datetime.now(timezone.utc).isoformat()}
        results.append(out)
        checklist.append({
            "sourceId": out["sourceId"], "titleRu": out["titleRu"], "sourceItemUrl": out.get("sourceItemUrl"),
            "priority": priority_for(out["titleRu"]),
            "status": "completed" if out.get("descriptionRu") else ("partial" if out.get("screenshotPaths") else "blocked"),
            "descriptionCollected": "yes" if out.get("descriptionRu") else "no",
            "imageCollected": "yes" if (out.get("downloadedImagePaths") or out.get("imageUrls")) else ("screenshot" if out.get("screenshotPaths") else "no"),
            "optionsCollected": "yes" if out.get("priceOptions") else "no",
            "notes": out.get("notes") or "",
        })
        time.sleep(5)

    path = DETAIL / "reports" / "_batch_results.json"
    path.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    print("saved", path)


if __name__ == "__main__":
    main()
