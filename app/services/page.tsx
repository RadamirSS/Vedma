import type { Metadata } from "next";

import { CatalogCard } from "@/components/catalog-card";
import { LeadCta } from "@/components/lead-cta";
import { SectionHeading } from "@/components/section-heading";
import { ServiceDirectionsGrid } from "@/components/service-directions-grid";
import { getPublishedServices } from "@/lib/catalog/repository";

export const metadata: Metadata = {
  title: "Услуги",
  description:
    "Таро, диагностика, защита, отношения, деньги, родовые практики, трансформация и консультации Бажены. Запись онлайн."
};

export default async function ServicesPage() {
  const services = await getPublishedServices();
  return (
    <>
      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="Направления работы"
            title="С чем работает Бажена"
            text="Выберите направление по запросу — от Таро и диагностики до родовых практик и трансформации."
          />
          <ServiceDirectionsGrid id="directions" />
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <SectionHeading
            eyebrow="Каталог услуг"
            title="Доступные услуги"
            text="Конкретные форматы с ценой и описанием. Остальные направления — по записи через Telegram."
          />
          <div className="cards-grid">
            {services.map((item) => (
              <CatalogCard key={item.id} item={item} />
            ))}
          </div>
          <LeadCta />
        </div>
      </section>
    </>
  );
}
