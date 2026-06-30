import { SectionHeading } from "@/components/section-heading";
import { getSiteSettings } from "@/lib/admin/settings";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LegalPage({ params }: PageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);
  const settings = await getSiteSettings();
  const legalCards = [
    { title: settings.legalPages.privacyTitle, text: settings.legalPages.privacyText },
    { title: settings.legalPages.offerTitle, text: settings.legalPages.offerText }
  ];

  return (
    <section className="section">
      <div className="container">
        <SectionHeading
          eyebrow={dict.pages.legal.eyebrow}
          title={dict.pages.legal.title}
          text={dict.pages.legal.text}
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
