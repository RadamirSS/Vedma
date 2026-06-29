import Link from "next/link";

import { SectionHeading } from "@/components/section-heading";
import { aboutDirections, benefits } from "@/lib/mock-data";
import { getSiteSettings } from "@/lib/admin/settings";
import { PORTRAIT_IMAGE } from "@/lib/site-images";
import { resolveSiteImage } from "@/lib/site-media";

export const metadata = {
  title: "О Бажене",
  description:
    "Бажена — таролог, психолог и проводник в трансформационных практиках. Таро, свечная магия, родовые практики и индивидуальный подход."
};

export default async function AboutPage() {
  const settings = await getSiteSettings();
  const aboutImage = resolveSiteImage(settings.mediaSlots.aboutImage, PORTRAIT_IMAGE);

  return (
    <section className="section">
      <div className="container">
        <SectionHeading
          eyebrow="Личный бренд мастера"
          title="О Бажене"
          text="Глубокая работа на стыке интуиции, символов и внутренней трансформации."
        />
        <div className="about-block">
          <div className="portrait portrait--image">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={aboutImage} alt="Бажена — Магия Жизни" />
          </div>
          <div className="about-text">
            <h3>Глубокая работа на стыке интуиции, символов и внутренней трансформации</h3>
            <p>
              В работе соединяются Таро, психология, парапсихология, свечные практики,
              трансформационные игры, шаманские техники и бережное сопровождение человека.
            </p>
            <p>
              Моя задача — помочь увидеть скрытые причины происходящего, найти опору, понять свой
              путь и выбрать дальнейшие действия.
            </p>
            <div className="directions">
              {aboutDirections.map((direction) => (
                <div key={direction} className="direction">
                  {direction}
                </div>
              ))}
            </div>
            <div className="benefits-grid compact-grid">
              {benefits.slice(0, 3).map((benefit) => (
                <article key={benefit} className="benefit-card benefit-card--text">
                  <p>{benefit}</p>
                </article>
              ))}
            </div>
            <Link className="btn btn-primary" href="/contacts">
              Связаться
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
