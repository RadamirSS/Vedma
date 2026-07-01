import { saveUserAction } from "@/app/admin/actions";
import { AdminNotice } from "@/components/admin/admin-notice";
import { DirtyForm } from "@/components/admin/dirty-form";
import { SubmitButton } from "@/components/admin/submit-button";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminLocaleFromCookies } from "@/lib/i18n/admin/detect-locale";
import { getUserRoleOptions } from "@/lib/i18n/admin/constants";
import { getAdminDictionary } from "@/lib/i18n/admin/get-admin-dictionary";

export default async function AdminNewUserPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin("/admin/users");
  const locale = await getAdminLocaleFromCookies();
  const dict = await getAdminDictionary(locale);
  const t = dict.users;
  const roleOptions = getUserRoleOptions(dict);
  const params = await searchParams;

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
      <DirtyForm action={saveUserAction} className="admin-form-grid">
        <input type="hidden" name="adminLocale" value={locale} />
        <label><span>{t.detail.name}</span><input className="admin-input" name="name" /></label>
        <label><span>{t.detail.email}</span><input className="admin-input" name="email" type="email" required /></label>
        <label>
          <span>{t.detail.role}</span>
          <select className="admin-select" name="role" defaultValue="MANAGER">
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label><span>{dict.common.password}</span><input className="admin-input" name="password" type="password" required /></label>
        <label className="full">
          <span>
            <input type="checkbox" name="isActive" defaultChecked /> {t.detail.activeUser}
          </span>
        </label>
        <div className="full admin-actions-row">
          <SubmitButton className="btn btn-primary" pendingLabel={dict.common.saving}>
            {t.detail.save}
          </SubmitButton>
        </div>
      </DirtyForm>
    </div>
  );
}
