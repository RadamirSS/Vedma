import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CatalogCard } from "@/components/catalog-card";
import { CatalogVisual } from "@/components/catalog-visual";
import { LegalNotice } from "@/components/legal-notice";
import { services, getServiceBySlug } from "@/lib/mock-data";
import { formatPrice } from "@/lib/utils";

export function generateStaticParams() {
  return services.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = getServiceBySlug(slug);
  if (!item) {
    return { title: "Услуга" };
  }
  return {
    title: item.title,
    description: item.description
  };
}

export default async function ServiceDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = getServiceBySlug(slug);
  if (!item) notFound();

  return (
    <section className="section">
      <div className="container">
        <div className="detail-hero">
          <div className={`detail-visual ${item.accent}${item.image ? " has-image" : ""}`}>
            <CatalogVisual item={item} variant="detail" />
          </div>
          <div className="detail-copy">
            <span className="eyebrow">Услуга</span>
            <h1 className="detail-title">{item.title}</h1>
            <p className="lead">{item.description}</p>
            <div className="detail-meta">
              <span className="pill">{item.subtitle}</span>
              <span className="pill">от {formatPrice(item.price)}</span>
            </div>
            <div className="hero-actions">
              <Link className="btn btn-primary" href="/checkout">
                Оформить заявку
              </Link>
              <a
                className="btn btn-ghost"
                href="https://t.me/Bazhena13witch"
                target="_blank"
                rel="noreferrer"
              >
                Написать в Telegram
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
            <h3>Что входит</h3>
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
              <span className="eyebrow">Рекомендуем дальше</span>
              <h2>Похожие форматы</h2>
            </div>
            <p>Другие форматы работы и направления — в каталоге услуг.</p>
          </div>
          <div className="cards-grid">
            {services.filter((service) => service.id !== item.id).slice(0, 3).map((service) => (
              <CatalogCard key={service.id} item={service} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
