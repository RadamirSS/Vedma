import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AddToCartButton } from "@/components/commerce/add-to-cart-button";
import { CatalogCard } from "@/components/catalog-card";
import { CatalogVisual } from "@/components/catalog-visual";
import { SoftTrustNotice } from "@/components/soft-trust-notice";
import {
  getProductBySlug,
  getPublishedProducts
} from "@/lib/catalog/repository";
import { locales, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizeHref } from "@/lib/i18n/routing";
import { getProductDisplayCategory } from "@/lib/product-categories";
import { formatPrice } from "@/lib/utils";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateStaticParams() {
  const products = await getPublishedProducts();
  return locales.flatMap((locale) => products.map((item) => ({ locale, slug: item.slug })));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: localeParam, slug } = await params;
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);
  const item = await getProductBySlug(slug);
  if (!item) {
    return { title: dict.catalog.products };
  }
  return {
    title: item.title,
    description: item.description
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { locale: localeParam, slug } = await params;
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);
  const [item, products] = await Promise.all([
    getProductBySlug(slug),
    getPublishedProducts()
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
            <span className="eyebrow">{getProductDisplayCategory(item)}</span>
            <h1 className="detail-title">{item.title}</h1>
            <p className="lead">{item.description}</p>
            <div className="detail-meta">
              <span className="pill">{item.subtitle}</span>
              <span className="pill">{item.availability}</span>
              <span className="pill">{formatPrice(item.price)}</span>
            </div>
            <div className="hero-actions">
              <AddToCartButton
                itemType="product"
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
                {dict.catalog.clarifyDetails}
              </a>
            </div>
          </div>
        </div>

        <div className="detail-grid">
          <article className="form-card">
            <h3>{dict.catalog.descriptionSection}</h3>
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
              <span className="eyebrow">{dict.catalog.relatedProductsEyebrow}</span>
              <h2>{dict.catalog.relatedProductsTitle}</h2>
            </div>
            <p>{dict.catalog.relatedProductsText}</p>
          </div>
          <div className="cards-grid">
            {products.filter((product) => product.id !== item.id).slice(0, 3).map((product) => (
              <CatalogCard key={product.id} item={product} locale={locale} dict={dict} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
