import { notFound } from "next/navigation";

import { deleteReviewAction, saveReviewAction } from "@/app/admin/actions";
import { AdminReadOnlyNotice } from "@/components/admin/admin-read-only-notice";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { AdminNotice } from "@/components/admin/admin-notice";
import { DirtyForm } from "@/components/admin/dirty-form";
import { SubmitButton } from "@/components/admin/submit-button";
import { isReadOnlyAdminRole, requireAdminSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getAdminLocaleFromCookies } from "@/lib/i18n/admin/detect-locale";
import { getPublicationOptions } from "@/lib/i18n/admin/constants";
import { getAdminDictionary } from "@/lib/i18n/admin/get-admin-dictionary";

export default async function AdminReviewDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getAdminLocaleFromCookies();
  const dict = await getAdminDictionary(locale);
  const t = dict.reviews;
  const publicationOptions = getPublicationOptions(dict);
  const { id } = await params;
  const query = await searchParams;
  const session = await requireAdminSession(`/admin/reviews/${id}`);
  const isReadOnly = isReadOnlyAdminRole(session.user.role);
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) notFound();

  return (
    <div className="admin-page">
      <div className="admin-title">
        <span className="eyebrow">{t.detail.eyebrow}</span>
        <h1>{review.title ?? t.detail.noTitle}</h1>
      </div>
      <AdminNotice
        success={typeof query.success === "string" ? query.success : undefined}
        error={typeof query.error === "string" ? query.error : undefined}
      />
      {isReadOnly ? <AdminReadOnlyNotice text={dict.demoMode.reviews} /> : null}
      <div className="admin-detail-grid">
        <DirtyForm action={saveReviewAction} className="admin-form-grid" disabled={isReadOnly}>
          <input type="hidden" name="id" value={review.id} />
          <input type="hidden" name="adminLocale" value={locale} />
          <label>
            <span>{t.form.authorName}</span>
            <input className="admin-input" name="authorName" defaultValue={review.authorName ?? ""} />
          </label>
          <label>
            <span>{t.detail.titleService}</span>
            <input className="admin-input" name="title" defaultValue={review.title ?? ""} />
          </label>
          <label>
            <span>{t.form.publicationStatus}</span>
            <select className="admin-select" name="publicationStatus" defaultValue={review.publicationStatus}>
              {publicationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{t.form.image}</span>
            <input className="admin-input" name="image" defaultValue={review.image ?? ""} />
          </label>
          <label className="full">
            <span>{t.form.text}</span>
            <textarea className="admin-textarea" name="text" defaultValue={review.text} required />
          </label>
          <div className="full admin-actions-row">
            {!isReadOnly ? (
              <SubmitButton className="btn btn-primary" pendingLabel={dict.common.saving}>
                {dict.common.save}
              </SubmitButton>
            ) : null}
          </div>
        </DirtyForm>
        {!isReadOnly ? (
          <aside>
            <form action={deleteReviewAction}>
              <input type="hidden" name="id" value={review.id} />
              <input type="hidden" name="adminLocale" value={locale} />
              <ConfirmSubmitButton className="btn btn-wine" message={t.detail.deleteConfirm}>
                {t.detail.delete}
              </ConfirmSubmitButton>
            </form>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
