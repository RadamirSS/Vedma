import { CatalogBrowser } from "@/components/catalog-browser";
import { SectionHeading } from "@/components/section-heading";
import { getPublishedProducts } from "@/lib/catalog/repository";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getCategoryCounts } from "@/lib/product-categories";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);

  return {
    title: dict.pages.products.metaTitle,
    description: dict.pages.products.metaDescription
  };
}

export default async function ProductsPage({ params }: PageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);
  const products = await getPublishedProducts(locale);
  const categoryCounts = getCategoryCounts(products, locale);

  return (
    <section className="section">
      <div className="container">
        <SectionHeading
          eyebrow={dict.pages.products.eyebrow}
          title={dict.pages.products.title}
          text={dict.pages.products.text}
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
          searchPlaceholder={dict.catalog.productSearchPlaceholder}
          useDisplayCategories
          locale={locale}
          dict={dict}
        />
      </div>
    </section>
  );
}
