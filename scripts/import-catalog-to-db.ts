import { existsSync, statSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { PrismaClient } from "@prisma/client";

import { products, services } from "../lib/catalog-data";
import type { CatalogItem } from "../lib/catalog-types";
import {
  buildGallery,
  createPriceLabel,
  deriveAvailabilityStatus,
  inferSourcePlatform,
  normalizeCategoryLabel
} from "../lib/catalog/normalize";

const prisma = new PrismaClient();
const EXPECTED_PRODUCTS = 71;
const EXPECTED_SERVICES = 2;
const repoRoot = process.cwd();
const docsDir = path.join(repoRoot, "docs", "migration");
const reportPath = path.join(docsDir, "package-1-import-report.md");

function assertExpectedCounts() {
  const allowMismatch = process.env.ALLOW_IMPORT_COUNT_MISMATCH === "true";
  if (
    (!allowMismatch && products.length !== EXPECTED_PRODUCTS) ||
    (!allowMismatch && services.length !== EXPECTED_SERVICES)
  ) {
    throw new Error(
      `Static catalog count mismatch: products=${products.length}, services=${services.length}. ` +
        "Set ALLOW_IMPORT_COUNT_MISMATCH=true to continue intentionally."
    );
  }
}

function getImageMetadata(imagePath?: string) {
  if (!imagePath) {
    return null;
  }

  const absolutePath = path.join(repoRoot, "public", imagePath.replace(/^\/+uploads\//, "uploads/"));
  if (!existsSync(absolutePath)) {
    return {
      path: imagePath,
      filename: path.basename(imagePath),
      size: null
    };
  }

  return {
    path: imagePath,
    filename: path.basename(imagePath),
    size: statSync(absolutePath).size
  };
}

async function upsertProduct(item: CatalogItem) {
  const normalizedCategory = normalizeCategoryLabel(item.category, "product");
  const image = getImageMetadata(item.image);
  const record = await prisma.product.upsert({
    where: { slug: item.slug },
    update: {
      sourceId: item.id,
      sourcePlatform: inferSourcePlatform(item),
      sourceUrl: item.sourceUrl ?? null,
      title: item.title,
      shortDescription: item.subtitle,
      fullDescription: item.details.join("\n\n"),
      priceRub: item.price,
      priceLabel: createPriceLabel(item),
      category: item.category,
      normalizedCategory,
      availabilityStatus: deriveAvailabilityStatus(item),
      publicationStatus: "PUBLISHED",
      image: item.image ?? null,
      gallery: buildGallery(item.image),
      tags: [],
      seoTitle: item.title,
      seoDescription: item.description,
      needsReview: false
    },
    create: {
      sourceId: item.id,
      sourcePlatform: inferSourcePlatform(item),
      sourceUrl: item.sourceUrl ?? null,
      title: item.title,
      slug: item.slug,
      shortDescription: item.subtitle,
      fullDescription: item.details.join("\n\n"),
      priceRub: item.price,
      priceLabel: createPriceLabel(item),
      category: item.category,
      normalizedCategory,
      availabilityStatus: deriveAvailabilityStatus(item),
      publicationStatus: "PUBLISHED",
      image: item.image ?? null,
      gallery: buildGallery(item.image),
      tags: [],
      seoTitle: item.title,
      seoDescription: item.description,
      needsReview: false
    }
  });

  if (image) {
    await prisma.media.upsert({
      where: { path: image.path },
      update: {
        filename: image.filename,
        mimeType: "image/jpeg",
        size: image.size,
        alt: item.title,
        sourcePlatform: inferSourcePlatform(item),
        sourceUrl: item.sourceUrl ?? null,
        productId: record.id,
        serviceId: null
      },
      create: {
        path: image.path,
        filename: image.filename,
        mimeType: "image/jpeg",
        size: image.size,
        alt: item.title,
        sourcePlatform: inferSourcePlatform(item),
        sourceUrl: item.sourceUrl ?? null,
        productId: record.id
      }
    });
  }

  return record;
}

async function upsertService(item: CatalogItem) {
  const normalizedCategory = normalizeCategoryLabel(item.category, "service");
  const image = getImageMetadata(item.image);
  const record = await prisma.service.upsert({
    where: { slug: item.slug },
    update: {
      sourceId: item.id,
      sourcePlatform: inferSourcePlatform(item),
      sourceUrl: item.sourceUrl ?? null,
      title: item.title,
      shortDescription: item.subtitle,
      fullDescription: item.details.join("\n\n"),
      priceRub: item.price,
      priceLabel: createPriceLabel(item),
      category: item.category,
      normalizedCategory,
      format: "Онлайн",
      publicationStatus: "PUBLISHED",
      image: item.image ?? null,
      gallery: buildGallery(item.image),
      tags: [],
      seoTitle: item.title,
      seoDescription: item.description,
      needsReview: false
    },
    create: {
      sourceId: item.id,
      sourcePlatform: inferSourcePlatform(item),
      sourceUrl: item.sourceUrl ?? null,
      title: item.title,
      slug: item.slug,
      shortDescription: item.subtitle,
      fullDescription: item.details.join("\n\n"),
      priceRub: item.price,
      priceLabel: createPriceLabel(item),
      category: item.category,
      normalizedCategory,
      format: "Онлайн",
      publicationStatus: "PUBLISHED",
      image: item.image ?? null,
      gallery: buildGallery(item.image),
      tags: [],
      seoTitle: item.title,
      seoDescription: item.description,
      needsReview: false
    }
  });

  if (image) {
    await prisma.media.upsert({
      where: { path: image.path },
      update: {
        filename: image.filename,
        mimeType: "image/jpeg",
        size: image.size,
        alt: item.title,
        sourcePlatform: inferSourcePlatform(item),
        sourceUrl: item.sourceUrl ?? null,
        productId: null,
        serviceId: record.id
      },
      create: {
        path: image.path,
        filename: image.filename,
        mimeType: "image/jpeg",
        size: image.size,
        alt: item.title,
        sourcePlatform: inferSourcePlatform(item),
        sourceUrl: item.sourceUrl ?? null,
        serviceId: record.id
      }
    });
  }

  return record;
}

async function writeReport() {
  const productCount = await prisma.product.count();
  const serviceCount = await prisma.service.count();
  const mediaCount = await prisma.media.count();
  const duplicateProducts = await prisma.product.groupBy({
    by: ["slug"],
    _count: true,
    having: { slug: { _count: { gt: 1 } } }
  });
  const duplicateServices = await prisma.service.groupBy({
    by: ["slug"],
    _count: true,
    having: { slug: { _count: { gt: 1 } } }
  });

  await mkdir(docsDir, { recursive: true });
  await writeFile(
    reportPath,
    `# Package 1 Import Report\n\n` +
      `- Date: ${new Date().toISOString()}\n` +
      `- Source catalog products: ${products.length}\n` +
      `- Source catalog services: ${services.length}\n` +
      `- Imported products in DB: ${productCount}\n` +
      `- Imported services in DB: ${serviceCount}\n` +
      `- Media records in DB: ${mediaCount}\n` +
      `- Duplicate products: ${duplicateProducts.length}\n` +
      `- Duplicate services: ${duplicateServices.length}\n` +
      `- Image paths preserved: yes\n` +
      `- Source of truth: lib/catalog-data.ts\n`,
    "utf8"
  );
}

async function main() {
  assertExpectedCounts();

  for (const item of products) {
    await upsertProduct(item);
  }

  for (const item of services) {
    await upsertService(item);
  }

  await writeReport();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
