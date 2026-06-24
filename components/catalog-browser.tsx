"use client";

import { useMemo, useState } from "react";

import { CatalogCard } from "@/components/catalog-card";
import type { CatalogItem } from "@/lib/mock-data";
import { getProductDisplayCategory, PRODUCT_CATEGORIES } from "@/lib/product-categories";

export function CatalogBrowser({
  items,
  searchPlaceholder,
  useDisplayCategories = false
}: {
  items: CatalogItem[];
  searchPlaceholder: string;
  useDisplayCategories?: boolean;
}) {
  const categories = useMemo(() => {
    if (!useDisplayCategories) {
      return [...new Set(items.map((item) => item.category))];
    }
    const present = new Set(items.map((item) => getProductDisplayCategory(item)));
    return PRODUCT_CATEGORIES.filter((category) => present.has(category));
  }, [items, useDisplayCategories]);

  const [activeCategory, setActiveCategory] = useState("Все");
  const [search, setSearch] = useState("");

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const itemCategory = useDisplayCategories
          ? getProductDisplayCategory(item)
          : item.category;
        const matchesCategory = activeCategory === "Все" || itemCategory === activeCategory;
        const value = `${item.title} ${item.description}`.toLowerCase();
        const matchesSearch = value.includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
      }),
    [activeCategory, items, search, useDisplayCategories]
  );

  return (
    <div className="catalog-shell">
      <aside className="filters">
        <h3>Фильтры</h3>
        <input
          className="search"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="filter-group">
          <strong>Категория</strong>
          <div className="chip-row">
            {["Все", ...categories].map((category) => (
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
            <h3>Ничего не найдено</h3>
            <p>Попробуйте изменить запрос или выбрать другую категорию.</p>
          </div>
        ) : (
          <div className="cards-grid">
            {filteredItems.map((item) => (
              <CatalogCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
