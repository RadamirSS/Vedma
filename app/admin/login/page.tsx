import { redirect } from "next/navigation";

import { loginAction } from "@/app/admin/actions";
import { AdminNotice } from "@/components/admin/admin-notice";
import { SubmitButton } from "@/components/admin/submit-button";
import { getCurrentAdminSession } from "@/lib/auth/session";

export default async function AdminLoginPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getCurrentAdminSession();
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/admin/dashboard";
  const error = typeof params.error === "string" ? params.error : undefined;
  const success = typeof params.success === "string" ? params.success : undefined;

  if (session) {
    redirect("/admin/dashboard");
  }

  return (
    <div className="admin-login-wrap">
      <div className="admin-login-card">
        <span className="eyebrow">CMS доступ</span>
        <h1>Вход в админ-панель</h1>
        <p>Только для администраторов и менеджеров каталога.</p>
        <AdminNotice error={error} success={success} />
        <form action={loginAction}>
          <input type="hidden" name="next" value={next} />
          <label className="admin-field">
            <span>Email</span>
            <input className="admin-input" type="email" name="email" required />
          </label>
          <label className="admin-field">
            <span>Пароль</span>
            <input className="admin-input" type="password" name="password" required />
          </label>
          <SubmitButton className="btn btn-primary btn-wide" pendingLabel="Вход...">
            Войти
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
