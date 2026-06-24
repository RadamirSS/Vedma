import Link from "next/link";
import type { Route } from "next";

import { CatalogCard } from "@/components/catalog-card";
import { SectionHeading } from "@/components/section-heading";
import type { CatalogItem } from "@/lib/mock-data";

export function FeaturedBlock({
  eyebrow,
  title,
  text,
  items,
  viewAllHref,
  viewAllLabel
}: {
  eyebrow: string;
  title: string;
  text: string;
  items: CatalogItem[];
  viewAllHref: Route;
  viewAllLabel: string;
}) {
  return (
    <section className="section">
      <div className="container">
        <SectionHeading eyebrow={eyebrow} title={title} text={text} />
        <div className="cards-grid">
          {items.map((item) => (
            <CatalogCard key={item.id} item={item} />
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
