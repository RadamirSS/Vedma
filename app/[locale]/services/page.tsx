import type { Metadata } from "next";

import { CatalogCard } from "@/components/catalog-card";
import { LeadCta } from "@/components/lead-cta";
import { SectionHeading } from "@/components/section-heading";
import { ServiceDirectionsGrid } from "@/components/service-directions-grid";
import { getPublishedServices } from "@/lib/catalog/repository";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);

  return {
    title: dict.pages.services.metaTitle,
    description: dict.pages.services.metaDescription
  };
}

export default async function ServicesPage({ params }: PageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);
  const services = await getPublishedServices();

  return (
    <>
      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow={dict.pages.services.directionsEyebrow}
            title={dict.pages.services.directionsTitle}
            text={dict.pages.services.directionsText}
          />
          <ServiceDirectionsGrid id="directions" locale={locale} dict={dict} />
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <SectionHeading
            eyebrow={dict.pages.services.catalogEyebrow}
            title={dict.pages.services.catalogTitle}
            text={dict.pages.services.catalogText}
          />
          <div className="cards-grid">
            {services.map((item) => (
              <CatalogCard key={item.id} item={item} locale={locale} dict={dict} />
            ))}
          </div>
          <LeadCta
            title={dict.pages.services.leadCtaTitle}
            text={dict.pages.services.leadCtaText}
            buttonLabel={dict.pages.services.leadCtaButton}
          />
        </div>
      </section>
    </>
  );
}
