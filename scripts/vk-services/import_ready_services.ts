import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { PrismaClient, type PublicationStatus } from "@prisma/client";

import { buildGallery } from "../../lib/catalog/normalize";
import {
  buildPriceLabel,
  cleanShortDescriptionRu,
  isLowQualityVkImage,
  normalizeTitleRu,
  resolvePlaceholderImage,
  resolvePublicationStatus,
  resolveServiceCategory,
  resolveTargetSlug,
  VK_SERVICE_MERGE_BY_SOURCE,
  type VkEnTranslationsFile,
  type VkImportCandidatesFile
} from "../../lib/vk-services/import-utils";

const prisma = new PrismaClient();
const repoRoot = process.cwd();
const candidatesPath = path.join(repoRoot, "data/vk-services/normalized/services.import-candidates.json");
const translationsPath = path.join(
  repoRoot,
  "data/vk-services/normalized/services.import-translations.en.json"
);
const reportPath = path.join(repoRoot, "data/vk-services/reports/import-ready-services-report.md");

const applyMode = process.argv.includes("--apply");
const dryRun = process.argv.includes("--dry-run") || !applyMode;

type Action = "create" | "update" | "skip";

type PlannedChange = {
  sourceId: string;
  slug: string;
  action: Action;
  publicationStatus: PublicationStatus;
  titleRu: string;
  priceRub: number | null;
  image: string | null;
  imageStrategy: string;
  mergeNote?: string;
  needsOwnerReview?: boolean;
  fromPrice?: boolean;
};

type ReportCounters = {
  candidates: number;
  imported: number;
  updated: number;
  skipped: number;
  published: number;
  draft: number;
  merged: number;
};

function loadJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

function ensureParentDir(filePath: string) {
  mkdirSync(path.dirname(filePath), { recursive: true });
}

function resolveImage(
  candidate: VkImportCandidatesFile["services"][number],
  targetSlug: string,
  preserveExistingImage: boolean,
  existingImage: string | null | undefined
): { image: string | null; strategy: string } {
  if (preserveExistingImage && existingImage) {
    return { image: existingImage, strategy: "kept-existing-upload" };
  }

  const localScreenshot = candidate.localImagePath
    ? path.join(repoRoot, candidate.localImagePath)
    : null;

  if (localScreenshot && existsSync(localScreenshot)) {
    const publicImage = `/uploads/vk/services/${targetSlug}/cover.jpg`;
    return {
      image: publicImage,
      strategy: applyMode ? "screenshot-copied-to-public" : "screenshot-will-copy-on-apply"
    };
  }

  if (!isLowQualityVkImage(candidate.imageSource) && candidate.imageSource?.startsWith("http")) {
    return { image: null, strategy: "external-vk-url-skipped-use-placeholder" };
  }

  return {
    image: resolvePlaceholderImage(candidate.directionSuggestion),
    strategy: "category-placeholder"
  };
}

function copyScreenshotIfNeeded(
  candidate: VkImportCandidatesFile["services"][number],
  targetSlug: string,
  strategy: string
) {
  if (!applyMode || !strategy.startsWith("screenshot")) {
    return;
  }
  const localScreenshot = candidate.localImagePath
    ? path.join(repoRoot, candidate.localImagePath)
    : null;
  if (!localScreenshot || !existsSync(localScreenshot)) {
    return;
  }
  const publicDir = path.join(repoRoot, "public", "uploads", "vk", "services", targetSlug);
  mkdirSync(publicDir, { recursive: true });
  copyFileSync(localScreenshot, path.join(publicDir, "cover.jpg"));
}

const KNOWN_EXISTING_SLUGS = new Set([
  "diagnostika-negativa",
  "transformatsionnaya-igra-denezhnyy-magnit"
]);

