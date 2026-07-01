import type { CatalogItem } from "@/lib/catalog-types";
import type { Locale } from "@/lib/i18n/config";

import { getRubPerUsd } from "./config";

export type PriceDisplayInput = {
  priceRub?: number | null;
  priceUsd?: number | null;
  locale: Locale;
  isFrom?: boolean;
  rubPerUsd?: number;
  priceOnRequestLabel?: string;
};

function formatRubAmount(amount: number): string {
  return new Intl.NumberFormat("ru-RU").format(amount);
}

function resolveUsdAmount(
  priceRub: number | null | undefined,
  priceUsd: number | null | undefined,
  rubPerUsd: number
): number | null {
  if (priceUsd != null && priceUsd > 0) {
    return Math.round(priceUsd);
  }

  if (priceRub != null && priceRub > 0) {
    return Math.round(priceRub / rubPerUsd);
  }

  return null;
}

export function formatLocalizedPrice(input: PriceDisplayInput): string {
  const { locale, isFrom = false, priceOnRequestLabel } = input;
  const rubPerUsd = input.rubPerUsd ?? getRubPerUsd();

  const hasRub = input.priceRub != null && input.priceRub > 0;
  const hasUsd = input.priceUsd != null && input.priceUsd > 0;

  if (!hasRub && !hasUsd) {
    return priceOnRequestLabel ?? (locale === "en" ? "Price on request" : "Цена по запросу");
  }

  if (locale === "en") {
    const usd = resolveUsdAmount(input.priceRub, input.priceUsd, rubPerUsd);
    if (usd == null) {
      return priceOnRequestLabel ?? "Price on request";
    }
    const formatted = `$${usd}`;
    return isFrom ? `from ${formatted}` : formatted;
  }

  const rub = hasRub ? input.priceRub! : Math.round(input.priceUsd! * rubPerUsd);
  const formatted = `${formatRubAmount(rub)} ₽`;
  return isFrom ? `от ${formatted}` : formatted;
}

export function formatCatalogItemPrice(
  item: Pick<CatalogItem, "priceRub" | "priceUsd" | "price" | "priceIsFrom">,
  locale: Locale,
  priceOnRequestLabel: string
): string {
  return formatLocalizedPrice({
    priceRub: item.priceRub ?? item.price,
    priceUsd: item.priceUsd,
    locale,
    isFrom: item.priceIsFrom,
    priceOnRequestLabel
  });
}

type CartPriceItem = {
  priceRub: number | null;
  priceUsd: number | null;
  priceIsFrom?: boolean;
  quantity?: number;
};

export function formatCartItemUnitPrice(
  item: CartPriceItem,
  locale: Locale,
  priceOnRequestLabel: string
): string {
  return formatLocalizedPrice({
    priceRub: item.priceRub,
    priceUsd: item.priceUsd,
    locale,
    isFrom: item.priceIsFrom,
    priceOnRequestLabel
  });
}

export function formatCartLineTotal(
  item: CartPriceItem & { quantity: number },
  locale: Locale,
  priceOnRequestLabel: string
): string {
  const quantity = item.quantity;
  const priceRub = item.priceRub != null ? item.priceRub * quantity : null;
  const priceUsd = item.priceUsd != null ? item.priceUsd * quantity : null;

  return formatLocalizedPrice({
    priceRub,
    priceUsd,
    locale,
    isFrom: item.priceIsFrom,
    priceOnRequestLabel
  });
}

export function formatOrderAmountRub(
  amountRub: number,
  locale: Locale,
  priceOnRequestLabel: string
): string {
  return formatLocalizedPrice({
    priceRub: amountRub,
    locale,
    isFrom: false,
    priceOnRequestLabel
  });
}
