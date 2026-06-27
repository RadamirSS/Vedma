"use client";

import Link from "next/link";

import type { SiteSettingsShape } from "@/lib/admin/settings";

export function Footer({ settings }: { settings: SiteSettingsShape }) {
  return (
    <footer>
      <div className="container footer-grid">
        <div>
          <Link href="/" className="brand">
            <span className="sigil">Б</span>
            <span>
              <span className="brand-name">Бажена</span>
              <span className="brand-sub">Магия жизни</span>
            </span>
          </Link>
          <p className="footer-lead">{settings.footer.description}</p>
          <span className="age">18+</span>
        </div>
        <div>
          <h4>Навигация</h4>
          <div className="footer-links">
            <Link href="/services">Услуги</Link>
            <Link href="/products">Товары</Link>
            <Link href="/about">Обо мне</Link>
            <Link href="/reviews">Отзывы</Link>
          </div>
        </div>
        <div>
          <h4>Контакты</h4>
          <div className="footer-links">
            <a href={settings.socialLinks.telegram} target="_blank" rel="noreferrer">
              Telegram
            </a>
            <Link href="/contacts">Контакты</Link>
            <Link href="/checkout">Форма заказа</Link>
          </div>
        </div>
        <div>
          <h4>Дисклеймер</h4>
          <p>{settings.footer.disclaimer}</p>
        </div>
      </div>
      <div className="container footer-bottom">
        <p>{settings.footer.copyright}</p>
        <p>Политика конфиденциальности · Публичная оферта · Дисклеймер</p>
      </div>
    </footer>
  );
}
