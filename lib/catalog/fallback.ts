import type { CatalogItem } from "@/lib/catalog-types";
import { products as staticProducts, services as staticServices } from "@/lib/catalog-data";
import {
  availabilityLabel,
  buildCatalogItemBase,
  buildDetails,
  buildGallery,
  createPriceLabel,
  deriveAvailabilityStatus,
  inferSourcePlatform,
  normalizeCategoryLabel
} from "@/lib/catalog/normalize";
import { derivePriceIsFrom } from "@/lib/pricing/detect-from-price";

function normalizeStaticItem(item: CatalogItem): CatalogItem {
  const presentation = buildCatalogItemBase(item);
  const normalizedCategory = normalizeCategoryLabel(item.category, item.type);

  return {
    ...item,
    ...presentation,
    category: normalizedCategory,
    normalizedCategory,
    shortDescription: item.subtitle,
    fullDescription: item.details.join("\n"),
    priceRub: item.price,
    priceLabel: createPriceLabel(item),
    priceIsFrom: derivePriceIsFrom(createPriceLabel(item), item.slug),
    availabilityStatus:
      item.type === "product" ? deriveAvailabilityStatus(item) : undefined,
    availability:
      item.type === "product"
        ? item.availability ?? availabilityLabel(deriveAvailabilityStatus(item))
        : undefined,
    gallery: item.gallery ?? buildGallery(item.image),
    tags: item.tags ?? [],
    needsReview: item.needsReview ?? false,
    sourceId: item.sourceId ?? item.id,
    sourcePlatform: item.sourcePlatform ?? inferSourcePlatform(item) ?? undefined
  };
}

const fallbackProducts = staticProducts.map(normalizeStaticItem);
const fallbackServices = staticServices.map(normalizeStaticItem);

export function getFallbackProducts() {
  return fallbackProducts;
}

export function getFallbackServices() {
  return fallbackServices;
}

export function getFallbackProductBySlug(slug: string) {
  return fallbackProducts.find((item) => item.slug === slug);
}

export function getFallbackServiceBySlug(slug: string) {
  return fallbackServices.find((item) => item.slug === slug);
}

export function getFallbackDetails(item: CatalogItem) {
  return buildDetails(item);
}
