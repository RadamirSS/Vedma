import type { AvailabilityStatus, Product, Service } from "@prisma/client";

import type { CatalogItem } from "@/lib/catalog-types";

const CATEGORY_MAP: Record<string, string> = {
  Bracelets: "Браслеты",
  "Souvenirs and gifts": "Подарки и сувениры",
  "Self-knowledge and stress management": "Самопознание и практики",
  Accessories: "Аксессуары",
  Jewelry: "Украшения",
  Stones: "Камни",
  Altar: "Алтарные товары",
  Decor: "Декор",
  Candles: "Свечи",
  Ritual: "Ритуальные предметы",
  "Money and success": "Деньги и успех",
  "Action figures and fan merch": "Декор",
  "Carpets, rugs and runners": "Декор",
  Earrings: "Украшения",
  "Hair accessories": "Аксессуары",
  Purses: "Аксессуары",
  Tablecloths: "Алтарные товары",
  Watches: "Декор"
};

const PRODUCT_ACCENTS: Array<{ accent: CatalogItem["accent"]; keywords: string[] }> = [
  { accent: "stone", keywords: ["браслет", "камн", "агат", "аметист", "гематит", "флюорит"] },
  { accent: "amulet", keywords: ["алтар", "оберег", "амулет", "покрывал", "подставк"] },
  { accent: "rod", keywords: ["сумк", "заколк", "серьг", "коврик", "часы"] },
  { accent: "candle", keywords: ["свеч"] }
];

function stripBrandPrefix(category?: string | null) {
  return (category ?? "").replace(/^Магия Жизни\s+/i, "").trim();
}

function normalizeText(text: string) {
  return text.toLowerCase().replace(/ё/g, "е");
}

function deriveAccent(item: Pick<CatalogItem, "type" | "title" | "slug" | "description">) {
  if (item.type === "service") {
    if (normalizeText(item.title).includes("игра")) {
      return "game" as const;
    }
    return "tarot" as const;
  }

  const text = normalizeText(`${item.title} ${item.slug} ${item.description}`);
  for (const rule of PRODUCT_ACCENTS) {
    if (rule.keywords.some((keyword) => text.includes(keyword))) {
      return rule.accent;
    }
  }
  return "amulet" as const;
}

function deriveIcon(item: Pick<CatalogItem, "type" | "accent">) {
  if (item.type === "service") {
    return item.accent === "game" ? "◇" : "☾";
  }

  switch (item.accent) {
    case "stone":
      return "◇";
    case "rod":
      return "✦";
    case "candle":
      return "🕯";
    default:
      return "◈";
  }
}

export function normalizeCategoryLabel(category?: string | null, type?: CatalogItem["type"]) {
  const stripped = stripBrandPrefix(category);
  if (!stripped) {
    return type === "service" ? "Услуги" : "Прочее";
  }
  return CATEGORY_MAP[stripped] ?? stripped;
}

export function deriveAvailabilityStatus(item: CatalogItem): AvailabilityStatus {
  const value = normalizeText(item.availability ?? "");
  if (value.includes("в наличии")) {
    return "IN_STOCK";
  }
  if (value.includes("под")) {
    return "ON_REQUEST";
  }
  if (value.includes("нет")) {
    return "OUT_OF_STOCK";
  }
  return "UNKNOWN";
}

export function availabilityLabel(status?: AvailabilityStatus | null) {
  switch (status) {
    case "IN_STOCK":
      return "В наличии";
    case "ON_REQUEST":
      return "Под заказ";
    case "OUT_OF_STOCK":
      return "Нет в наличии";
    default:
      return undefined;
  }
}

export function inferSourcePlatform(item: Pick<CatalogItem, "id" | "sourceUrl">) {
  if (item.sourceUrl?.includes("vk.com") || item.id.startsWith("vk-")) {
    return "VK";
  }
  return null;
}

export function createPriceLabel(item: Pick<CatalogItem, "price" | "type">) {
  if (!item.price) {
    return null;
  }
  return `${new Intl.NumberFormat("ru-RU").format(item.price)} ₽`;
}

export function buildGallery(image?: string) {
  return image ? [image] : [];
}

export function buildDetails(item: Pick<CatalogItem, "details" | "description">) {
  if (item.details.length > 0) {
    return item.details;
  }
  return item.description ? [item.description] : [];
}

export function buildCatalogItemBase(
  item: Pick<CatalogItem, "type" | "title" | "slug" | "description" | "details">
) {
  const accent = deriveAccent(item);
  return {
    accent,
    icon: deriveIcon({ type: item.type, accent })
  };
}

export function getCatalogDescription(record: Pick<Product | Service, "shortDescription" | "fullDescription">) {
  return record.shortDescription ?? record.fullDescription ?? "";
}
