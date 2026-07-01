const KNOWN_FROM_PRICE_SLUGS = new Set([
  "vhod-v-finansovyy-potok",
  "otdyh-po-date-rozhdeniya",
  "energiya-chisla-sudby-karmicheskie-zadachi",
  "raschyot-talanta-po-date-rozhdeniya"
]);

export function derivePriceIsFrom(priceLabel?: string | null, slug?: string): boolean {
  const label = priceLabel?.trim().toLowerCase() ?? "";
  if (label.startsWith("от") || label.startsWith("from")) {
    return true;
  }

  if (slug && KNOWN_FROM_PRICE_SLUGS.has(slug)) {
    return true;
  }

  return false;
}