const OFFLINE_EXISTING_IMAGES: Record<string, string> = {
  "diagnostika-negativa": "/uploads/vk/services/diagnostika-negativa/cover.jpg",
  "transformatsionnaya-igra-denezhnyy-magnit":
    "/uploads/vk/services/transformazionnaa-igra-denejnyy-magnit/cover.jpg"
};

async function findExistingService(slug: string, sourceId: string) {
  try {
    const existingBySlug = await prisma.service.findUnique({ where: { slug } });
    const existingBySource = await prisma.service.findFirst({ where: { sourceId } });
    return existingBySlug ?? existingBySource;
  } catch (error) {
    if (!dryRun) {
      throw error;
    }
    if (KNOWN_EXISTING_SLUGS.has(slug)) {
      return { slug, image: OFFLINE_EXISTING_IMAGES[slug] ?? null };
    }
    return null;
  }
}

async function planChanges(): Promise<{
  planned: PlannedChange[];
  imageReplacement: string[];
  ownerReview: string[];
  fromPrice: string[];
}> {
  const data = loadJson<VkImportCandidatesFile>(candidatesPath);
  const translations = loadJson<VkEnTranslationsFile>(translationsPath);
  const ready = data.services.filter((entry) => entry.readyForImport);

  const planned: PlannedChange[] = [];
  const imageReplacement: string[] = [];
  const ownerReview: string[] = [];
  const fromPrice: string[] = [];

  for (const candidate of ready) {
    const slug = resolveTargetSlug(candidate);
    const merge = VK_SERVICE_MERGE_BY_SOURCE[candidate.sourceId];
    const existing = await findExistingService(slug, candidate.sourceId);

    const titleRu = normalizeTitleRu(candidate.titleRu);
    const shortDescriptionRu = cleanShortDescriptionRu(
      candidate.shortDescriptionRu,
      candidate.descriptionRu ?? ""
    );
    const fullDescription = (candidate.descriptionRu ?? "").trim();
    const publicationStatus = resolvePublicationStatus(candidate.sourceId, titleRu);
    const priceRub = candidate.priceAmountRub ?? null;
    const priceLabel = buildPriceLabel(priceRub, candidate.priceRaw);
    const fromPriceFlag = (candidate.priceRaw ?? "").toLowerCase().includes("от");

    const { image, strategy } = resolveImage(
      candidate,
      slug,
      Boolean(merge?.preserveImage),
      existing?.image
    );

    if (strategy.includes("placeholder") || strategy.includes("screenshot")) {
      imageReplacement.push(`${slug} (${candidate.sourceId}): ${strategy}`);
    }
    if (publicationStatus === "DRAFT") {
      ownerReview.push(`${slug} (${candidate.sourceId}): seasonal/draft rule`);
    }
    if (fromPriceFlag) {
      fromPrice.push(`${slug}: ${candidate.priceRaw?.trim() ?? "from-price"}`);
    }

    let action: Action = "create";
    let mergeNote: string | undefined;
    if (existing) {
      action = "update";
      if (merge) {
        mergeNote = `Merged VK «${titleRu}» into existing slug «${slug}»`;
      }
    }

    planned.push({
      sourceId: candidate.sourceId,
      slug,
      action,
      publicationStatus,
      titleRu,
      priceRub,
      image,
      imageStrategy: strategy,
      mergeNote,
      needsOwnerReview: publicationStatus === "DRAFT",
      fromPrice: fromPriceFlag
    });

    if (applyMode) {
      copyScreenshotIfNeeded(candidate, slug, strategy);

      const en = translations.bySourceId[candidate.sourceId];
      const translationsPayload = {
        ru: {
          title: titleRu,
          shortDescription: shortDescriptionRu,
          description: fullDescription
        },
        en: en
          ? {
              title: en.title,
              shortDescription: en.shortDescription,
              description: en.description
            }
          : undefined
      };

      const category = resolveServiceCategory(candidate.directionSuggestion);
      const payload = {
        sourceId: candidate.sourceId,
        sourcePlatform: "vk",
        sourceUrl: candidate.sourceItemUrl ?? null,
        title: titleRu,
        shortDescription: shortDescriptionRu,
        fullDescription,
        priceRub,
        priceLabel,
        category,
        normalizedCategory: category,
        format: "Онлайн",
        publicationStatus,
        image: image ?? existing?.image ?? null,
        gallery: buildGallery(image ?? existing?.image ?? undefined),
        translations: translationsPayload,
        seoTitle: titleRu,
        seoDescription: shortDescriptionRu,
        needsReview: publicationStatus === "DRAFT"
      };

      await prisma.service.upsert({
        where: { slug },
        update: payload,
        create: { ...payload, slug }
      });
    }
  }

  return { planned, imageReplacement, ownerReview, fromPrice };
}

