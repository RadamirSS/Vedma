import Link from "next/link";

import { customerRegisterAction } from "@/app/account/actions";
import { AdminNotice } from "@/components/admin/admin-notice";
import { SubmitButton } from "@/components/admin/submit-button";
import { getCurrentAdminSession, getCurrentCustomerSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function AccountRegisterPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const customerSession = await getCurrentCustomerSession();
  const adminSession = await getCurrentAdminSession();
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : undefined;

  if (customerSession) {
    redirect("/account");
  }

  if (adminSession) {
    redirect("/admin/dashboard?error=Кабинет+клиента+недоступен+для+администратора.");
  }

  return (
    <section className="section">
      <div className="container">
        <div className="account-login-card">
          <span className="eyebrow">Кабинет клиента</span>
          <h1 className="account-title">Регистрация</h1>
          <p className="text">
            Создайте аккаунт, чтобы отслеживать заказы и заявки. Регистрация не обязательна для первого
            заказа — аккаунт также создаётся при оформлении checkout.
          </p>
          <AdminNotice error={error} />
          <form className="account-form" action={customerRegisterAction} noValidate>
            <label className="field">
              <span>Имя</span>
              <input type="text" name="name" required />
            </label>
            <label className="field">
              <span>Email</span>
              <input type="email" name="email" required autoComplete="email" />
            </label>
            <label className="field">
              <span>Повторите email</span>
              <input type="email" name="emailConfirm" required autoComplete="email" />
            </label>
            <label className="field">
              <span>Пароль</span>
              <input type="password" name="password" minLength={8} required autoComplete="new-password" />
            </label>
            <label className="field">
              <span>Повторите пароль</span>
              <input type="password" name="passwordConfirm" minLength={8} required autoComplete="new-password" />
            </label>
            <label className="field">
              <span>Телефон</span>
              <input type="text" name="phone" placeholder="+7 / +995 ..." />
            </label>
            <label className="field">
              <span>Telegram</span>
              <input type="text" name="telegram" placeholder="@username" />
            </label>
            <label className="field check">
              <input type="checkbox" name="legalAccepted" value="yes" required />
              <span>Согласен с политикой конфиденциальности и офертой.</span>
            </label>
            <SubmitButton className="btn btn-primary btn-wide" pendingLabel="Регистрация...">
              Зарегистрироваться
            </SubmitButton>
          </form>
          <p className="stack-top muted">
            Уже есть аккаунт?{" "}
            <Link className="text-link" href="/account/login">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
