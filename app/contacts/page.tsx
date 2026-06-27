import Link from "next/link";

import { SectionHeading } from "@/components/section-heading";
import { getSiteSettings } from "@/lib/admin/settings";

export default async function ContactsPage() {
  const settings = await getSiteSettings();
  const contacts = [
    { label: "Telegram", value: settings.contacts.telegram },
    { label: "VK", value: settings.contacts.vk },
    { label: "Телефон", value: settings.contacts.phone },
    { label: "Email", value: settings.contacts.email },
    { label: "График ответа", value: settings.contacts.responseHours },
    { label: "Формат работы", value: settings.contacts.workFormat }
  ];

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
