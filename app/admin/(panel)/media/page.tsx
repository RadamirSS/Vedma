import Link from "next/link";

import { saveMediaUploadAction } from "@/app/admin/actions";
import { AdminNotice } from "@/components/admin/admin-notice";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminReadOnlyNotice } from "@/components/admin/admin-read-only-notice";
import { SubmitButton } from "@/components/admin/submit-button";
import { buildPagination, parseSearchParam } from "@/lib/admin/format";
import { isReadOnlyAdminRole, requireAdminSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getAdminLocaleFromCookies } from "@/lib/i18n/admin/detect-locale";
import { getAdminDictionary } from "@/lib/i18n/admin/get-admin-dictionary";

const PAGE_SIZE = 20;

export default async function AdminMediaPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getAdminLocaleFromCookies();
  const dict = await getAdminDictionary(locale);
  const t = dict.media;
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
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p>{t.description}</p>
        </div>
      </div>
      <AdminNotice success={success} error={error} />
      {isReadOnly ? <AdminReadOnlyNotice text={dict.demoMode.media} /> : null}
      <div className="admin-toolbar">
        <form>
          <input className="admin-input" name="q" placeholder={dict.filters.searchMedia} defaultValue={q} />
          <div />
          <div />
          <button className="btn btn-ghost" type="submit">
            {dict.common.search}
          </button>
        </form>
      </div>
      {!isReadOnly ? (
        <form action={saveMediaUploadAction} className="admin-card admin-form-grid">
          <input type="hidden" name="adminLocale" value={locale} />
          <label>
            <span>{t.file}</span>
            <input className="admin-input" type="file" name="file" accept="image/jpeg,image/png,image/webp" required />
          </label>
          <label>
            <span>{t.altText}</span>
            <input className="admin-input" name="alt" />
          </label>
          <div className="full admin-actions-row">
            <SubmitButton className="btn btn-primary" pendingLabel={dict.common.uploading}>
              {t.upload}
            </SubmitButton>
          </div>
        </form>
      ) : null}
      <div className="admin-card">
        <h3>{t.siteMediaCard.title}</h3>
        <p>{t.siteMediaCard.description}</p>
        <Link className="btn btn-primary btn-small" href="/admin/media/site">
          {t.siteMediaCard.open}
        </Link>
      </div>
      <div className="admin-grid">
        {items.map((item) => (
          <Link key={item.id} href={`/admin/media/${item.id}`} className="admin-media-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.path} alt={item.alt ?? ""} loading="lazy" decoding="async" />
            <strong>{item.filename}</strong>
            <span>{item.alt ?? t.noAlt}</span>
            <small>{item.path}</small>
          </Link>
        ))}
      </div>
      <AdminPagination page={pagination.page} totalPages={pagination.totalPages} basePath="/admin/media" query={query} />
    </div>
  );
}
