import { redirect } from "next/navigation";

import { loginAction } from "@/app/admin/actions";
import { AdminLocaleSwitcher } from "@/components/admin/admin-locale-switcher";
import { AdminNotice } from "@/components/admin/admin-notice";
import { SubmitButton } from "@/components/admin/submit-button";
import { getCurrentAdminSession } from "@/lib/auth/session";
import { getAdminLocaleFromCookies } from "@/lib/i18n/admin/detect-locale";
import { getAdminDictionary } from "@/lib/i18n/admin/get-admin-dictionary";

export default async function AdminLoginPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getCurrentAdminSession();
  const params = await searchParams;
  const locale = await getAdminLocaleFromCookies();
  const dict = await getAdminDictionary(locale);
  const t = dict.login;
  const next = typeof params.next === "string" ? params.next : "/admin/dashboard";
  const error = typeof params.error === "string" ? params.error : undefined;
  const success = typeof params.success === "string" ? params.success : undefined;

  if (session) {
    redirect("/admin/dashboard");
  }

  return (
    <div className="admin-login-wrap">
      <div className="admin-login-card">
        <div className="admin-login-card__top">
          <AdminLocaleSwitcher locale={locale} />
        </div>
        <span className="eyebrow">{t.eyebrow}</span>
        <h1>{t.title}</h1>
        <p>{t.description}</p>
        <AdminNotice error={error} success={success} />
        <form action={loginAction}>
          <input type="hidden" name="next" value={next} />
          <input type="hidden" name="adminLocale" value={locale} />
          <label className="admin-field">
            <span>{dict.common.email}</span>
            <input className="admin-input" type="email" name="email" required />
          </label>
          <label className="admin-field">
            <span>{t.password}</span>
            <input className="admin-input" type="password" name="password" required />
          </label>
          <SubmitButton className="btn btn-primary btn-wide" pendingLabel={t.pending}>
            {t.submit}
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
