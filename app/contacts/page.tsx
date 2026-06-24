import Link from "next/link";

import { SectionHeading } from "@/components/section-heading";
import { contacts } from "@/lib/mock-data";

export default function ContactsPage() {
  return (
    <section className="section">
      <div className="container">
        <SectionHeading
          eyebrow="Контакты и запись"
          title="Как связаться"
          text="Контактная страница показывает основной CTA и спокойную, доверительную подачу без перегруза."
        />
        <div className="detail-grid">
          <article className="form-card">
            <h3>Каналы связи</h3>
            <div className="contact-list">
              {contacts.map((item) => (
                <div key={item.label} className="summary-line">
                  <span>{item.label}</span>
                  <b>{item.value}</b>
                </div>
              ))}
            </div>
          </article>
          <article className="cart-summary">
            <h3>Быстрый переход</h3>
            <p className="muted">
              Основной маршрут в прототипе: перейти в каталог, выбрать формат, добавить в корзину
              и открыть визуальный checkout.
            </p>
            <div className="hero-actions stack-top">
              <Link className="btn btn-primary" href="/services">
                Каталог услуг
              </Link>
              <Link className="btn btn-ghost" href="/checkout">
                Форма заказа
              </Link>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
