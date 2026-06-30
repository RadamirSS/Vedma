import Link from "next/link";
import type { Route } from "next";

import { CatalogCard } from "@/components/catalog-card";
import { SectionHeading } from "@/components/section-heading";
import type { CatalogItem } from "@/lib/mock-data";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/ru";

export function FeaturedBlock({
  eyebrow,
  title,
  text,
  items,
  viewAllHref,
  viewAllLabel,
  locale,
  dict
}: {
  eyebrow: string;
  title: string;
  text: string;
  items: CatalogItem[];
  viewAllHref: Route;
  viewAllLabel: string;
  locale: Locale;
  dict: Dictionary;
}) {
  return (
    <section className="section">
      <div className="container">
        <SectionHeading eyebrow={eyebrow} title={title} text={text} />
        <div className="cards-grid">
          {items.map((item) => (
            <CatalogCard key={item.id} item={item} locale={locale} dict={dict} />
          ))}
        </div>
        <div className="section-link-row">
          <Link className="btn btn-ghost" href={viewAllHref}>
            {viewAllLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
