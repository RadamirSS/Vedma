"use client";

import Link from "next/link";
import type { Route } from "next";

import { AddToCartButton } from "@/components/commerce/add-to-cart-button";
import { CatalogVisual } from "@/components/catalog-visual";
import type { CatalogItem } from "@/lib/catalog-types";
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
            <AddToCartButton
              itemType={item.type}
              slug={item.slug}
              className="btn btn-primary btn-small"
              label={item.type === "service" ? "В корзину" : "В корзину"}
            />
            {item.type === "service" ? (
              <a
                className="btn btn-ghost btn-small"
                href={`${TELEGRAM}?text=${encodeURIComponent(`Здравствуйте! Интересует услуга: ${item.title}`)}`}
                target="_blank"
                rel="noreferrer"
              >
                Уточнить
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
