export type CatalogItem = {
  id: string;
  slug: string;
  type: "service" | "product";
  title: string;
  category: string;
  subtitle: string;
  description: string;
  price: number;
  badge: string;
  availability?: string;
  icon: string;
  accent: "tarot" | "candle" | "amulet" | "game" | "rod" | "stone";
  details: string[];
  image?: string;
  sourceUrl?: string;
};
