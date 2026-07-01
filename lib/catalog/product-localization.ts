import type { CatalogItem } from "@/lib/catalog-types";
import type { Locale } from "@/lib/i18n/config";
import { buildDetails } from "@/lib/catalog/normalize";

import productTranslationsEn from "@/data/catalog/product-translations.en.json";

export type ProductTranslationFields = {
  title?: string;
  shortDescription?: string;
  description?: string;
  fullDescription?: string;
};

type ProductTranslationsFile = {
  bySlug: Record<string, ProductTranslationFields>;
};

const overlay = productTranslationsEn as ProductTranslationsFile;

export function getProductTranslation(slug: string): ProductTranslationFields | null {
  return overlay.bySlug[slug] ?? null;
}

export function applyProductLocale(item: CatalogItem, locale: Locale = "ru"): CatalogItem {
  if (locale === "ru") {
    return item;
  }

  const en = getProductTranslation(item.slug);
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
