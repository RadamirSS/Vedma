import Link from "next/link";
import { redirect } from "next/navigation";

import { customerRegisterAction } from "@/app/[locale]/account/actions";
import { AdminNotice } from "@/components/admin/admin-notice";
import { SubmitButton } from "@/components/admin/submit-button";
import { getCurrentAdminSession, getCurrentCustomerSession } from "@/lib/auth/session";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizeHref } from "@/lib/i18n/routing";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AccountRegisterPage({ params, searchParams }: PageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);

  const customerSession = await getCurrentCustomerSession();
  const adminSession = await getCurrentAdminSession();
  const routeParams = await searchParams;
  const error = typeof routeParams.error === "string" ? routeParams.error : undefined;

  if (customerSession) {
    redirect(localizeHref(locale, "/account"));
  }

  if (adminSession) {
    redirect("/admin/dashboard?error=Кабинет+клиента+недоступен+для+администратора.");
  }

  const loginHref = localizeHref(locale, "/account/login");

  return (
    <section className="section">
      <div className="container">
        <div className="account-login-card account-register-card">
          <span className="eyebrow">{dict.account.eyebrow}</span>
          <h1 className="account-title">{dict.account.registerTitle}</h1>
          <p className="text">{dict.account.registerText}</p>
          <Link className="btn btn-ghost btn-wide stack-top" href={loginHref}>
            {dict.account.backToLogin}
          </Link>
          <AdminNotice error={error} />
          <form className="account-form stack-top" action={customerRegisterAction} noValidate>
            <input type="hidden" name="locale" value={locale} />
            <label className="field">
              <span>{dict.account.name}</span>
              <input type="text" name="name" required />
            </label>
            <label className="field">
              <span>{dict.account.email}</span>
              <input type="email" name="email" required autoComplete="email" />
            </label>
            <label className="field">
              <span>{dict.account.emailConfirm}</span>
              <input type="email" name="emailConfirm" required autoComplete="email" />
            </label>
            <label className="field">
              <span>{dict.account.password}</span>
              <input type="password" name="password" minLength={8} required autoComplete="new-password" />
            </label>
            <label className="field">
              <span>{dict.account.passwordConfirm}</span>
              <input type="password" name="passwordConfirm" minLength={8} required autoComplete="new-password" />
            </label>
            <label className="field">
              <span>{dict.account.phone}</span>
              <input type="text" name="phone" placeholder="+7 / +995 ..." />
            </label>
            <label className="field">
              <span>{dict.account.telegram}</span>
              <input type="text" name="telegram" placeholder="@username" />
            </label>
            <label className="field check">
              <input type="checkbox" name="legalAccepted" value="yes" required />
              <span>{dict.account.legalAccept}</span>
            </label>
            <SubmitButton className="btn btn-primary btn-wide" pendingLabel={dict.account.registerPending}>
              {dict.account.registerButtonSubmit}
            </SubmitButton>
          </form>
        </div>
      </div>
    </section>
  );
}
