import Link from "next/link";

import { prisma } from "@/lib/db/prisma";
import { formatAdminDate } from "@/lib/admin/format";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminNotice } from "@/components/admin/admin-notice";

export default async function AdminReviewsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
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
          <span className="eyebrow">Отзывы</span>
          <h1>Управление отзывами</h1>
          <p>Отзывы публикуются на публичной странице и на главной без редизайна существующих блоков.</p>
        </div>
        <Link className="btn btn-primary" href="/admin/reviews/new">
          Новый отзыв
        </Link>
      </div>
      <AdminNotice success={success} error={error} />
      <div className="admin-toolbar">
        <form>
          <input className="admin-input" name="q" placeholder="Поиск по автору, заголовку или тексту" defaultValue={q} />
          <div />
          <div />
          <button className="btn btn-ghost" type="submit">
            Поиск
          </button>
        </form>
      </div>
      {reviews.length === 0 ? (
        <AdminEmptyState
          title="Отзывы не найдены"
          text="Создайте первый отзыв или очистите строку поиска."
          href="/admin/reviews/new"
          cta="Добавить отзыв"
        />
      ) : (
        <div className="admin-table">
          <table>
            <thead>
              <tr>
                <th>Автор</th>
                <th>Заголовок</th>
                <th>Статус</th>
                <th>Обновлено</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review.id}>
                  <td>{review.authorName ?? "Клиент"}</td>
                  <td>{review.title ?? review.text.slice(0, 80)}</td>
                  <td>
                    <span className={`admin-badge admin-badge--${review.publicationStatus.toLowerCase()}`}>
                      {review.publicationStatus}
                    </span>
                  </td>
                  <td>{formatAdminDate(review.updatedAt)}</td>
                  <td>
                    <Link className="btn btn-ghost btn-small" href={`/admin/reviews/${review.id}`}>
                      Редактировать
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
