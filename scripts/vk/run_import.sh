#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "==> Building raw export"
python3 scripts/vk/build_seed_export.py || python3 scripts/vk/vk_fetch_exporter.py || python3 scripts/vk/vk_playwright_exporter.py --headed

echo "==> Downloading images (Playwright authenticated session)"
if [ -f imports/vk/clean/image_manifest.json ]; then
  python3 scripts/vk/download_vk_images_playwright.py --retry-failed --merge || true
else
  python3 scripts/vk/download_vk_images_playwright.py --merge
  python3 scripts/vk/download_vk_images_playwright.py --retry-failed --merge || true
fi

echo "==> Normalizing catalog"
python3 scripts/vk/normalize_vk_catalog.py

echo "==> Integrating into site"
python3 scripts/vk/integrate_catalog.py

echo "==> Done"
