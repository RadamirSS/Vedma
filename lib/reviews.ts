import { cache } from "react";

import { prisma } from "@/lib/db/prisma";
import { reviews as fallbackReviews } from "@/lib/mock-data";

export const getPublishedReviews = cache(async () => {
  if (!process.env.DATABASE_URL) {
    return fallbackReviews;
  }

  try {
    const reviews = await prisma.review.findMany({
      where: { publicationStatus: "PUBLISHED" },
      orderBy: { updatedAt: "desc" }
    });

    if (reviews.length === 0) {
      return fallbackReviews;
    }

    return reviews.map((review) => ({
      id: review.id,
      service: review.title ?? "Отзыв клиента",
      quote: review.text,
      author: review.authorName ?? "Клиент"
    }));
  } catch {
    return fallbackReviews;
  }
});
