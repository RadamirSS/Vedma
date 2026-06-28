import { cache } from "react";
import { Prisma } from "@prisma/client";

import type { CatalogItem } from "@/lib/catalog-types";
import { getFallbackProductBySlug, getFallbackProducts, getFallbackServiceBySlug, getFallbackServices } from "@/lib/catalog/fallback";
import {
  availabilityLabel,
  buildCatalogItemBase,
  buildDetails,
  buildGallery,
  createPriceLabel,
  getCatalogDescription,
  normalizeCategoryLabel
} from "@/lib/catalog/normalize";
import { prisma } from "@/lib/db/prisma";

const FALLBACK_ALLOWED =
  !process.env.DATABASE_URL || process.env.ALLOW_STATIC_CATALOG_FALLBACK === "true";

let warnedAboutFallback = false;

function logFallback(reason: string) {
  if (!warnedAboutFallback) {
    console.warn(`[catalog] Using static fallback: ${reason}`);
    warnedAboutFallback = true;
  }
}

function canFallback() {
  return FALLBACK_ALLOWED || process.env.NODE_ENV !== "production";
}

function isPrismaConnectionError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientKnownRequestError
  );
}

async function withFallback<T>(loader: () => Promise<T>, fallback: () => T, context: string) {
  if (!process.env.DATABASE_URL) {
    if (canFallback()) {
      logFallback(`${context}: DATABASE_URL is not set.`);
      return fallback();
    }
    throw new Error(`DATABASE_URL is required for ${context}.`);
  }

  try {
    return await loader();
  } catch (error) {
    if (canFallback() && isPrismaConnectionError(error)) {
      logFallback(`${context}: ${error.message}`);
      return fallback();
    }
    throw error;
  }
}

function mapProductRecord(record: {
  id: string;
  sourceId: string | null;
  slug: string;
  title: string;
  shortDescription: string | null;
  fullDescription: string | null;
  priceRub: number | null;
  priceUsd: number | null;
  priceLabel: string | null;
  category: string | null;
  normalizedCategory: string | null;
  availabilityStatus: "IN_STOCK" | "ON_REQUEST" | "OUT_OF_STOCK" | "UNKNOWN";
  publicationStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  quantity: number | null;
  image: string | null;
  gallery: Prisma.JsonValue | null;
  tags: Prisma.JsonValue | null;
  needsReview: boolean;
  sourcePlatform: string | null;
  sourceUrl: string | null;
  media: Array<{ path: string }>;
}): CatalogItem {
  const fallback = getFallbackProductBySlug(record.slug);
  const description = getCatalogDescription(record);
  const base = fallback
    ? {
        subtitle: fallback.subtitle,
        details: fallback.details,
        badge: fallback.badge,
        accent: fallback.accent,
        icon: fallback.icon
      }
    : {
        subtitle: description,
        details: buildDetails({ details: [], description }),
        badge: normalizeCategoryLabel(record.normalizedCategory ?? record.category, "product"),
        ...buildCatalogItemBase({
          type: "product",
          title: record.title,
          slug: record.slug,
          description,
          details: []
        })
      };

  const gallery =
    Array.isArray(record.gallery) && record.gallery.every((entry) => typeof entry === "string")
      ? (record.gallery as string[])
      : record.media.map((entry) => entry.path);

  return {
    id: record.sourceId ?? record.id,
    slug: record.slug,
    type: "product",
    title: record.title,
    category: normalizeCategoryLabel(record.normalizedCategory ?? record.category, "product"),
    normalizedCategory: normalizeCategoryLabel(
      record.normalizedCategory ?? record.category,
      "product"
    ),
    subtitle: base.subtitle,
    description,
    shortDescription: record.shortDescription ?? undefined,
    fullDescription: record.fullDescription ?? undefined,
    price: record.priceRub ?? 0,
    priceRub: record.priceRub,
    priceUsd: record.priceUsd,
    priceLabel: record.priceLabel ?? createPriceLabel({ price: record.priceRub ?? 0, type: "product" }),
    badge: base.badge,
    availability: availabilityLabel(record.availabilityStatus),
    availabilityStatus: record.availabilityStatus,
    publicationStatus: record.publicationStatus,
    icon: base.icon,
    accent: base.accent,
    details: base.details,
    image: record.image ?? gallery[0] ?? undefined,
    gallery: gallery.length > 0 ? gallery : buildGallery(record.image ?? undefined),
    tags: Array.isArray(record.tags) ? record.tags.filter((entry): entry is string => typeof entry === "string") : [],
    quantity: record.quantity,
    needsReview: record.needsReview,
    sourceId: record.sourceId ?? undefined,
    sourcePlatform: record.sourcePlatform ?? undefined,
    sourceUrl: record.sourceUrl ?? undefined
  };
}

