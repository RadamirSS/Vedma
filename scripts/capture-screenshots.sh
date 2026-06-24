#!/usr/bin/env bash
set -euo pipefail

PHASE="${1:-after}"
BASE_URL="${BASE_URL:-http://localhost:3000}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="$ROOT/docs/audit/screenshots/$PHASE"
WIDTHS=(320 375 390 430 768 1024)
ROUTES=("/" "/services" "/products" "/about")

mkdir -p "$OUT_DIR"

slug_for() {
  case "$1" in
    /) echo "home" ;;
    *) echo "${1#/}" ;;
  esac
}

for route in "${ROUTES[@]}"; do
  slug="$(slug_for "$route")"
  for width in "${WIDTHS[@]}"; do
    file="$OUT_DIR/${slug}-${width}.png"
    echo "Capturing $file ..."
    npx --yes playwright@1.52.0 screenshot \
      --viewport-size="${width},900" \
      --full-page \
      "${BASE_URL}${route}" \
      "$file" || echo "Failed: $file"
  done
done

echo "Screenshots saved to $OUT_DIR"
