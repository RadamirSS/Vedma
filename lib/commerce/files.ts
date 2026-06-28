import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/db/prisma";

const MAX_PDF_SIZE = 10 * 1024 * 1024;
const PDF_MIME_TYPE = "application/pdf";

export function privateFilesRoot() {
  return path.join(process.cwd(), "private", "customer-files");
}

export async function storePrivatePdf(file: File, customerId: string) {
  if (file.type !== PDF_MIME_TYPE) {
    throw new Error("Разрешены только PDF-файлы.");
  }

  if (!file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Разрешены только PDF-файлы.");
  }

  if (file.size > MAX_PDF_SIZE) {
    throw new Error("PDF не должен превышать 10 МБ.");
  }

  const root = privateFilesRoot();
  await mkdir(root, { recursive: true });

  const storedName = `${customerId}-${randomUUID()}.pdf`;
  const absolutePath = path.join(root, storedName);
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(absolutePath, bytes);

  return prisma.customerFile.create({
    data: {
      customerId,
      originalName: file.name,
      storedPath: absolutePath,
      mimeType: file.type,
      size: file.size,
      adminOnly: true
    }
  });
}