function mapServiceRecord(record: {
  id: string;
  sourceId: string | null;
  slug: string;
  title: string;
  shortDescription: string | null;
  fullDescription: string | null;
  priceRub: number | null;
  priceUsd: number | null;
  priceLabel: string | null;
  category: string | null;
  normalizedCategory: string | null;
  publicationStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  image: string | null;
  gallery: Prisma.JsonValue | null;
  tags: Prisma.JsonValue | null;
  needsReview: boolean;
  sourcePlatform: string | null;
  sourceUrl: string | null;
  media: Array<{ path: string }>;
}): CatalogItem {
  const fallback = getFallbackServiceBySlug(record.slug);
  const description = getCatalogDescription(record);
  const base = fallback
    ? {
        subtitle: fallback.subtitle,
        details: fallback.details,
        badge: fallback.badge,
        accent: fallback.accent,
        icon: fallback.icon
      }
    : {
        subtitle: description,
        details: buildDetails({ details: [], description }),
        badge: normalizeCategoryLabel(record.normalizedCategory ?? record.category, "service"),
        ...buildCatalogItemBase({
          type: "service",
          title: record.title,
          slug: record.slug,
          description,
          details: []
        })
      };

  const gallery =
    Array.isArray(record.gallery) && record.gallery.every((entry) => typeof entry === "string")
      ? (record.gallery as string[])
      : record.media.map((entry) => entry.path);

  return {
    id: record.sourceId ?? record.id,
    slug: record.slug,
    type: "service",
    title: record.title,
    category: normalizeCategoryLabel(record.normalizedCategory ?? record.category, "service"),
    normalizedCategory: normalizeCategoryLabel(
      record.normalizedCategory ?? record.category,
      "service"
    ),
    subtitle: base.subtitle,
    description,
    shortDescription: record.shortDescription ?? undefined,
    fullDescription: record.fullDescription ?? undefined,
    price: record.priceRub ?? 0,
    priceRub: record.priceRub,
    priceUsd: record.priceUsd,
    priceLabel: record.priceLabel ?? createPriceLabel({ price: record.priceRub ?? 0, type: "service" }),
    badge: base.badge,
    publicationStatus: record.publicationStatus,
    icon: base.icon,
    accent: base.accent,
    details: base.details,
    image: record.image ?? gallery[0] ?? undefined,
    gallery: gallery.length > 0 ? gallery : buildGallery(record.image ?? undefined),
    tags: Array.isArray(record.tags) ? record.tags.filter((entry): entry is string => typeof entry === "string") : [],
    needsReview: record.needsReview,
    sourceId: record.sourceId ?? undefined,
    sourcePlatform: record.sourcePlatform ?? undefined,
    sourceUrl: record.sourceUrl ?? undefined
  };
}

const loadProducts = cache(async () =>
  withFallback(
    async () => {
      const records = await prisma.product.findMany({
        orderBy: { createdAt: "asc" },
        include: { media: { select: { path: true } } }
      });
      return records.map(mapProductRecord);
    },
    () => getFallbackProducts(),
    "getProducts"
  )
);

const loadPublishedProducts = cache(async () =>
  withFallback(
    async () => {
      const records = await prisma.product.findMany({
        where: { publicationStatus: "PUBLISHED" },
        orderBy: { createdAt: "asc" },
        include: { media: { select: { path: true } } }
      });
      return records.map(mapProductRecord);
    },
    () => getFallbackProducts(),
    "getPublishedProducts"
  )
);

const loadServices = cache(async () =>
  withFallback(
    async () => {
      const records = await prisma.service.findMany({
        orderBy: { createdAt: "asc" },
        include: { media: { select: { path: true } } }
      });
      return records.map(mapServiceRecord);
    },
    () => getFallbackServices(),
    "getServices"
  )
);

const loadPublishedServices = cache(async () =>
  withFallback(
    async () => {
      const records = await prisma.service.findMany({
        where: { publicationStatus: "PUBLISHED" },
        orderBy: { createdAt: "asc" },
        include: { media: { select: { path: true } } }
      });
      return records.map(mapServiceRecord);
    },
    () => getFallbackServices(),
    "getPublishedServices"
  )
);

export async function getProducts() {
  return loadProducts();
}

export async function getPublishedProducts() {
  return loadPublishedProducts();
}

export async function getProductBySlug(slug: string) {
  const products = await getPublishedProducts();
  return products.find((product) => product.slug === slug) ?? getFallbackProductBySlug(slug) ?? null;
}

export async function getServices() {
  return loadServices();
}

export async function getPublishedServices() {
  return loadPublishedServices();
}

export async function getServiceBySlug(slug: string) {
  const services = await getPublishedServices();
  return services.find((service) => service.slug === slug) ?? getFallbackServiceBySlug(slug) ?? null;
}

export async function getFeaturedProducts(limit = 6) {
  const products = await getPublishedProducts();
  return products.filter((item) => item.image).slice(0, limit);
}

export async function getFeaturedServices(limit = 3) {
  const services = await getPublishedServices();
  return services.filter((item) => item.image).slice(0, limit);
}

export async function getCatalogCounts() {
  const [products, services] = await Promise.all([getPublishedProducts(), getPublishedServices()]);
  return {
    products: products.length,
    services: services.length
  };
}
