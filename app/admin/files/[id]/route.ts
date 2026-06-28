import { readFile } from "node:fs/promises";

import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin("/admin/orders");
  const { id } = await params;
  const file = await prisma.customerFile.findUnique({
    where: { id }
  });

  if (!file) {
    return new Response("Not found", { status: 404 });
  }

  const bytes = await readFile(file.storedPath);
  return new Response(bytes, {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(file.originalName)}"`
    }
  });
}
