"use client";

import Link from "next/link";
import type { Route } from "next";

import { CatalogVisual } from "@/components/catalog-visual";
import { useCart } from "@/components/cart-context";
import type { CatalogItem } from "@/lib/mock-data";
import { getProductDisplayCategory } from "@/lib/product-categories";
import { formatPrice } from "@/lib/utils";

const TELEGRAM = "https://t.me/Bazhena13witch";

function getCategoryLabel(item: CatalogItem) {
  if (item.type === "product") {
    return getProductDisplayCategory(item);
  }
  return "Услуга";
}

export function CatalogCard({ item }: { item: CatalogItem }) {
  const { addToCart } = useCart();
  const detailHref =
    (item.type === "service" ? `/services/${item.slug}` : `/products/${item.slug}`) as Route;
  const categoryLabel = getCategoryLabel(item);

  return (
    <article className="product-card">
      <div className={`pic ${item.accent}${item.image ? " has-image" : ""}`}>
        <span className="badge">{categoryLabel}</span>
        {item.availability ? (
          <span className={`stock ${item.availability.includes("Под") ? "order" : ""}`}>
            {item.availability}
          </span>
        ) : null}
        <CatalogVisual item={item} />
      </div>
      <div className="card-body">
        <div className="meta">
          <span>{item.type === "service" ? "Услуга" : "Товар"}</span>
          <span>{categoryLabel}</span>
        </div>
        <h3 className="card-title">{item.title}</h3>
        <p>{item.description}</p>
        <div className="card-footer">
          <div className="price-row">
            <div className="price">
              {item.type === "service" ? formatPrice(item.price, "от") : formatPrice(item.price)}
            </div>
          </div>
          <div className="card-actions">
            <Link className="btn btn-ghost btn-small" href={detailHref}>
              Подробнее
            </Link>
            {item.type === "service" ? (
              <a
                className="btn btn-primary btn-small"
                href={`${TELEGRAM}?text=${encodeURIComponent(`Здравствуйте! Интересует услуга: ${item.title}`)}`}
                target="_blank"
                rel="noreferrer"
              >
                Записаться
              </a>
            ) : (
              <button className="btn btn-primary btn-small" type="button" onClick={() => addToCart(item.id)}>
                В корзину
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
