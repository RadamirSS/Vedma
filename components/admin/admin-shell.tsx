import Link from "next/link";
import type { Route } from "next";
import type { Role } from "@prisma/client";

import { logoutAction } from "@/app/admin/actions";
import { AdminLocaleSwitcher } from "@/components/admin/admin-locale-switcher";
import { SubmitButton } from "@/components/admin/submit-button";
import type { AdminDictionary } from "@/lib/i18n/admin/dictionaries/ru";
import type { Locale } from "@/lib/i18n/config";

const navItems: Array<{ href: Route; key: keyof AdminDictionary["shell"]["nav"]; roles: Role[] }> =
  [
    { href: "/admin/dashboard", key: "dashboard", roles: ["ADMIN", "MANAGER", "DEMO"] },
    { href: "/admin/products", key: "products", roles: ["ADMIN", "MANAGER", "DEMO"] },
    { href: "/admin/services", key: "services", roles: ["ADMIN", "MANAGER", "DEMO"] },
    { href: "/admin/orders", key: "orders", roles: ["ADMIN", "MANAGER", "DEMO"] },
    { href: "/admin/requests", key: "requests", roles: ["ADMIN", "MANAGER", "DEMO"] },
    { href: "/admin/payments", key: "payments", roles: ["ADMIN", "MANAGER", "DEMO"] },
    { href: "/admin/customers", key: "customers", roles: ["ADMIN", "MANAGER", "DEMO"] },
    { href: "/admin/media", key: "media", roles: ["ADMIN", "MANAGER", "DEMO"] },
    { href: "/admin/reviews", key: "reviews", roles: ["ADMIN", "MANAGER", "DEMO"] },
    { href: "/admin/settings", key: "settings", roles: ["ADMIN"] },
    { href: "/admin/users", key: "users", roles: ["ADMIN"] }
  ];

export function AdminShell({
  children,
  role,
  userName,
  email,
  locale,
  dict
}: {
  children: React.ReactNode;
  role: Role;
  userName?: string | null;
  email: string;
  locale: Locale;
  dict: AdminDictionary;
}) {
  const t = dict.shell;

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/admin/dashboard" className="admin-brand">
          <span className="sigil">Б</span>
          <span>
            <strong>{t.brandName}</strong>
            <small>{t.brandSub}</small>
          </span>
        </Link>
        <AdminLocaleSwitcher locale={locale} />
        <nav className="admin-nav">
          {navItems
            .filter((item) => item.roles.includes(role))
            .map((item) => (
              <Link key={item.href} href={item.href}>
                {t.nav[item.key]}
              </Link>
            ))}
        </nav>
        <div className="admin-sidebar__footer">
          <p>{userName || email}</p>
          <span>{dict.roles[role as keyof typeof dict.roles] ?? role}</span>
          <form action={logoutAction}>
            <input type="hidden" name="adminLocale" value={locale} />
            <SubmitButton className="btn btn-ghost btn-small btn-wide" pendingLabel={dict.common.saving}>
              {t.logout}
            </SubmitButton>
          </form>
        </div>
      </aside>
      <div className="admin-content">{children}</div>
    </div>
  );
}
