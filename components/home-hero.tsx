import Link from "next/link";

import { PORTRAIT_IMAGE } from "@/lib/site-images";

export function HomeHero() {
  return (
    <section className="hero section">
      <div className="container hero-grid">
        <div className="hero-copy">
          <span className="eyebrow">Таро · ритуальные практики · амулеты · 18+</span>
          <h1>
            Бажена —
            <br />
            <span className="gold">Магия Жизни</span>
          </h1>
          <p className="lead">
            Таро, ритуальные практики, трансформационные игры, свечи, амулеты и глубокая работа с
            жизненными ситуациями.
          </p>
          <p className="text">
            Помогаю разобраться в отношениях, деньгах, защите, родовых сценариях и личном пути через
            Таро, психологические практики, шаманские и трансовые техники.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary" href="/services">
              Выбрать услугу
            </Link>
            <Link className="btn btn-ghost" href="/products">
              Перейти в магазин
            </Link>
            <a
              className="btn btn-wine"
              href="https://t.me/Bazhena13witch"
              target="_blank"
              rel="noreferrer"
            >
              Записаться в Telegram
            </a>
          </div>
          <div className="trust">
            <span className="pill">Конфиденциально</span>
            <span className="pill">Онлайн</span>
            <span className="pill">18+</span>
            <span className="pill">Индивидуальный подход</span>
          </div>
        </div>

        <div className="hero-card hero-card--image" aria-label="Атмосферный визуальный блок">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="hero-card__photo" src={PORTRAIT_IMAGE} alt="Атмосфера практик Бажены" />
          <div className="hero-card__glow" />
          <div className="floating-note">
            <b>
              Тёмная лавка
              <br />
              с тёплым светом
            </b>
            <span>свечи · карты · золото · бордо · графит</span>
          </div>
        </div>
      </div>
    </section>
  );
}