function writeReport(
  planned: PlannedChange[],
  extras: {
    imageReplacement: string[];
    ownerReview: string[];
    fromPrice: string[];
  }
) {
  const counters: ReportCounters = {
    candidates: planned.length,
    imported: planned.filter((p) => p.action === "create").length,
    updated: planned.filter((p) => p.action === "update").length,
    skipped: 0,
    published: planned.filter((p) => p.publicationStatus === "PUBLISHED").length,
    draft: planned.filter((p) => p.publicationStatus === "DRAFT").length,
    merged: planned.filter((p) => p.mergeNote).length
  };

  ensureParentDir(reportPath);
  writeFileSync(
    reportPath,
    `# VK Ready Services Import Report\n\n` +
      `- Date: ${new Date().toISOString()}\n` +
      `- Mode: ${applyMode ? "apply" : "dry-run"}\n` +
      `- Total ready candidates: ${counters.candidates}\n` +
      `- Would create / created: ${counters.imported}\n` +
      `- Would update / updated: ${counters.updated}\n` +
      `- Skipped: ${counters.skipped}\n` +
      `- Published: ${counters.published}\n` +
      `- Draft: ${counters.draft}\n` +
      `- Duplicates merged: ${counters.merged}\n` +
      `- Not-ready services left out: 30 (see services.not-ready.json)\n\n` +
      `## Duplicate handling\n\n` +
      `- vk-service-052 → existing \`diagnostika-negativa\` (Диагностика негатива)\n\n` +
      `## Per service\n\n` +
      planned
        .map(
          (p) =>
            `- **${p.slug}** (${p.sourceId}): ${p.action}, ${p.publicationStatus}, ` +
            `${p.priceRub ?? "no price"} ₽, image: ${p.imageStrategy}` +
            (p.mergeNote ? ` — ${p.mergeNote}` : "")
        )
        .join("\n") +
      `\n\n## Services needing image replacement\n\n` +
      (extras.imageReplacement.length
        ? extras.imageReplacement.map((line) => `- ${line}`).join("\n")
        : "- None") +
      `\n\n## Owner review (draft / seasonal)\n\n` +
      (extras.ownerReview.length
        ? extras.ownerReview.map((line) => `- ${line}`).join("\n")
        : "- None") +
      `\n\n## From-price / tier notes\n\n` +
      (extras.fromPrice.length
        ? extras.fromPrice.map((line) => `- ${line}`).join("\n")
        : "- None") +
      `\n`,
    "utf8"
  );

  console.log(JSON.stringify(counters, null, 2));
}

async function main() {
  if (!existsSync(candidatesPath)) {
    throw new Error(`Missing ${candidatesPath}`);
  }
  if (!existsSync(translationsPath)) {
    throw new Error(`Missing ${translationsPath}`);
  }

  const { planned, imageReplacement, ownerReview, fromPrice } = await planChanges();
  writeReport(planned, { imageReplacement, ownerReview, fromPrice });

  if (dryRun) {
    console.log(`Dry-run complete. ${planned.length} services planned. Use --apply to write DB.`);
  } else {
    console.log(`Apply complete. ${planned.length} services upserted.`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
