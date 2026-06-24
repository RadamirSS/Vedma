import { SectionHeading } from "@/components/section-heading";
import { legalCards } from "@/lib/mock-data";

export default function LegalPage() {
  return (
    <section className="section">
      <div className="container">
        <SectionHeading
          eyebrow="Юридические блоки"
          title="18+ · политика · оферта · дисклеймер"
          text="Это не юридически финальные тексты, а визуальные блоки для согласования структуры и подачи."
        />
        <div className="legal-grid">
          {legalCards.map((card) => (
            <article key={card.title} className="legal-card">
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
