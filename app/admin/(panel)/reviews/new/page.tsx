import { saveReviewAction } from "@/app/admin/actions";
import { AdminReadOnlyNotice } from "@/components/admin/admin-read-only-notice";
import { AdminNotice } from "@/components/admin/admin-notice";
import { DirtyForm } from "@/components/admin/dirty-form";
import { SubmitButton } from "@/components/admin/submit-button";
import { isReadOnlyAdminRole, requireAdminSession } from "@/lib/auth/session";

export default async function AdminNewReviewPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const session = await requireAdminSession("/admin/reviews/new");
  const isReadOnly = isReadOnlyAdminRole(session.user.role);

  return (
    <div className="admin-page">
      <div className="admin-title">
        <span className="eyebrow">Новый отзыв</span>
        <h1>Создать отзыв</h1>
      </div>
      <AdminNotice
        success={typeof params.success === "string" ? params.success : undefined}
        error={typeof params.error === "string" ? params.error : undefined}
      />
      {isReadOnly ? <AdminReadOnlyNotice text="Демо-аккаунт не может создавать отзывы. Форма открыта только для просмотра." /> : null}
      <DirtyForm action={saveReviewAction} className="admin-form-grid" disabled={isReadOnly}>
        <label>
          <span>Автор</span>
          <input className="admin-input" name="authorName" />
        </label>
        <label>
          <span>Заголовок / услуга</span>
          <input className="admin-input" name="title" />
        </label>
        <label>
          <span>Статус публикации</span>
          <select className="admin-select" name="publicationStatus" defaultValue="PUBLISHED">
            <option value="PUBLISHED">Опубликовано</option>
            <option value="DRAFT">Черновик</option>
            <option value="ARCHIVED">Скрыто</option>
          </select>
        </label>
        <label>
          <span>Изображение</span>
          <input className="admin-input" name="image" placeholder="/uploads/..." />
        </label>
        <label className="full">
          <span>Текст</span>
          <textarea className="admin-textarea" name="text" required />
        </label>
        <div className="full admin-actions-row">
          {!isReadOnly ? <SubmitButton className="btn btn-primary">Сохранить</SubmitButton> : null}
        </div>
      </DirtyForm>
    </div>
  );
}
