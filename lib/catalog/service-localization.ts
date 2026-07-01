import type { Prisma } from "@prisma/client";

import type { CatalogItem } from "@/lib/catalog-types";
import type { Locale } from "@/lib/i18n/config";
import { buildDetails } from "@/lib/catalog/normalize";

export type ServiceTranslationFields = {
  title?: string;
  shortDescription?: string;
  description?: string;
  fullDescription?: string;
};

export type ServiceTranslations = {
  en?: ServiceTranslationFields;
  ru?: ServiceTranslationFields;
};

function parseTranslations(value: Prisma.JsonValue | null | undefined): ServiceTranslations | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as ServiceTranslations;
}

export function applyServiceLocale(
  item: CatalogItem,
  locale: Locale,
  translations: Prisma.JsonValue | null | undefined
): CatalogItem {
  if (locale === "ru") {
    return item;
  }

  const parsed = parseTranslations(translations);
  const en = parsed?.en;
  if (!en) {
    return item;
  }

  const title = en.title?.trim() || item.title;
  const shortDescription = en.shortDescription?.trim() || item.shortDescription;
  const fullDescription = en.fullDescription?.trim() || en.description?.trim() || item.fullDescription;
  const description =
    en.description?.trim() ||
    shortDescription ||
    fullDescription?.slice(0, 240) ||
    item.description;

  return {
    ...item,
    title,
    subtitle: shortDescription || description,
    description,
    shortDescription: shortDescription ?? item.shortDescription,
    fullDescription: fullDescription ?? item.fullDescription,
    details: fullDescription ? buildDetails({ details: [], description: fullDescription }) : item.details
  };
}
