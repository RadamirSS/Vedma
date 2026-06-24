import Link from "next/link";

import { FeaturedBlock } from "@/components/featured-block";
import { HomeDirections } from "@/components/home-directions";
import { HomeHero } from "@/components/home-hero";
import { SectionHeading } from "@/components/section-heading";
import { VisualGallery } from "@/components/visual-gallery";
import { pickFeaturedItems, pickFeaturedProducts } from "@/lib/catalog-helpers";
import {
  benefits,
  processSteps,
  products,
  reviews,
  services
} from "@/lib/mock-data";

export const metadata = {
  title: "Бажена — Магия Жизни",
  description:
    "Таро, диагностика, трансформационные практики и магические товары. Личный бренд Бажены — Магия Жизни."
};

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <HomeDirections />

      <FeaturedBlock
        eyebrow="Популярное"
        title="Популярные услуги"
        text="Конкретные форматы работы с ценой и описанием. Остальные направления — по записи."
        items={pickFeaturedItems(services, 3)}
        viewAllHref="/services"
        viewAllLabel="Все услуги"
      />

      <FeaturedBlock
        eyebrow="Магазин"
        title="Популярные товары"
        text="Ручная работа, алтарные предметы, браслеты и обереги для личной практики."
        items={pickFeaturedProducts(products, 6)}
        viewAllHref="/products"
        viewAllLabel="Весь каталог"
      />

      <VisualGallery />

      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="Доверие"
            title="Почему ко мне обращаются"
            text="Без запугивания, давления и обещаний невозможного. Тон сайта — мягкий, уверенный и глубокий."
          />
          <div className="benefits-grid">
            {benefits.map((benefit) => (
              <article key={benefit} className="benefit-card benefit-card--text">
                <p>{benefit}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="Порядок работы"
            title="Как проходит работа"
            text="От первого обращения до результата — понятный и бережный путь."
          />
          <div className="steps">
            {processSteps.map((step, index) => (
              <article key={step} className="step-card">
                <span className="step-number">{index + 1}</span>
                <h3>{step}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="Социальное доказательство"
            title="Отзывы клиентов"
            text="Реальные истории людей, которые обратились за поддержкой и разбором ситуации."
          />
          <div className="reviews">
            {reviews.map((review) => (
              <article key={review.id} className="review-card">
                <span className="service">{review.service}</span>
                <p>«{review.quote}»</p>
                <small>{review.author}</small>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cta">
            <div>
              <span className="eyebrow">Начните сейчас</span>
              <h2>Готовы выбрать услугу или задать вопрос?</h2>
              <p>
                Перейдите в каталог услуг, выберите подходящий формат или напишите напрямую — Бажена
                поможет определить, с чего лучше начать.
              </p>
            </div>
            <div className="cta-actions">
              <Link className="btn btn-primary" href="/services">
                Каталог услуг
              </Link>
              <Link className="btn btn-ghost" href="/products">
                Магические товары
              </Link>
              <a
                className="btn btn-wine"
                href="https://t.me/Bazhena13witch"
                target="_blank"
                rel="noreferrer"
              >
                Написать в Telegram
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
