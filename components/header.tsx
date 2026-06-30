"use client";

import Link from "next/link";
import { useState } from "react";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { useCart } from "@/components/cart-context";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/ru";
import { localizeHref } from "@/lib/i18n/routing";

export function Header({
  logoImage,
  logoAlt,
  locale,
  dict
}: {
  logoImage?: string | null;
  logoAlt?: string;
  locale: Locale;
  dict: Dictionary;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { count, openCart } = useCart();

  const navLinks = [
    { href: localizeHref(locale, "/services"), label: dict.header.services },
    { href: localizeHref(locale, "/products"), label: dict.header.shop },
    { href: localizeHref(locale, "/about"), label: dict.header.about },
    { href: localizeHref(locale, "/reviews"), label: dict.header.reviews },
    { href: localizeHref(locale, "/contacts"), label: dict.header.contacts }
  ];

  const accountHref = localizeHref(locale, "/account");
  const homeHref = localizeHref(locale, "/");

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link href={homeHref} className="brand" aria-label={dict.header.brandAria}>
          {logoImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="brand-logo"
              src={logoImage}
              alt={logoAlt ?? `${dict.header.brandName} — ${dict.header.brandSub}`}
            />
          ) : (
            <span className="sigil">Б</span>
          )}
          <span>
            <span className="brand-name">{dict.header.brandName}</span>
            <span className="brand-sub">{dict.header.brandSub}</span>
          </span>
        </Link>

        <nav className="menu" aria-label={dict.header.mainNavAria}>
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="nav-actions">
          <LocaleSwitcher dict={dict} />
          <Link
            className="btn btn-ghost btn-small account-btn"
            href={accountHref}
            aria-label={dict.header.account}
          >
            <span className="account-btn__full">{dict.header.account}</span>
            <span className="account-btn__short">{dict.header.accountShort}</span>
          </Link>
          <button className="btn btn-primary btn-small cart-btn" type="button" onClick={openCart}>
            {dict.header.cart}
            <span className="cart-count">{count}</span>
          </button>
          <button
            className="btn btn-ghost btn-small burger"
            type="button"
            onClick={() => setIsMenuOpen((value) => !value)}
          >
            {dict.header.menu}
          </button>
        </div>
      </div>

      <div className={`mobile-menu ${isMenuOpen ? "open" : ""}`}>
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href} onClick={() => setIsMenuOpen(false)}>
            {link.label}
          </Link>
        ))}
        <Link href={accountHref} onClick={() => setIsMenuOpen(false)}>
          {dict.header.account}
        </Link>
      </div>
    </header>
  );
}
