import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CatalogCard } from "@/components/catalog-card";
import { CatalogVisual } from "@/components/catalog-visual";
import { LegalNotice } from "@/components/legal-notice";
import {
  getProductBySlug,
  getPublishedProducts
} from "@/lib/catalog/repository";
import { getProductDisplayCategory } from "@/lib/product-categories";
import { formatPrice } from "@/lib/utils";

export async function generateStaticParams() {
  const products = await getPublishedProducts();
  return products.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = await getProductBySlug(slug);
  if (!item) {
    return { title: "Товар" };
  }
  return {
    title: item.title,
    description: item.description
  };
}

export default async function ProductDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
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
              <Link className="btn btn-primary" href="/checkout">
                Добавить в оформление
              </Link>
              <a
                className="btn btn-ghost"
                href="https://t.me/Bazhena13witch"
                target="_blank"
                rel="noreferrer"
              >
                Уточнить детали
              </a>
              {item.sourceUrl ? (
                <a className="btn btn-ghost" href={item.sourceUrl} target="_blank" rel="noreferrer">
                  Источник: VK
                </a>
              ) : null}
            </div>
          </div>
        </div>

        <div className="detail-grid">
          <article className="form-card">
            <h3>Описание и подача</h3>
            <ul className="detail-list">
              {item.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          </article>
          <article className="cart-summary">
            <h3>Важно перед заказом</h3>
            <LegalNotice />
          </article>
        </div>

        <div className="section section-related">
          <div className="section-title">
            <div>
              <span className="eyebrow">Сопутствующие товары</span>
              <h2>Еще может понравиться</h2>
            </div>
            <p>Товары из той же категории и смежных направлений.</p>
          </div>
          <div className="cards-grid">
            {products.filter((product) => product.id !== item.id).slice(0, 3).map((product) => (
              <CatalogCard key={product.id} item={product} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
