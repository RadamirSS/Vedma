import { saveReviewAction } from "@/app/admin/actions";
import { AdminNotice } from "@/components/admin/admin-notice";
import { DirtyForm } from "@/components/admin/dirty-form";
import { SubmitButton } from "@/components/admin/submit-button";

export default async function AdminNewReviewPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

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
      <DirtyForm action={saveReviewAction} className="admin-form-grid">
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
          <SubmitButton className="btn btn-primary">Сохранить</SubmitButton>
        </div>
      </DirtyForm>
    </div>
  );
}
