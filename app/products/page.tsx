import { CatalogBrowser } from "@/components/catalog-browser";
import { SectionHeading } from "@/components/section-heading";
import { getCategoryCounts } from "@/lib/product-categories";
import { products } from "@/lib/mock-data";

export const metadata = {
  title: "Магазин",
  description:
    "Магические товары Бажены: браслеты, камни, алтарные товары, декор, обереги и подарки для личной практики."
};

export default function ProductsPage() {
  const categoryCounts = getCategoryCounts(products);

  return (
    <section className="section">
      <div className="container">
        <SectionHeading
          eyebrow="Интернет-магазин"
          title="Магические товары"
          text="Свечи, амулеты, браслеты, обереги и ритуальные наборы для личной практики, защиты и ресурса."
        />

        <div className="category-nav">
          {categoryCounts.map((entry) => (
            <article key={entry.category} className="category-nav__item">
              {entry.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={entry.thumbnail} alt="" loading="lazy" />
              ) : null}
              <div>
                <strong>{entry.category}</strong>
                <span>{entry.count}</span>
              </div>
            </article>
          ))}
        </div>

        <CatalogBrowser
          items={products}
          searchPlaceholder="Поиск товара"
          useDisplayCategories
        />
      </div>
    </section>
  );
}
