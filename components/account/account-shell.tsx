import Link from "next/link";

import { customerLogoutAction } from "@/lib/actions/customer";
import { SubmitButton } from "@/components/admin/submit-button";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/ru";
import { localizeHref } from "@/lib/i18n/routing";

export function AccountShell({
  children,
  title,
  description,
  user,
  activeHref,
  locale,
  dict
}: {
  children: React.ReactNode;
  title: string;
  description: string;
  user: {
    email: string;
    name?: string | null;
  };
  activeHref?: string;
  locale: Locale;
  dict: Dictionary;
}) {
  const navItems = [
    { href: localizeHref(locale, "/account"), label: dict.account.overview },
    { href: localizeHref(locale, "/account/orders"), label: dict.account.orders },
    { href: localizeHref(locale, "/account/profile"), label: dict.account.profile },
    { href: localizeHref(locale, "/contacts"), label: dict.account.help }
  ];

  const normalizedActive = activeHref ? localizeHref(locale, activeHref) : undefined;

  return (
    <section className="section">
      <div className="container">
        <div className="account-header">
          <div>
            <span className="eyebrow">{dict.account.shellEyebrow}</span>
            <h1 className="account-title">{title}</h1>
            <p className="text">{description}</p>
          </div>
          <div className="account-user-card">
            <strong>{user.name || user.email}</strong>
            <span>{user.email}</span>
            <form action={customerLogoutAction}>
              <input type="hidden" name="locale" value={locale} />
              <SubmitButton className="btn btn-ghost btn-small btn-wide" pendingLabel={dict.account.logoutPending}>
                {dict.account.logout}
              </SubmitButton>
            </form>
          </div>
        </div>
        <div className="account-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              className={`btn btn-ghost btn-small${normalizedActive === item.href ? " is-active" : ""}`}
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </div>
        {children}
      </div>
    </section>
  );
}
