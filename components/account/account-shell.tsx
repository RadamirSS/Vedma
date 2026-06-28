import Link from "next/link";
import type { Route } from "next";

import { customerLogoutAction } from "@/app/account/actions";
import { SubmitButton } from "@/components/admin/submit-button";

const navItems = [
  { href: "/account/orders", label: "Заказы" },
  { href: "/account/profile", label: "Профиль" }
] satisfies Array<{ href: Route; label: string }>;

export function AccountShell({
  children,
  title,
  description,
  user
}: {
  children: React.ReactNode;
  title: string;
  description: string;
  user: {
    email: string;
    name?: string | null;
  };
}) {
  return (
    <section className="section">
      <div className="container">
        <div className="account-header">
          <div>
            <span className="eyebrow">Личный кабинет</span>
            <h1 className="account-title">{title}</h1>
            <p className="text">{description}</p>
          </div>
          <div className="account-user-card">
            <strong>{user.name || user.email}</strong>
            <span>{user.email}</span>
            <form action={customerLogoutAction}>
              <SubmitButton className="btn btn-ghost btn-small btn-wide" pendingLabel="Выход...">
                Выйти
              </SubmitButton>
            </form>
          </div>
        </div>
        <div className="account-nav">
          {navItems.map((item) => (
            <Link key={item.href} className="btn btn-ghost btn-small" href={item.href}>
              {item.label}
            </Link>
          ))}
        </div>
        {children}
      </div>
    </section>
  );
}
