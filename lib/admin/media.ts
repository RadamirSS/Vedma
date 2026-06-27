import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { prisma } from "@/lib/db/prisma";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

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

export async function storeUploadedFile(file: File) {
  if (!allowedTypes.has(file.type)) {
    throw new Error("Допустимы только JPG, PNG и WEBP.");
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("Размер изображения не должен превышать 5 МБ.");
  }

  const now = new Date();
  const dir = `/uploads/admin/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
  const absoluteDir = publicPathToAbsolute(dir);
  await mkdir(absoluteDir, { recursive: true });

  const filename = `${Date.now()}-${safeFilename(file.name)}`;
  const publicPath = `${dir}/${filename}`;
  const absolutePath = publicPathToAbsolute(publicPath);
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(absolutePath, bytes);

  return {
    publicPath,
    filename,
    mimeType: file.type,
    size: file.size
  };
}

export async function replaceStoredFile(existingPath: string, file: File) {
  if (!allowedTypes.has(file.type)) {
    throw new Error("Допустимы только JPG, PNG и WEBP.");
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("Размер изображения не должен превышать 5 МБ.");
  }

  const absolutePath = publicPathToAbsolute(existingPath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, Buffer.from(await file.arrayBuffer()));

  return {
    path: existingPath,
    filename: path.basename(existingPath),
    mimeType: file.type,
    size: file.size
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

  const absolutePath = publicPathToAbsolute(media.path);
  await prisma.media.delete({ where: { id } });

  try {
    await unlink(absolutePath);
  } catch {
    // Keep DB as source of truth for admin; missing files are tolerated here.
  }
}
