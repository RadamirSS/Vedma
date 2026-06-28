import { redirect } from "next/navigation";

import { customerLoginAction } from "@/app/account/actions";
import { AdminNotice } from "@/components/admin/admin-notice";
import { SubmitButton } from "@/components/admin/submit-button";
import { getCurrentSession } from "@/lib/auth/session";

export default async function AccountLoginPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getCurrentSession();
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/account/orders";
  const error = typeof params.error === "string" ? params.error : undefined;
  const success = typeof params.success === "string" ? params.success : undefined;

  if (session?.user.role === "CUSTOMER") {
    redirect("/account/orders");
  }

  return (
    <section className="section">
      <div className="container">
        <div className="account-login-card">
          <span className="eyebrow">Кабинет клиента</span>
          <h1 className="account-title">Вход в заказы и заявки</h1>
          <p className="text">Аккаунт создается во время первого checkout. Здесь отображаются заказы, статусы и прикрепленные PDF.</p>
          <AdminNotice error={error} success={success} />
          <form className="account-form" action={customerLoginAction}>
            <input type="hidden" name="next" value={next} />
            <label className="field">
              <span>Email</span>
              <input type="email" name="email" required />
            </label>
            <label className="field">
              <span>Пароль</span>
              <input type="password" name="password" required />
            </label>
            <SubmitButton className="btn btn-primary btn-wide" pendingLabel="Вход...">
              Войти
            </SubmitButton>
          </form>
        </div>
      </div>
    </section>
  );
}
