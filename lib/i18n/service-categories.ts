const SERVICE_CATEGORY_EN: Record<string, string> = {
  Защита: "Protection",
  Диагностика: "Insight work",
  Консультации: "Consultations",
  Таро: "Tarot",
  "Родовые практики": "Ancestral practices",
  Деньги: "Money",
  Трансформация: "Transformation",
  Практики: "Practices",
  Услуги: "Services"
};

export function getServiceCategoryLabel(category: string | undefined, locale: "en" | "ru") {
  const value = category?.trim() || (locale === "en" ? "Services" : "Услуги");
  if (locale === "ru") {
    return value;
  }
  return SERVICE_CATEGORY_EN[value] ?? value;
}
