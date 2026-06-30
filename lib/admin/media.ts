import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { prisma } from "@/lib/db/prisma";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const IMAGE_MIME_ERROR = "Допустимы только JPG, PNG и WEBP до 10 МБ.";
const STORAGE_WRITE_ERROR =
  "Не удалось записать файл на сервере. Проверьте storage/uploads.";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

const mimeByExtension: Record<string, "image/jpeg" | "image/png" | "image/webp"> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp"
};

export type StoredImageMime = "image/jpeg" | "image/png" | "image/webp";

export function getImageMimeType(file: File): StoredImageMime {
  if (allowedTypes.has(file.type)) {
    return file.type as StoredImageMime;
  }

  if (!file.type || file.type === "application/octet-stream") {
    const extension = path.extname(file.name).toLowerCase();
    const mime = mimeByExtension[extension];
    if (mime) {
      return mime;
    }
  }

  throw new Error(IMAGE_MIME_ERROR);
}

export function formatMediaStorageError(error: unknown): string {
  if (!(error instanceof Error)) {
    return STORAGE_WRITE_ERROR;
  }

  const message = error.message;
  if (message === IMAGE_MIME_ERROR || message.includes("10 МБ")) {
    return message;
  }

  if (/EACCES|EPERM|EROFS|ENOENT|ENOSPC/i.test(message)) {
    return STORAGE_WRITE_ERROR;
  }

  return message || STORAGE_WRITE_ERROR;
}

function safeFilename(name: string) {
  const extension = path.extname(name).toLowerCase();
  const base = path
    .basename(name, extension)
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `${base || "image"}${extension || ".jpg"}`;
}

function publicPathToAbsolute(publicPath: string) {
  return path.join(process.cwd(), "public", publicPath.replace(/^\//, ""));
}

function isAdminUploadPath(publicPath: string) {
  return publicPath.startsWith("/uploads/admin/");
}

async function safeUnlinkAdminFile(publicPath: string) {
  if (!isAdminUploadPath(publicPath)) {
    return;
  }

  try {
    await unlink(publicPathToAbsolute(publicPath));
  } catch {
    // Missing legacy files are tolerated.
  }
}

export async function storeUploadedFile(file: File) {
  const mimeType = getImageMimeType(file);

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("Размер изображения не должен превышать 10 МБ.");
  }

  const now = new Date();
  const dir = `/uploads/admin/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
  const absoluteDir = publicPathToAbsolute(dir);

  try {
    await mkdir(absoluteDir, { recursive: true });

    const filename = `${Date.now()}-${safeFilename(file.name)}`;
    const publicPath = `${dir}/${filename}`;
    const absolutePath = publicPathToAbsolute(publicPath);
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(absolutePath, bytes);

    return {
      publicPath,
      filename,
      mimeType,
      size: file.size
    };
  } catch (error) {
    throw new Error(formatMediaStorageError(error));
  }
}

export async function replaceStoredFile(existingPath: string, file: File) {
  const stored = await storeUploadedFile(file);
  await safeUnlinkAdminFile(existingPath);

  return {
    path: stored.publicPath,
    filename: stored.filename,
    mimeType: stored.mimeType,
    size: stored.size
  };
}

export async function deleteMediaFileIfUnlinked(id: string) {
  const media = await prisma.media.findUnique({
    where: { id }
  });

  if (!media) {
    throw new Error("Файл не найден.");
  }

  if (media.productId || media.serviceId) {
    throw new Error("Сначала отвяжите изображение от товара или услуги.");
  }

  await prisma.media.delete({ where: { id } });
  await safeUnlinkAdminFile(media.path);
}
