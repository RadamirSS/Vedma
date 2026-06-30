import { notFound } from "next/navigation";

import {
  deleteUserAction,
  savePasswordResetAction,
  saveUserAction,
  saveUserDeactivateAction
} from "@/app/admin/actions";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { AdminNotice } from "@/components/admin/admin-notice";
import { DirtyForm } from "@/components/admin/dirty-form";
import { SubmitButton } from "@/components/admin/submit-button";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getAdminLocaleFromCookies } from "@/lib/i18n/admin/detect-locale";
import { getUserRoleOptions } from "@/lib/i18n/admin/constants";
import { getAdminDictionary } from "@/lib/i18n/admin/get-admin-dictionary";

export default async function AdminUserDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin("/admin/users");
  const locale = await getAdminLocaleFromCookies();
  const dict = await getAdminDictionary(locale);
  const t = dict.users.detail;
  const roleOptions = getUserRoleOptions(dict);
  const { id } = await params;
  const query = await searchParams;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) notFound();

  return (
    <div className="admin-page">
      <div className="admin-title">
        <span className="eyebrow">{t.eyebrow}</span>
        <h1>{user.name ?? user.email}</h1>
      </div>
      <AdminNotice
        success={typeof query.success === "string" ? query.success : undefined}
        error={typeof query.error === "string" ? query.error : undefined}
      />
      <div className="admin-detail-grid">
        <DirtyForm action={saveUserAction} className="admin-form-grid">
          <input type="hidden" name="id" value={user.id} />
          <input type="hidden" name="adminLocale" value={locale} />
          <label><span>{t.name}</span><input className="admin-input" name="name" defaultValue={user.name ?? ""} /></label>
          <label><span>{t.email}</span><input className="admin-input" name="email" type="email" defaultValue={user.email} required /></label>
          <label>
            <span>{t.role}</span>
            <select className="admin-select" name="role" defaultValue={user.role}>
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{t.newPassword}</span>
            <input className="admin-input" name="password" type="password" placeholder={t.passwordPlaceholder} />
          </label>
          <label className="full">
            <span>
              <input type="checkbox" name="isActive" defaultChecked={user.isActive} /> {t.activeUser}
            </span>
          </label>
          <div className="full admin-actions-row">
            <SubmitButton className="btn btn-primary" pendingLabel={dict.common.saving}>
              {t.save}
            </SubmitButton>
          </div>
        </DirtyForm>
        <aside className="admin-side-list">
          <form action={savePasswordResetAction} className="admin-card">
            <input type="hidden" name="id" value={user.id} />
            <input type="hidden" name="adminLocale" value={locale} />
            <h3>{t.resetPassword}</h3>
            <input className="admin-input" name="password" type="password" placeholder={t.resetPasswordPlaceholder} required />
            <SubmitButton className="btn btn-ghost btn-small" pendingLabel={dict.common.saving}>
              {t.updatePassword}
            </SubmitButton>
          </form>
          <form action={saveUserDeactivateAction} className="admin-card">
            <input type="hidden" name="id" value={user.id} />
            <input type="hidden" name="adminLocale" value={locale} />
            <ConfirmSubmitButton className="btn btn-wine btn-small" message={t.deactivateConfirm}>
              {t.deactivate}
            </ConfirmSubmitButton>
          </form>
          <form action={deleteUserAction} className="admin-card">
            <input type="hidden" name="id" value={user.id} />
            <input type="hidden" name="adminLocale" value={locale} />
            <ConfirmSubmitButton className="btn btn-wine btn-small" message={t.deleteConfirm}>
              {t.delete}
            </ConfirmSubmitButton>
          </form>
        </aside>
      </div>
    </div>
  );
}
