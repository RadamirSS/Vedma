import { AdminI18nProvider } from "@/components/admin/admin-i18n-provider";
import { getAdminLocaleFromCookies } from "@/lib/i18n/admin/detect-locale";
import { getAdminDictionary } from "@/lib/i18n/admin/get-admin-dictionary";

import "./admin.css";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const locale = await getAdminLocaleFromCookies();
  const dict = await getAdminDictionary(locale);

  return (
    <AdminI18nProvider locale={locale} dict={dict}>
      {children}
    </AdminI18nProvider>
  );
}
