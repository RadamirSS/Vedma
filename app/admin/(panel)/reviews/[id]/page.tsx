import { notFound } from "next/navigation";

import { deleteReviewAction, saveReviewAction } from "@/app/admin/actions";
import { AdminReadOnlyNotice } from "@/components/admin/admin-read-only-notice";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { AdminNotice } from "@/components/admin/admin-notice";
import { DirtyForm } from "@/components/admin/dirty-form";
import { SubmitButton } from "@/components/admin/submit-button";
import { isReadOnlyAdminRole, requireAdminSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export default async function AdminReviewDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const session = await requireAdminSession(`/admin/reviews/${id}`);
  const isReadOnly = isReadOnlyAdminRole(session.user.role);
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) notFound();

  return (
    <div className="admin-page">
      <div className="admin-title">
        <span className="eyebrow">Редактирование отзыва</span>
        <h1>{review.title ?? "Отзыв без заголовка"}</h1>
      </div>
      <AdminNotice
        success={typeof query.success === "string" ? query.success : undefined}
        error={typeof query.error === "string" ? query.error : undefined}
      />
      {isReadOnly ? <AdminReadOnlyNotice text="Демо-аккаунт может просматривать отзывы, но не может менять или удалять их." /> : null}
      <div className="admin-detail-grid">
        <DirtyForm action={saveReviewAction} className="admin-form-grid" disabled={isReadOnly}>
          <input type="hidden" name="id" value={review.id} />
          <label>
            <span>Автор</span>
            <input className="admin-input" name="authorName" defaultValue={review.authorName ?? ""} />
          </label>
          <label>
            <span>Заголовок / услуга</span>
            <input className="admin-input" name="title" defaultValue={review.title ?? ""} />
          </label>
          <label>
            <span>Статус публикации</span>
            <select className="admin-select" name="publicationStatus" defaultValue={review.publicationStatus}>
              <option value="PUBLISHED">Опубликовано</option>
              <option value="DRAFT">Черновик</option>
              <option value="ARCHIVED">Скрыто</option>
            </select>
          </label>
          <label>
            <span>Изображение</span>
            <input className="admin-input" name="image" defaultValue={review.image ?? ""} />
          </label>
          <label className="full">
            <span>Текст</span>
            <textarea className="admin-textarea" name="text" defaultValue={review.text} required />
          </label>
          <div className="full admin-actions-row">
            {!isReadOnly ? <SubmitButton className="btn btn-primary">Сохранить</SubmitButton> : null}
          </div>
        </DirtyForm>
        {!isReadOnly ? (
          <aside>
            <form action={deleteReviewAction}>
              <input type="hidden" name="id" value={review.id} />
              <ConfirmSubmitButton
                className="btn btn-wine"
                message="Удалить отзыв? Это действие нельзя отменить."
              >
                Удалить отзыв
              </ConfirmSubmitButton>
            </form>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
