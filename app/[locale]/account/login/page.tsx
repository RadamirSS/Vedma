import Link from "next/link";
import { redirect } from "next/navigation";

import { customerLoginAction } from "@/app/[locale]/account/actions";
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

export default async function AccountLoginPage({ params, searchParams }: PageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);

  const customerSession = await getCurrentCustomerSession();
  const adminSession = await getCurrentAdminSession();
  const routeParams = await searchParams;
  const next =
    typeof routeParams.next === "string"
      ? routeParams.next
      : localizeHref(locale, "/account");
  const error = typeof routeParams.error === "string" ? routeParams.error : undefined;
  const success = typeof routeParams.success === "string" ? routeParams.success : undefined;

  if (customerSession) {
    redirect(localizeHref(locale, "/account"));
  }

  if (adminSession) {
    redirect("/admin/dashboard?error=Кабинет+клиента+недоступен+для+администратора.");
  }

  const registerHref = localizeHref(locale, "/account/register");

  return (
    <section className="section">
      <div className="container">
        <span className="eyebrow">{dict.account.eyebrow}</span>
        <h1 className="account-title">{dict.account.loginTitle}</h1>
        <div className="account-auth-grid">
          <div className="account-login-card">
            <h2 className="account-auth-card-title">{dict.account.loginCardTitle}</h2>
            <AdminNotice error={error} success={success} />
            <form className="account-form" action={customerLoginAction}>
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="next" value={next} />
              <label className="field">
                <span>{dict.account.email}</span>
                <input type="email" name="email" required autoComplete="email" />
              </label>
              <label className="field">
                <span>{dict.account.password}</span>
                <input type="password" name="password" required autoComplete="current-password" />
              </label>
              <SubmitButton className="btn btn-primary btn-wide" pendingLabel={dict.account.loginPending}>
                {dict.account.loginButton}
              </SubmitButton>
            </form>
          </div>

          <div className="account-login-card account-auth-card--cta">
            <h2 className="account-auth-card-title">{dict.account.registerCardTitle}</h2>
            <p className="text">{dict.account.registerCardText}</p>
            <Link className="btn btn-secondary btn-wide" href={registerHref}>
              {dict.account.registerButton}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
