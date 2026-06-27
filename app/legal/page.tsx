import { SectionHeading } from "@/components/section-heading";
import { getSiteSettings } from "@/lib/admin/settings";

export default async function LegalPage() {
  const settings = await getSiteSettings();
  const legalCards = [
    { title: settings.legalPages.privacyTitle, text: settings.legalPages.privacyText },
    { title: settings.legalPages.offerTitle, text: settings.legalPages.offerText },
    { title: settings.legalPages.disclaimerTitle, text: settings.legalPages.disclaimerText }
  ];

  return (
    <section className="section">
      <div className="container">
        <SectionHeading
          eyebrow="Юридические блоки"
          title="18+ · политика · оферта · дисклеймер"
          text="Юридические блоки редактируются в админ-панели и публикуются без изменения структуры страницы."
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
