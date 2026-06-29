import Link from "next/link";

import { saveMediaUploadAction } from "@/app/admin/actions";
import { AdminNotice } from "@/components/admin/admin-notice";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminReadOnlyNotice } from "@/components/admin/admin-read-only-notice";
import { SubmitButton } from "@/components/admin/submit-button";
import { buildPagination, parseSearchParam } from "@/lib/admin/format";
import { isReadOnlyAdminRole, requireAdminSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

const PAGE_SIZE = 20;

export default async function AdminMediaPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const session = await requireAdminSession("/admin/media");
  const isReadOnly = isReadOnlyAdminRole(session.user.role);
  const q = parseSearchParam(params.q);
  const page = Number.parseInt(parseSearchParam(params.page, "1"), 10) || 1;
  const query = new URLSearchParams();
  if (q) query.set("q", q);
  const success = typeof params.success === "string" ? params.success : undefined;
  const error = typeof params.error === "string" ? params.error : undefined;

  const where = q
    ? {
        OR: [
          { filename: { contains: q, mode: "insensitive" as const } },
          { path: { contains: q, mode: "insensitive" as const } },
          { alt: { contains: q, mode: "insensitive" as const } }
        ]
      }
    : undefined;

  const total = await prisma.media.count({ where });
  const pagination = buildPagination(page, total, PAGE_SIZE);
  const items = await prisma.media.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    skip: pagination.skip,
    take: pagination.pageSize
  });

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-title">
          <span className="eyebrow">Медиатека</span>
          <h1>Управление медиа</h1>
          <p>Загруженные изображения, alt-тексты и замена файлов без потери публичных ссылок.</p>
        </div>
      </div>
      <AdminNotice success={success} error={error} />
      {isReadOnly ? <AdminReadOnlyNotice text="Демо-аккаунт может просматривать медиатеку, но не может загружать, заменять или удалять файлы." /> : null}
      <div className="admin-toolbar">
        <form>
          <input className="admin-input" name="q" placeholder="Поиск по имени, alt или пути" defaultValue={q} />
          <div />
          <div />
          <button className="btn btn-ghost" type="submit">
            Поиск
          </button>
        </form>
      </div>
      {!isReadOnly ? (
        <form action={saveMediaUploadAction} className="admin-card admin-form-grid">
          <label><span>Файл</span><input className="admin-input" type="file" name="file" accept="image/jpeg,image/png,image/webp" required /></label>
          <label><span>Alt text</span><input className="admin-input" name="alt" /></label>
          <div className="full admin-actions-row"><SubmitButton className="btn btn-primary">Загрузить</SubmitButton></div>
        </form>
      ) : null}
      <div className="admin-grid">
        {items.map((item) => (
          <Link key={item.id} href={`/admin/media/${item.id}`} className="admin-media-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.path} alt={item.alt ?? ""} />
            <strong>{item.filename}</strong>
            <span>{item.alt ?? "Без alt"}</span>
            <small>{item.path}</small>
          </Link>
        ))}
      </div>
      <AdminPagination page={pagination.page} totalPages={pagination.totalPages} basePath="/admin/media" query={query} />
    </div>
  );
}
