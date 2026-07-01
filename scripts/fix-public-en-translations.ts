import { readFile } from "node:fs/promises";
import path from "node:path";

import { Prisma, PrismaClient } from "@prisma/client";

type ServiceTranslation = {
  title?: string;
  shortDescription?: string;
  description?: string;
  fullDescription?: string;
};

type ImportTranslationsFile = {
  bySourceId: Record<string, ServiceTranslation>;
};

type LegacyTranslationsFile = {
  bySlug: Record<string, ServiceTranslation>;
};

const prisma = new PrismaClient();
const repoRoot = process.cwd();

function hasCompleteEnTranslation(translations: Prisma.JsonValue | null | undefined) {
  if (!translations || typeof translations !== "object" || Array.isArray(translations)) {
    return false;
  }

  const en = (translations as Record<string, unknown>).en;
  if (!en || typeof en !== "object" || Array.isArray(en)) {
    return false;
  }

  const title = (en as Record<string, unknown>).title;
  return typeof title === "string" && title.trim().length > 0;
}

function mergeTranslations(
  current: Prisma.JsonValue | null | undefined,
  patch: ServiceTranslation
) {
  const base =
    current && typeof current === "object" && !Array.isArray(current)
      ? (current as Record<string, unknown>)
      : {};

  const currentEn =
    base.en && typeof base.en === "object" && !Array.isArray(base.en)
      ? (base.en as Record<string, unknown>)
      : {};

  return {
    ...base,
    en: {
      ...currentEn,
      ...patch
    }
  } satisfies Prisma.InputJsonValue;
}

async function loadJson<T>(relativePath: string) {
  const absolutePath = path.join(repoRoot, relativePath);
  const raw = await readFile(absolutePath, "utf8");
  return JSON.parse(raw) as T;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const dryRun = !apply || process.argv.includes("--dry-run");

  const [importTranslations, legacyTranslations] = await Promise.all([
    loadJson<ImportTranslationsFile>("data/vk-services/normalized/services.import-translations.en.json"),
    loadJson<LegacyTranslationsFile>("data/catalog/legacy-services-en.json")
  ]);

  const services = await prisma.service.findMany({
    where: { publicationStatus: "PUBLISHED" },
    select: {
      id: true,
      slug: true,
      sourceId: true,
      title: true,
      translations: true
    }
  });

  let updated = 0;
  let skipped = 0;

  for (const service of services) {
    if (hasCompleteEnTranslation(service.translations)) {
      skipped += 1;
      continue;
    }

    const fromSourceId = service.sourceId
      ? importTranslations.bySourceId[service.sourceId]
      : undefined;
    const fromSlug = legacyTranslations.bySlug[service.slug];
    const patch = fromSourceId ?? fromSlug;

    if (!patch?.title?.trim()) {
      skipped += 1;
      console.warn(`[skip] No EN patch for ${service.slug} (${service.sourceId ?? "no sourceId"})`);
      continue;
    }

    const nextTranslations = mergeTranslations(service.translations, patch);

    if (dryRun) {
      console.log(`[dry-run] Would update ${service.slug}: ${patch.title}`);
    } else {
      await prisma.service.update({
        where: { id: service.id },
        data: { translations: nextTranslations }
      });
      console.log(`[apply] Updated ${service.slug}: ${patch.title}`);
    }

    updated += 1;
  }

  console.log(
    JSON.stringify(
      {
        mode: dryRun ? "dry-run" : "apply",
        total: services.length,
        updated,
        skipped
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
