"use client";

import { useMemo, useState } from "react";

import { CatalogCard } from "@/components/catalog-card";
import type { CatalogItem } from "@/lib/mock-data";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/ru";
import { getProductDisplayCategory, PRODUCT_CATEGORIES } from "@/lib/product-categories";

export function CatalogBrowser({
  items,
  searchPlaceholder,
  useDisplayCategories = false,
  locale,
  dict
}: {
  items: CatalogItem[];
  searchPlaceholder: string;
  useDisplayCategories?: boolean;
  locale: Locale;
  dict: Dictionary;
}) {
  const filterAll = dict.catalog.filterAll;

  const categories = useMemo(() => {
    if (!useDisplayCategories) {
      return [...new Set(items.map((item) => item.category))];
    }
    const present = new Set(items.map((item) => getProductDisplayCategory(item)));
    return PRODUCT_CATEGORIES.filter((category) => present.has(category));
  }, [items, useDisplayCategories]);

  const [activeCategory, setActiveCategory] = useState<string>(filterAll);
  const [search, setSearch] = useState("");

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const itemCategory = useDisplayCategories
          ? getProductDisplayCategory(item)
          : item.category;
        const matchesCategory = activeCategory === filterAll || itemCategory === activeCategory;
        const value = `${item.title} ${item.description}`.toLowerCase();
        const matchesSearch = value.includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
      }),
    [activeCategory, filterAll, items, search, useDisplayCategories]
  );

  return (
    <div className="catalog-shell">
      <aside className="filters">
        <h3>{dict.catalog.filters}</h3>
        <input
          className="search"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="filter-group">
          <strong>{dict.catalog.category}</strong>
          <div className="chip-row">
            {[filterAll, ...categories].map((category) => (
              <button
                key={category}
                className={`chip ${activeCategory === category ? "active" : ""}`}
                type="button"
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="catalog-results">
        {filteredItems.length === 0 ? (
          <div className="catalog-empty">
            <h3>{dict.catalog.noResults}</h3>
            <p>{dict.catalog.noResultsHint}</p>
          </div>
        ) : (
          <div className="cards-grid">
            {filteredItems.map((item) => (
              <CatalogCard key={item.id} item={item} locale={locale} dict={dict} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
