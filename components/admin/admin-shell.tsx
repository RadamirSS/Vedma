import Link from "next/link";
import type { Route } from "next";
import type { Role } from "@prisma/client";

import { logoutAction } from "@/app/admin/actions";
import { SubmitButton } from "@/components/admin/submit-button";
import { getAdminRoleLabel } from "@/lib/auth/session";

const navItems: Array<{ href: Route; label: string; roles: Role[] }> = [
  { href: "/admin/dashboard", label: "Дашборд", roles: ["ADMIN", "MANAGER", "DEMO"] },
  { href: "/admin/products", label: "Товары", roles: ["ADMIN", "MANAGER", "DEMO"] },
  { href: "/admin/services", label: "Услуги", roles: ["ADMIN", "MANAGER", "DEMO"] },
  { href: "/admin/orders", label: "Заказы", roles: ["ADMIN", "MANAGER", "DEMO"] },
  { href: "/admin/requests", label: "Заявки", roles: ["ADMIN", "MANAGER", "DEMO"] },
  { href: "/admin/payments", label: "Платежи", roles: ["ADMIN", "MANAGER", "DEMO"] },
  { href: "/admin/customers", label: "Клиенты", roles: ["ADMIN", "MANAGER", "DEMO"] },
  { href: "/admin/media", label: "Медиа", roles: ["ADMIN", "MANAGER", "DEMO"] },
  { href: "/admin/reviews", label: "Отзывы", roles: ["ADMIN", "MANAGER", "DEMO"] },
  { href: "/admin/settings", label: "Настройки", roles: ["ADMIN"] },
  { href: "/admin/users", label: "Пользователи", roles: ["ADMIN"] }
];

export function AdminShell({
  children,
  role,
  userName,
  email
}: {
  children: React.ReactNode;
  role: Role;
  userName?: string | null;
  email: string;
}) {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/admin/dashboard" className="admin-brand">
          <span className="sigil">Б</span>
          <span>
            <strong>Vedma CMS</strong>
            <small>Production Admin</small>
          </span>
        </Link>
        <nav className="admin-nav">
          {navItems
            .filter((item) => item.roles.includes(role))
            .map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
        </nav>
        <div className="admin-sidebar__footer">
          <p>{userName || email}</p>
          <span>{getAdminRoleLabel(role)}</span>
          <form action={logoutAction}>
            <SubmitButton className="btn btn-ghost btn-small btn-wide">Выйти</SubmitButton>
          </form>
        </div>
      </aside>
      <div className="admin-content">{children}</div>
    </div>
  );
}
