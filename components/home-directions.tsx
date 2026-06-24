import Link from "next/link";

import { ServiceDirectionsGrid } from "@/components/service-directions-grid";
import { SectionHeading } from "@/components/section-heading";

export function HomeDirections() {
  return (
    <section className="section">
      <div className="container">
        <SectionHeading
          eyebrow="Направления"
          title="С чем работает Бажена"
          text="Выберите направление по запросу — от Таро и диагностики до родовых практик и трансформации."
        />
        <ServiceDirectionsGrid />
        <div className="section-link-row">
          <Link className="btn btn-ghost" href="/services">
            Все направления и услуги
          </Link>
        </div>
      </div>
    </section>
  );
}
