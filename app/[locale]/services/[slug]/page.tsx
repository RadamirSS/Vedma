import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AddToCartButton } from "@/components/commerce/add-to-cart-button";
import { CatalogCard } from "@/components/catalog-card";
import { CatalogVisual } from "@/components/catalog-visual";
import { SoftTrustNotice } from "@/components/soft-trust-notice";
import {
  getPublishedServices,
  getServiceBySlug
} from "@/lib/catalog/repository";
import { locales, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizeHref } from "@/lib/i18n/routing";
import { formatPrice } from "@/lib/utils";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateStaticParams() {
  const services = await getPublishedServices();
  return locales.flatMap((locale) => services.map((item) => ({ locale, slug: item.slug })));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: localeParam, slug } = await params;
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);
  const item = await getServiceBySlug(slug);
  if (!item) {
    return { title: dict.catalog.services };
  }
  return {
    title: item.title,
    description: item.description
  };
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { locale: localeParam, slug } = await params;
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);
  const [item, services] = await Promise.all([
    getServiceBySlug(slug),
    getPublishedServices()
  ]);
  if (!item) notFound();

  return (
    <section className="section">
      <div className="container">
        <div className="detail-hero">
          <div className={`detail-visual ${item.accent}${item.image ? " has-image" : ""}`}>
            <CatalogVisual item={item} variant="detail" />
          </div>
          <div className="detail-copy">
            <span className="eyebrow">{dict.catalog.serviceLabel}</span>
            <h1 className="detail-title">{item.title}</h1>
            <p className="lead">{item.description}</p>
            <div className="detail-meta">
              <span className="pill">{item.subtitle}</span>
              <span className="pill">
                {dict.catalog.fromPrice} {formatPrice(item.price)}
              </span>
            </div>
            <div className="hero-actions">
              <AddToCartButton
                itemType="service"
                slug={item.slug}
                className="btn btn-primary"
                label={dict.catalog.addToCart}
              />
              <Link className="btn btn-ghost" href={localizeHref(locale, "/checkout")}>
                {dict.catalog.goToCheckout}
              </Link>
              <a
                className="btn btn-ghost"
                href="https://t.me/Bazhena13witch"
                target="_blank"
                rel="noreferrer"
              >
                {dict.catalog.writeTelegram}
              </a>
            </div>
          </div>
        </div>

        <div className="detail-grid">
          <article className="form-card">
            <h3>{dict.catalog.whatsIncluded}</h3>
            <ul className="detail-list">
              {item.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          </article>
          <article className="cart-summary">
            <h3>{dict.catalog.beforeOrder}</h3>
            <SoftTrustNotice text={dict.trust.softNotice} />
          </article>
        </div>

        <div className="section section-related">
          <div className="section-title">
            <div>
              <span className="eyebrow">{dict.catalog.relatedServicesEyebrow}</span>
              <h2>{dict.catalog.relatedServicesTitle}</h2>
            </div>
            <p>{dict.catalog.relatedServicesText}</p>
          </div>
          <div className="cards-grid">
            {services.filter((service) => service.id !== item.id).slice(0, 3).map((service) => (
              <CatalogCard key={service.id} item={service} locale={locale} dict={dict} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
