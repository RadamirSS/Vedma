import { SectionHeading } from "@/components/section-heading";
import { getSiteSettings } from "@/lib/admin/settings";

export default async function LegalPage() {
  const settings = await getSiteSettings();
  const legalCards = [
    { title: settings.legalPages.privacyTitle, text: settings.legalPages.privacyText },
    { title: settings.legalPages.offerTitle, text: settings.legalPages.offerText }
  ];

  return (
    <section className="section">
      <div className="container">
        <SectionHeading
          eyebrow="Юридические блоки"
          title="18+ · политика · оферта"
          text="Актуальные юридические блоки публикуются на этой странице."
        />
        <div className="legal-grid">
          {legalCards.map((card) => (
            <article key={card.title} className="legal-card">
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </article>
          ))}
        </div>
        <p className="muted stack-top">{settings.legalPages.disclaimerText}</p>
      </div>
    </section>
  );
}
