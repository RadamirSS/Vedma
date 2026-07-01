import type { CatalogItem } from "@/lib/catalog-types";
import type { Locale } from "@/lib/i18n/config";

export const PRODUCT_CATEGORIES = [
  "Браслеты",
  "Камни",
  "Алтарные товары",
  "Декор",
  "Свечи",
  "Обереги",
  "Подарки",
  "Прочее"
] as const;

export const PRODUCT_CATEGORY_LABELS_EN: Record<(typeof PRODUCT_CATEGORIES)[number], string> = {
  Браслеты: "Bracelets",
  Камни: "Stones",
  "Алтарные товары": "Altar items",
  Декор: "Decor",
  Свечи: "Candles",
  Обереги: "Amulets",
  Подарки: "Gifts",
  Прочее: "Other"
};

export type ProductDisplayCategory = (typeof PRODUCT_CATEGORIES)[number];

const RULES: Array<{ category: ProductDisplayCategory; keywords: string[] }> = [
  { category: "Браслеты", keywords: ["браслет"] },
  { category: "Свечи", keywords: ["свеч"] },
  { category: "Обереги", keywords: ["оберег", "защит", "амулет", "талисман"] },
  {
    category: "Алтарные товары",
    keywords: ["алтар", "покрывал", "скатерт", "подставк"]
  },
  { category: "Камни", keywords: ["камн", "аметист", "кварц", "лунн", "обсидиан", "агат"] },
  { category: "Подарки", keywords: ["подарок", "сувенир", "набор"] },
  { category: "Декор", keywords: ["коробок", "бокал", "коврик", "часы", "сумк", "серьг", "заколк"] }
];

function normalize(text: string) {
  return text.toLowerCase().replace(/ё/g, "е");
}

export function getProductDisplayCategory(
  item: CatalogItem,
  locale: Locale = "ru"
): string {
  const text = normalize(`${item.title} ${item.slug} ${item.description}`);

  let category: ProductDisplayCategory = "Прочее";

  if (text.includes("браслет")) {
    category = "Браслеты";
  } else {
    for (const rule of RULES) {
      if (rule.category === "Браслеты") {
        continue;
      }
      if (rule.keywords.some((keyword) => text.includes(keyword))) {
        category = rule.category;
        break;
      }
    }
  }

  if (locale === "en") {
    return PRODUCT_CATEGORY_LABELS_EN[category];
  }

  return category;
}

export function groupProductsByCategory(products: CatalogItem[], locale: Locale = "ru") {
  const groups = new Map<string, CatalogItem[]>();

  for (const category of PRODUCT_CATEGORIES) {
    const label = locale === "en" ? PRODUCT_CATEGORY_LABELS_EN[category] : category;
    groups.set(label, []);
  }

  for (const product of products) {
    const category = getProductDisplayCategory(product, locale);
    groups.get(category)!.push(product);
  }

  return groups;
}

export function getCategoryCounts(products: CatalogItem[], locale: Locale = "ru") {
  const groups = groupProductsByCategory(products, locale);
  const labels =
    locale === "en"
      ? PRODUCT_CATEGORIES.map((category) => PRODUCT_CATEGORY_LABELS_EN[category])
      : [...PRODUCT_CATEGORIES];

  return labels
    .map((category) => ({
      category,
      count: groups.get(category)?.length ?? 0,
      thumbnail: groups.get(category)?.find((item) => item.image)?.image
    }))
    .filter((entry) => entry.count > 0);
}
