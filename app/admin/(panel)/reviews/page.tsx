import Link from "next/link";

import { prisma } from "@/lib/db/prisma";
import { formatAdminDate } from "@/lib/admin/format";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminNotice } from "@/components/admin/admin-notice";
import { AdminReadOnlyNotice } from "@/components/admin/admin-read-only-notice";
import { isReadOnlyAdminRole, requireAdminSession } from "@/lib/auth/session";
import { getAdminLocaleFromCookies } from "@/lib/i18n/admin/detect-locale";
import { getAdminDictionary } from "@/lib/i18n/admin/get-admin-dictionary";

export default async function AdminReviewsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getAdminLocaleFromCookies();
  const dict = await getAdminDictionary(locale);
  const t = dict.reviews;
  const params = await searchParams;
  const session = await requireAdminSession("/admin/reviews");
  const isReadOnly = isReadOnlyAdminRole(session.user.role);
  const q = typeof params.q === "string" ? params.q : "";
  const success = typeof params.success === "string" ? params.success : undefined;
  const error = typeof params.error === "string" ? params.error : undefined;

  const reviews = await prisma.review.findMany({
    where: q
      ? {
          OR: [
            { authorName: { contains: q, mode: "insensitive" } },
            { text: { contains: q, mode: "insensitive" } },
            { title: { contains: q, mode: "insensitive" } }
          ]
        }
      : undefined,
    orderBy: { updatedAt: "desc" }
  });

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-title">
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p>{t.description}</p>
        </div>
        {!isReadOnly ? (
          <Link className="btn btn-primary" href="/admin/reviews/new">
            {t.new}
          </Link>
        ) : null}
      </div>
      <AdminNotice success={success} error={error} />
      {isReadOnly ? <AdminReadOnlyNotice text={dict.demoMode.reviews} /> : null}
      <div className="admin-toolbar">
        <form>
          <input className="admin-input" name="q" placeholder={dict.filters.searchReviews} defaultValue={q} />
          <div />
          <div />
          <button className="btn btn-ghost" type="submit">
            {dict.common.search}
          </button>
        </form>
      </div>
      {reviews.length === 0 ? (
        <AdminEmptyState
          title={t.empty.title}
          text={t.empty.text}
          href={isReadOnly ? "/admin/reviews" : "/admin/reviews/new"}
          cta={isReadOnly ? dict.filters.resetSearch : t.empty.cta}
        />
      ) : (
        <div className="admin-table">
          <table>
            <thead>
              <tr>
                <th>{t.table.author}</th>
                <th>{t.table.title}</th>
                <th>{t.table.status}</th>
                <th>{t.table.updated}</th>
                <th>{t.table.actions}</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review.id}>
                  <td>{review.authorName ?? t.defaultAuthor}</td>
                  <td>{review.title ?? review.text.slice(0, 80)}</td>
                  <td>
                    <span className={`admin-badge admin-badge--${review.publicationStatus.toLowerCase()}`}>
                      {dict.enums.publication[review.publicationStatus]}
                    </span>
                  </td>
                  <td>{formatAdminDate(review.updatedAt, locale)}</td>
                  <td>
                    <Link className="btn btn-ghost btn-small" href={`/admin/reviews/${review.id}`}>
                      {isReadOnly ? dict.common.open : dict.common.edit}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
