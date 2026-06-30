"use client";

import Link from "next/link";

import { AddToCartButton } from "@/components/commerce/add-to-cart-button";
import { CatalogVisual } from "@/components/catalog-visual";
import type { CatalogItem } from "@/lib/catalog-types";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/ru";
import { localizeHref } from "@/lib/i18n/routing";
import { buildTelegramLeadUrl } from "@/lib/i18n/telegram-lead";
import { getProductDisplayCategory } from "@/lib/product-categories";
import { formatPrice } from "@/lib/utils";

function getCategoryLabel(item: CatalogItem, dict: Dictionary) {
  if (item.type === "product") {
    return getProductDisplayCategory(item);
  }
  return dict.catalog.services;
}

export function CatalogCard({
  item,
  locale,
  dict
}: {
  item: CatalogItem;
  locale: Locale;
  dict: Dictionary;
}) {
  const detailHref = localizeHref(
    locale,
    item.type === "service" ? `/services/${item.slug}` : `/products/${item.slug}`
  );
  const categoryLabel = getCategoryLabel(item, dict);

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
          <span>{item.type === "service" ? dict.catalog.services : dict.catalog.products}</span>
          <span>{categoryLabel}</span>
        </div>
        <h3 className="card-title">{item.title}</h3>
        <p>{item.description}</p>
        <div className="card-footer">
          <div className="price-row">
            <div className="price">
              {item.type === "service"
                ? formatPrice(item.price, dict.catalog.fromPrice)
                : formatPrice(item.price)}
            </div>
          </div>
          <div className="card-actions">
            <Link className="btn btn-ghost btn-small" href={detailHref}>
              {dict.catalog.viewDetails}
            </Link>
            <AddToCartButton
              itemType={item.type}
              slug={item.slug}
              className="btn btn-primary btn-small"
              label={dict.catalog.addToCart}
            />
            {item.type === "service" ? (
              <a
                className="btn btn-ghost btn-small"
                href={buildTelegramLeadUrl(dict.common.telegramServiceLead, item.title)}
                target="_blank"
                rel="noreferrer"
              >
                {dict.catalog.clarify}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
