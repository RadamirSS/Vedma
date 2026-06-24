import type { CatalogItem } from "@/lib/mock-data";

export function CatalogVisual({
  item,
  variant = "card"
}: {
  item: CatalogItem;
  variant?: "card" | "detail";
}) {
  if (item.image) {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.image} alt={item.title} loading="lazy" />
      </>
    );
  }

  return (
    <span className={variant === "detail" ? "detail-icon" : "pic-icon"}>{item.icon}</span>
  );
}
