import { saveUserAction } from "@/app/admin/actions";
import { AdminNotice } from "@/components/admin/admin-notice";
import { DirtyForm } from "@/components/admin/dirty-form";
import { SubmitButton } from "@/components/admin/submit-button";
import { USER_ROLE_OPTIONS } from "@/lib/admin/constants";
import { requireAdmin } from "@/lib/auth/session";

export default async function AdminNewUserPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin("/admin/users");
  const params = await searchParams;

  return (
    <div className="admin-page">
      <div className="admin-title">
        <span className="eyebrow">Новый пользователь</span>
        <h1>Создать менеджера или администратора</h1>
      </div>
      <AdminNotice
        success={typeof params.success === "string" ? params.success : undefined}
        error={typeof params.error === "string" ? params.error : undefined}
      />
      <DirtyForm action={saveUserAction} className="admin-form-grid">
        <label><span>Имя</span><input className="admin-input" name="name" /></label>
        <label><span>Email</span><input className="admin-input" name="email" type="email" required /></label>
        <label><span>Роль</span><select className="admin-select" name="role" defaultValue="MANAGER">{USER_ROLE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <label><span>Пароль</span><input className="admin-input" name="password" type="password" required /></label>
        <label className="full"><span><input type="checkbox" name="isActive" defaultChecked /> Активный пользователь</span></label>
        <div className="full admin-actions-row"><SubmitButton className="btn btn-primary">Сохранить</SubmitButton></div>
      </DirtyForm>
    </div>
  );
}
