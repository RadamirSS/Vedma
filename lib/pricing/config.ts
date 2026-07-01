const FALLBACK_RUB_PER_USD = 90;

let loggedFallback = false;

export const DOCUMENTED_FALLBACK_RUB_PER_USD = FALLBACK_RUB_PER_USD;

export function getRubPerUsd(): number {
  const raw = process.env.RUB_PER_USD ?? process.env.PRICE_USD_RUB_RATE;
  if (raw) {
    const parsed = Number(raw);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }

  if (!loggedFallback) {
    console.warn(
      `[pricing] RUB_PER_USD / PRICE_USD_RUB_RATE is not set; using fallback rate ${FALLBACK_RUB_PER_USD}`
    );
    loggedFallback = true;
  }

  return FALLBACK_RUB_PER_USD;
}
