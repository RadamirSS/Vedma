import Link from "next/link";

import { getSiteSettings } from "@/lib/admin/settings";
import { PORTRAIT_IMAGE } from "@/lib/site-images";

export async function HomeHero() {
  const settings = await getSiteSettings();
  const [titleTop, ...titleRest] = settings.homepage.title.split("—");

  return (
    <section className="hero section">
      <div className="container hero-grid">
        <div className="hero-copy">
          <span className="eyebrow">{settings.homepage.eyebrow}</span>
          <h1>
            {titleTop?.trim() ?? settings.homepage.title}
            <br />
            <span className="gold">{titleRest.join("—").trim() || settings.homepage.title}</span>
          </h1>
          <p className="lead">{settings.homepage.lead}</p>
          <p className="text">{settings.homepage.description}</p>
          <div className="hero-actions">
            <Link className="btn btn-primary" href="/services">
              {settings.homepage.primaryLabel}
            </Link>
            <Link className="btn btn-ghost" href="/products">
              {settings.homepage.secondaryLabel}
            </Link>
            <a
              className="btn btn-wine"
              href={settings.socialLinks.telegram}
              target="_blank"
              rel="noreferrer"
            >
              {settings.homepage.telegramLabel}
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
