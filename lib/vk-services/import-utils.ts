import type { PublicationStatus } from "@prisma/client";

export type VkImportCandidate = {
  sourceId: string;
  readyForImport: boolean;
  titleRu: string;
  slugSuggestion: string;
  directionSuggestion: string;
  priceAmountRub: number | null;
  priceRaw?: string;
  shortDescriptionRu?: string;
  descriptionRu?: string;
  imageSource?: string;
  localImagePath?: string;
  sourceItemUrl?: string;
  priority?: string;
};

export type VkImportCandidatesFile = {
  generatedAt?: string;
  services: VkImportCandidate[];
};

export type VkEnTranslation = {
  title: string;
  shortDescription: string;
  description: string;
};

export type VkEnTranslationsFile = {
  generatedAt?: string;
  bySourceId: Record<string, VkEnTranslation>;
};

/** VK service that matches an existing catalog row — update in place, do not duplicate. */
export const VK_SERVICE_MERGE_BY_SOURCE: Record<
  string,
  { slug: string; preserveSlug?: boolean; preserveImage?: boolean }
> = {
  "vk-service-052": { slug: "diagnostika-negativa", preserveSlug: true, preserveImage: true }
};

/** Seasonal / holiday offerings — import as draft for owner review. */
export const VK_SEASONAL_DRAFT_SOURCE_IDS = new Set([
  "vk-service-029", // Walpurgis Night (Apr 30)
  "vk-service-040" // Samhain (Oct 31)
]);

const DIRECTION_CATEGORY_RU: Record<string, string> = {
  protection: "Защита",
  diagnostics: "Диагностика",
  consultation: "Консультации",
  tarot: "Таро",
  rod: "Родовые практики",
  money: "Деньги",
  transformation: "Трансформация",
  other: "Практики"
};

const DIRECTION_PLACEHOLDER_IMAGE: Record<string, string> = {
  protection: "/uploads/vk/products/braslet-iz-ametista/cover.jpg",
  diagnostics: "/uploads/vk/services/diagnostika-negativa/cover.jpg",
  consultation: "/uploads/vk/products/bokal-drakon/cover.jpg",
  tarot: "/uploads/vk/services/diagnostika-negativa/cover.jpg",
  rod: "/uploads/vk/products/altarnoe-pokryvalo/cover.jpg",
  money: "/uploads/vk/services/transformazionnaa-igra-denejnyy-magnit/cover.jpg",
  transformation: "/uploads/vk/services/transformazionnaa-igra-denejnyy-magnit/cover.jpg",
  other: "/uploads/vk/products/bokal-drakon/cover.jpg"
};

const DEFAULT_PLACEHOLDER = "/uploads/vk/services/diagnostika-negativa/cover.jpg";

const VK_AVATAR_HINTS = ["jg4lm_78tH1H", "s/v1/ig2/", "50x50", "100x100"];

export function normalizeTitleRu(title: string) {
  return title.replace(/\s+/g, " ").trim();
}

export function cleanShortDescriptionRu(text: string | undefined, descriptionRu: string) {
  const raw = (text ?? "").replace(/\s+/g, " ").trim();
  if (!raw) {
    return descriptionRu.slice(0, 180).trim();
  }

  const endsMidWord = /[а-яёА-ЯЁ]$/.test(raw) && !/[.!?…»"]$/.test(raw);
  if (endsMidWord || raw.length > 220) {
    const sentence = descriptionRu.split(/(?<=[.!?])\s+/)[0]?.trim();
    if (sentence && sentence.length >= 40 && sentence.length <= 220) {
      return sentence;
    }
    return descriptionRu.slice(0, 180).trim();
  }

  return raw;
}

export function isLowQualityVkImage(url?: string) {
  if (!url) {
    return true;
  }
  if (url.startsWith("data/vk-services/")) {
    return false;
  }
  return VK_AVATAR_HINTS.some((hint) => url.includes(hint));
}

export function resolveServiceCategory(direction: string) {
  return DIRECTION_CATEGORY_RU[direction] ?? DIRECTION_CATEGORY_RU.other;
}

export function resolvePlaceholderImage(direction: string) {
  return DIRECTION_PLACEHOLDER_IMAGE[direction] ?? DEFAULT_PLACEHOLDER;
}

export function resolvePublicationStatus(sourceId: string, titleRu: string): PublicationStatus {
  if (VK_SEASONAL_DRAFT_SOURCE_IDS.has(sourceId)) {
    return "DRAFT";
  }

  const lower = titleRu.toLowerCase();
  if (lower.includes("2025") || lower.includes("2024")) {
    return "DRAFT";
  }

  return "PUBLISHED";
}

export function buildPriceLabel(priceRub: number | null, priceRaw?: string) {
  if (priceRub == null) {
    return null;
  }
  const raw = (priceRaw ?? "").toLowerCase();
  if (raw.includes("от")) {
    return `от ${new Intl.NumberFormat("ru-RU").format(priceRub)} ₽`;
  }
  return `${new Intl.NumberFormat("ru-RU").format(priceRub)} ₽`;
}

export function resolveTargetSlug(candidate: VkImportCandidate) {
  const merge = VK_SERVICE_MERGE_BY_SOURCE[candidate.sourceId];
  return merge?.slug ?? candidate.slugSuggestion;
}
