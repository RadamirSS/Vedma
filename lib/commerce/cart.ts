import { Currency } from "@prisma/client";

import { getSiteSettings } from "@/lib/admin/settings";
import { getPublishedProducts, getPublishedServices } from "@/lib/catalog/repository";
import type { CatalogItem } from "@/lib/catalog-types";
import { prisma } from "@/lib/db/prisma";
import type { Locale } from "@/lib/i18n/config";

export type CartEntry = {
  type: "product" | "service";
  slug: string;
  qty: number;
};

export type ResolvedCartItem = {
  catalogId: string | null;
  slug: string;
  type: "product" | "service";
  title: string;
  image?: string;
  quantity: number;
  maxQuantity: number | null;
  unitAmount: number;
  currency: Currency;
  priceRub: number | null;
  priceUsd: number | null;
  priceIsFrom?: boolean;
  detailHref: string;
  sourceId?: string;
};

function getItemAmount(item: CatalogItem, currency: Currency) {
  if (currency === "USD") {
    return item.priceUsd ?? item.priceRub ?? item.price;
  }
  return item.priceRub ?? item.priceUsd ?? item.price;
}

function normalizeQuantity(item: CatalogItem, qty: number) {
  if (item.type === "service") {
    return 1;
  }

  if (item.quantity && item.quantity > 0) {
    return Math.max(1, Math.min(qty, item.quantity));
  }

  return Math.max(1, qty);
}

export async function getActiveCurrency() {
  const settings = await getSiteSettings();
  return settings.currencies.primary === "USD" ? Currency.USD : Currency.RUB;
}

export async function getPublishedCatalogMap(locale: Locale = "ru") {
  const [products, services, productRecords, serviceRecords] = await Promise.all([
    getPublishedProducts(locale),
    getPublishedServices(locale),
    process.env.DATABASE_URL
      ? prisma.product.findMany({
          where: { publicationStatus: "PUBLISHED" },
          select: { id: true, slug: true }
        })
      : Promise.resolve([]),
    process.env.DATABASE_URL
      ? prisma.service.findMany({
          where: { publicationStatus: "PUBLISHED" },
          select: { id: true, slug: true }
        })
      : Promise.resolve([])
  ]);

  const productIds = new Map(productRecords.map((item) => [item.slug, item.id]));
  const serviceIds = new Map(serviceRecords.map((item) => [item.slug, item.id]));

  return {
    products: new Map(products.map((item) => [item.slug, { item, catalogId: productIds.get(item.slug) ?? null }])),
    services: new Map(services.map((item) => [item.slug, { item, catalogId: serviceIds.get(item.slug) ?? null }]))
  };
}

export async function resolveCartEntries(entries: CartEntry[], locale: Locale = "ru") {
  const currency = await getActiveCurrency();
  const { products, services } = await getPublishedCatalogMap(locale);

  const resolved: ResolvedCartItem[] = [];

  for (const entry of entries) {
    const match = entry.type === "product" ? products.get(entry.slug) : services.get(entry.slug);
    if (!match) {
      continue;
    }

    const { item, catalogId } = match;

    const quantity = normalizeQuantity(item, entry.qty);

    resolved.push({
      catalogId,
      slug: item.slug,
      type: item.type,
      title: item.title,
      image: item.image,
      quantity,
      maxQuantity: item.type === "product" ? (item.quantity ?? null) : 1,
      unitAmount: getItemAmount(item, currency),
      currency,
      priceRub: item.priceRub ?? null,
      priceUsd: item.priceUsd ?? null,
      priceIsFrom: item.priceIsFrom,
      detailHref: item.type === "product" ? `/products/${item.slug}` : `/services/${item.slug}`,
      sourceId: item.sourceId
    });
  }

  return resolved;
}

export function getCartTotals(items: ResolvedCartItem[]) {
  return items.reduce(
    (acc, item) => {
      acc.totalAmount += item.unitAmount * item.quantity;
      if (item.priceRub) {
        acc.totalAmountRub += item.priceRub * item.quantity;
      }
      if (item.priceUsd) {
        acc.totalAmountUsd += item.priceUsd * item.quantity;
      }
      if (item.type === "product") {
        acc.deliveryRequired = true;
        acc.hasProducts = true;
      }
      if (item.type === "service") {
        acc.hasServices = true;
      }
      return acc;
    },
    {
      totalAmount: 0,
      totalAmountRub: 0,
      totalAmountUsd: 0,
      deliveryRequired: false,
      hasProducts: false,
      hasServices: false
    }
  );
}
