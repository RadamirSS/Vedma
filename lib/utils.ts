const CATEGORY_TRANSLATIONS: Record<string, string> = {
  "Self-knowledge and stress management": "Самопознание",
  "Money and success": "Деньги и успех",
  Bracelets: "Браслеты",
  "Souvenirs and gifts": "Сувениры",
  "Action figures and fan merch": "Мерч",
  "Carpets, rugs and runners": "Ковры",
  Earrings: "Серьги",
  "Hair accessories": "Аксессуары",
  Purses: "Сумки",
  Tablecloths: "Скатерти",
  Watches: "Часы"
};

export function formatCatalogLabel(text: string, maxLength = 32) {
  const stripped = text.replace(/^Магия Жизни\s+/i, "").trim();
  const translated = CATEGORY_TRANSLATIONS[stripped] ?? stripped;

  if (translated.length <= maxLength) {
    return translated;
  }

  return `${translated.slice(0, maxLength - 1).trimEnd()}…`;
}

export function formatPrice(price: number, prefix?: string, locale: "en" | "ru" = "ru") {
  const formatted =
    locale === "en"
      ? new Intl.NumberFormat("en-US").format(price)
      : new Intl.NumberFormat("ru-RU").format(price);

  if (locale === "en") {
    return prefix ? `${prefix} ₽${formatted}` : `₽${formatted}`;
  }

  return prefix ? `${prefix} ${formatted} ₽` : `${formatted} ₽`;
}
