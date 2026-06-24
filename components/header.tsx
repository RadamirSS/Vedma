"use client";

import Link from "next/link";
import type { Route } from "next";
import { useState } from "react";

import { useCart } from "@/components/cart-context";

const navLinks = [
  { href: "/services", label: "Услуги" },
  { href: "/products", label: "Товары" },
  { href: "/about", label: "Обо мне" },
  { href: "/reviews", label: "Отзывы" },
  { href: "/contacts", label: "Контакты" },
  { href: "/legal", label: "18+ и правила" }
] satisfies Array<{ href: Route; label: string }>;

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { count, openCart } = useCart();

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link href="/" className="brand" aria-label="Бажена — на главную">
          <span className="sigil">Б</span>
          <span>
            <span className="brand-name">Бажена</span>
            <span className="brand-sub">Магия жизни</span>
          </span>
        </Link>

        <nav className="menu" aria-label="Главное меню">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="nav-actions">
          <a
            className="btn btn-ghost btn-small"
            href="https://t.me/Bazhena13witch"
            target="_blank"
            rel="noreferrer"
          >
            Telegram
          </a>
          <Link className="btn btn-primary btn-small" href="/checkout">
            Записаться
          </Link>
          <button className="btn btn-ghost btn-small cart-btn" type="button" onClick={openCart}>
            Корзина
            <span className="cart-count">{count}</span>
          </button>
          <button
            className="btn btn-ghost btn-small burger"
            type="button"
            onClick={() => setIsMenuOpen((value) => !value)}
          >
            Меню
          </button>
        </div>
      </div>

      <div className={`mobile-menu ${isMenuOpen ? "open" : ""}`}>
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href} onClick={() => setIsMenuOpen(false)}>
            {link.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
