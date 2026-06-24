import type { CatalogItem } from "@/lib/mock-data";
import { getProductDisplayCategory } from "@/lib/product-categories";

export function pickFeaturedItems(items: CatalogItem[], limit = 3) {
  const withImages = items.filter((item) => item.image);
  const source = withImages.length >= limit ? withImages : items;
  return source.slice(0, limit);
}

export function pickFeaturedProducts(products: CatalogItem[], limit = 6) {
  const withImages = products.filter((item) => item.image);
  const picked: CatalogItem[] = [];
  const usedCategories = new Set<string>();

  for (const item of withImages) {
    const category = getProductDisplayCategory(item);
    if (usedCategories.has(category)) {
      continue;
    }
    usedCategories.add(category);
    picked.push(item);
    if (picked.length >= limit) {
      break;
    }
  }

  if (picked.length < limit) {
    for (const item of withImages) {
      if (picked.some((entry) => entry.id === item.id)) {
        continue;
      }
      picked.push(item);
      if (picked.length >= limit) {
        break;
      }
    }
  }

  return picked;
}
