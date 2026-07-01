import Link from "next/link";

import { FeaturedBlock } from "@/components/featured-block";
import { HomeDirections } from "@/components/home-directions";
import { HomeHero } from "@/components/home-hero";
import { SectionHeading } from "@/components/section-heading";
import { VisualGallery } from "@/components/visual-gallery";
import { pickFeaturedItems, pickFeaturedProducts } from "@/lib/catalog-helpers";
import { getPublishedProducts, getPublishedServices } from "@/lib/catalog/repository";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizeHref } from "@/lib/i18n/routing";
import { getPublishedReviews } from "@/lib/reviews";
import { getSiteSettings } from "@/lib/admin/settings";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bajena.it";

  return {
    title: dict.meta.defaultTitle,
    description: dict.meta.defaultDescription,
    alternates: {
      canonical: `${siteUrl}/${locale}`,
      languages: {
        en: `${siteUrl}/en`,
        ru: `${siteUrl}/ru`,
        "x-default": `${siteUrl}/en`
      }
    }
  };
}

export default async function HomePage({ params }: PageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);
  const settings = await getSiteSettings();

  const [products, services, publishedReviews] = await Promise.all([
    getPublishedProducts(),
    getPublishedServices(locale),
    getPublishedReviews(locale)
  ]);

  return (
    <>
      <HomeHero locale={locale} dict={dict} settings={settings} />
      <HomeDirections locale={locale} dict={dict} />

      <FeaturedBlock
        eyebrow={dict.home.featuredServicesEyebrow}
        title={dict.home.featuredServicesTitle}
        text={dict.home.featuredServicesText}
        items={pickFeaturedItems(services, 8)}
        viewAllHref={localizeHref(locale, "/services")}
        viewAllLabel={dict.home.allServices}
        locale={locale}
        dict={dict}
      />

      <FeaturedBlock
        eyebrow={dict.home.featuredProductsEyebrow}
        title={dict.home.featuredProductsTitle}
        text={dict.home.featuredProductsText}
        items={pickFeaturedProducts(products, 6)}
        viewAllHref={localizeHref(locale, "/products")}
        viewAllLabel={dict.home.allProducts}
        locale={locale}
        dict={dict}
      />

      <VisualGallery />

      <section className="section">
        <div className="container">
          <SectionHeading eyebrow={dict.home.benefitsEyebrow} title={dict.home.benefitsTitle} />
          <div className="benefits-grid">
            {dict.home.benefits.map((benefit) => (
              <article key={benefit} className="benefit-card benefit-card--text">
                <p>{benefit}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow={dict.home.processEyebrow}
            title={dict.home.processTitle}
            text={dict.home.processText}
          />
          <div className="steps">
            {dict.home.processSteps.map((step) => (
              <article key={step} className="step-card">
                <h3>{step}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow={dict.home.reviewsEyebrow}
            title={dict.home.reviewsTitle}
            text={dict.home.reviewsText}
          />
          <div className="reviews">
            {publishedReviews.map((review) => (
              <article key={review.id} className="review-card">
                <span className="service">{review.service}</span>
                <p>«{review.quote}»</p>
                <small>{review.author}</small>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cta">
            <div>
              <span className="eyebrow">{dict.home.ctaEyebrow}</span>
              <h2>{dict.home.ctaTitle}</h2>
              <p>{dict.home.ctaText}</p>
            </div>
            <div className="cta-actions">
              <Link className="btn btn-primary" href={localizeHref(locale, "/services")}>
                {dict.home.ctaServices}
              </Link>
              <Link className="btn btn-ghost" href={localizeHref(locale, "/products")}>
                {dict.home.ctaProducts}
              </Link>
              <a
                className="btn btn-wine"
                href={settings.socialLinks.telegram}
                target="_blank"
                rel="noreferrer"
              >
                {dict.home.ctaTelegram}
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
