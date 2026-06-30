import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminSession } from "@/lib/auth/session";
import { getAdminLocaleFromCookies } from "@/lib/i18n/admin/detect-locale";
import { getAdminDictionary } from "@/lib/i18n/admin/get-admin-dictionary";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminSession("/admin/dashboard");
  const locale = await getAdminLocaleFromCookies();
  const dict = await getAdminDictionary(locale);

  return (
    <AdminShell
      role={session.user.role}
      userName={session.user.name}
      email={session.user.email}
      locale={locale}
      dict={dict}
    >
      {children}
    </AdminShell>
  );
}
