import { saveReviewAction } from "@/app/admin/actions";
import { AdminReadOnlyNotice } from "@/components/admin/admin-read-only-notice";
import { AdminNotice } from "@/components/admin/admin-notice";
import { DirtyForm } from "@/components/admin/dirty-form";
import { SubmitButton } from "@/components/admin/submit-button";
import { isReadOnlyAdminRole, requireAdminSession } from "@/lib/auth/session";
import { getAdminLocaleFromCookies } from "@/lib/i18n/admin/detect-locale";
import { getPublicationOptions } from "@/lib/i18n/admin/constants";
import { getAdminDictionary } from "@/lib/i18n/admin/get-admin-dictionary";

export default async function AdminNewReviewPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getAdminLocaleFromCookies();
  const dict = await getAdminDictionary(locale);
  const t = dict.reviews;
  const publicationOptions = getPublicationOptions(dict);
  const params = await searchParams;
  const session = await requireAdminSession("/admin/reviews/new");
  const isReadOnly = isReadOnlyAdminRole(session.user.role);

  return (
    <div className="admin-page">
      <div className="admin-title">
        <span className="eyebrow">{t.new}</span>
        <h1>{t.createTitle}</h1>
      </div>
      <AdminNotice
        success={typeof params.success === "string" ? params.success : undefined}
        error={typeof params.error === "string" ? params.error : undefined}
      />
      {isReadOnly ? <AdminReadOnlyNotice text={t.demoNew} /> : null}
      <DirtyForm action={saveReviewAction} className="admin-form-grid" disabled={isReadOnly}>
        <input type="hidden" name="adminLocale" value={locale} />
        <label>
          <span>{t.form.authorName}</span>
          <input className="admin-input" name="authorName" />
        </label>
        <label>
          <span>{t.detail.titleService}</span>
          <input className="admin-input" name="title" />
        </label>
        <label>
          <span>{t.form.publicationStatus}</span>
          <select className="admin-select" name="publicationStatus" defaultValue="PUBLISHED">
            {publicationOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{t.form.image}</span>
          <input className="admin-input" name="image" placeholder="/uploads/..." />
        </label>
        <label className="full">
          <span>{t.form.text}</span>
          <textarea className="admin-textarea" name="text" required />
        </label>
        <div className="full admin-actions-row">
          {!isReadOnly ? (
            <SubmitButton className="btn btn-primary" pendingLabel={dict.common.saving}>
              {dict.common.save}
            </SubmitButton>
          ) : null}
        </div>
      </DirtyForm>
    </div>
  );
}
