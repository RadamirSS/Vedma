import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const EXPECTED_PRODUCTS = 71;
const EXPECTED_SERVICES = Number(process.env.EXPECTED_SERVICES ?? 26);
const repoRoot = process.cwd();
const docsDir = path.join(repoRoot, "docs", "migration");
const reportPath = path.join(docsDir, "package-1-verification-report.md");

type Finding = {
  level: "ERROR" | "WARN";
  message: string;
};

function imageExists(imagePath: string) {
  const absolutePath = path.join(repoRoot, "public", imagePath.replace(/^\/+uploads\//, "uploads/"));
  return existsSync(absolutePath);
}

async function main() {
  const findings: Finding[] = [];
  const allowMismatch = process.env.ALLOW_VERIFY_COUNT_MISMATCH === "true";

  const [products, services, media] = await Promise.all([
    prisma.product.findMany(),
    prisma.service.findMany(),
    prisma.media.findMany()
  ]);

  if (!allowMismatch && products.length !== EXPECTED_PRODUCTS) {
    findings.push({
      level: "ERROR",
      message: `Expected ${EXPECTED_PRODUCTS} products, found ${products.length}.`
    });
  }

  if (!allowMismatch && services.length !== EXPECTED_SERVICES) {
    findings.push({
      level: "ERROR",
      message: `Expected ${EXPECTED_SERVICES} services, found ${services.length}.`
    });
  }

  const duplicateProductSlugs = products.filter(
    (product, index) => products.findIndex((entry) => entry.slug === product.slug) !== index
  );
  const duplicateServiceSlugs = services.filter(
    (service, index) => services.findIndex((entry) => entry.slug === service.slug) !== index
  );

  if (duplicateProductSlugs.length > 0 || duplicateServiceSlugs.length > 0) {
    findings.push({ level: "ERROR", message: "Duplicate slugs detected in the catalog tables." });
  }

  for (const product of products) {
    if (!product.title.trim()) {
      findings.push({ level: "ERROR", message: `Product ${product.id} is missing title.` });
    }
    if (!product.slug.trim()) {
      findings.push({ level: "ERROR", message: `Product ${product.id} is missing slug.` });
    }
    if (!product.image) {
      findings.push({ level: "WARN", message: `Product ${product.slug} is missing image.` });
    } else if (!imageExists(product.image)) {
      findings.push({
        level: "WARN",
        message: `Product ${product.slug} references missing image ${product.image}.`
      });
    }
    if ((product.normalizedCategory ?? "").match(/[A-Za-z]/)) {
      findings.push({
        level: "WARN",
        message: `Product ${product.slug} has English category label ${product.normalizedCategory}.`
      });
    }
  }

  for (const service of services) {
    if (!service.title.trim()) {
      findings.push({ level: "ERROR", message: `Service ${service.id} is missing title.` });
    }
    if (!service.slug.trim()) {
      findings.push({ level: "ERROR", message: `Service ${service.id} is missing slug.` });
    }
    if (!service.image) {
      findings.push({ level: "WARN", message: `Service ${service.slug} is missing image.` });
    } else if (!imageExists(service.image)) {
      findings.push({
        level: "WARN",
        message: `Service ${service.slug} references missing image ${service.image}.`
      });
    }
    if ((service.normalizedCategory ?? "").match(/[A-Za-z]/)) {
      findings.push({
        level: "WARN",
        message: `Service ${service.slug} has English category label ${service.normalizedCategory}.`
      });
    }
  }

  await mkdir(docsDir, { recursive: true });
  await writeFile(
    reportPath,
    `# Package 1 Verification Report\n\n` +
      `- Date: ${new Date().toISOString()}\n` +
      `- Products checked: ${products.length}\n` +
      `- Services checked: ${services.length}\n` +
      `- Media checked: ${media.length}\n` +
      `- Errors: ${findings.filter((finding) => finding.level === "ERROR").length}\n` +
      `- Warnings: ${findings.filter((finding) => finding.level === "WARN").length}\n\n` +
      (findings.length > 0
        ? findings.map((finding) => `- ${finding.level}: ${finding.message}`).join("\n")
        : "- OK: critical verification checks passed.") +
      "\n",
    "utf8"
  );

  if (findings.some((finding) => finding.level === "ERROR")) {
    process.exitCode = 1;
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
