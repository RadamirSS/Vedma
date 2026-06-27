import { notFound } from "next/navigation";

import {
  savePasswordResetAction,
  saveUserAction,
  saveUserDeactivateAction
} from "@/app/admin/actions";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { AdminNotice } from "@/components/admin/admin-notice";
import { DirtyForm } from "@/components/admin/dirty-form";
import { SubmitButton } from "@/components/admin/submit-button";
import { USER_ROLE_OPTIONS } from "@/lib/admin/constants";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export default async function AdminUserDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin("/admin/users");
  const { id } = await params;
  const query = await searchParams;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) notFound();

  return (
    <div className="admin-page">
      <div className="admin-title">
        <span className="eyebrow">Редактирование пользователя</span>
        <h1>{user.name ?? user.email}</h1>
      </div>
      <AdminNotice
        success={typeof query.success === "string" ? query.success : undefined}
        error={typeof query.error === "string" ? query.error : undefined}
      />
      <div className="admin-detail-grid">
        <DirtyForm action={saveUserAction} className="admin-form-grid">
          <input type="hidden" name="id" value={user.id} />
          <label><span>Имя</span><input className="admin-input" name="name" defaultValue={user.name ?? ""} /></label>
          <label><span>Email</span><input className="admin-input" name="email" type="email" defaultValue={user.email} required /></label>
          <label><span>Роль</span><select className="admin-select" name="role" defaultValue={user.role}>{USER_ROLE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label><span>Новый пароль</span><input className="admin-input" name="password" type="password" placeholder="Оставьте пустым, чтобы не менять" /></label>
          <label className="full"><span><input type="checkbox" name="isActive" defaultChecked={user.isActive} /> Активный пользователь</span></label>
          <div className="full admin-actions-row"><SubmitButton className="btn btn-primary">Сохранить</SubmitButton></div>
        </DirtyForm>
        <aside className="admin-side-list">
          <form action={savePasswordResetAction} className="admin-card">
            <input type="hidden" name="id" value={user.id} />
            <h3>Сброс пароля</h3>
            <input className="admin-input" name="password" type="password" placeholder="Новый пароль" required />
            <SubmitButton className="btn btn-ghost btn-small">Обновить пароль</SubmitButton>
          </form>
          <form action={saveUserDeactivateAction} className="admin-card">
            <input type="hidden" name="id" value={user.id} />
            <ConfirmSubmitButton
              className="btn btn-wine btn-small"
              message="Деактивировать пользователя и завершить его сессии?"
            >
              Деактивировать
            </ConfirmSubmitButton>
          </form>
        </aside>
      </div>
    </div>
  );
}
