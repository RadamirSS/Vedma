import { createReadStream, existsSync } from "node:fs";
import path from "node:path";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";

import { NextResponse } from "next/server";

const MIME_BY_EXTENSION: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp"
};

function resolveAdminUploadPath(segments: string[]) {
  const joined = segments.join("/");
  if (!joined || joined.includes("..")) {
    return null;
  }

  const root = path.join(process.cwd(), "public", "uploads", "admin");
  const absolutePath = path.join(root, joined);
  const normalizedRoot = path.resolve(root);
  const normalizedTarget = path.resolve(absolutePath);

  if (!normalizedTarget.startsWith(normalizedRoot)) {
    return null;
  }

  return normalizedTarget;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await context.params;
  const absolutePath = resolveAdminUploadPath(segments);

  if (!absolutePath || !existsSync(absolutePath)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const fileStat = await stat(absolutePath);
  if (!fileStat.isFile()) {
    return new NextResponse("Not found", { status: 404 });
  }

  const extension = path.extname(absolutePath).toLowerCase();
  const contentType = MIME_BY_EXTENSION[extension] ?? "application/octet-stream";
  const stream = createReadStream(absolutePath);
  const webStream = Readable.toWeb(stream) as ReadableStream<Uint8Array>;

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
      "Content-Length": String(fileStat.size)
    }
  });
}
