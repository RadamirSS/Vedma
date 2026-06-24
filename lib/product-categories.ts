import type { CatalogItem } from "@/lib/catalog-types";

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

export function getProductDisplayCategory(item: CatalogItem): ProductDisplayCategory {
  const text = normalize(`${item.title} ${item.slug} ${item.description}`);

  if (text.includes("браслет")) {
    return "Браслеты";
  }

  for (const rule of RULES) {
    if (rule.category === "Браслеты") {
      continue;
    }
    if (rule.keywords.some((keyword) => text.includes(keyword))) {
      return rule.category;
    }
  }

  return "Прочее";
}

export function groupProductsByCategory(products: CatalogItem[]) {
  const groups = new Map<ProductDisplayCategory, CatalogItem[]>();

  for (const category of PRODUCT_CATEGORIES) {
    groups.set(category, []);
  }

  for (const product of products) {
    const category = getProductDisplayCategory(product);
    groups.get(category)!.push(product);
  }

  return groups;
}

export function getCategoryCounts(products: CatalogItem[]) {
  const groups = groupProductsByCategory(products);
  return PRODUCT_CATEGORIES.map((category) => ({
    category,
    count: groups.get(category)!.length,
    thumbnail: groups.get(category)!.find((item) => item.image)?.image
  })).filter((entry) => entry.count > 0);
}
