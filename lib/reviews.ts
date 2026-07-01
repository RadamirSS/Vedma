import { cache } from "react";

import type { Locale } from "@/lib/i18n/config";
import { getDictionarySync } from "@/lib/i18n/get-dictionary";
import { prisma } from "@/lib/db/prisma";

export const getPublishedReviews = cache(async (locale: Locale = "ru") => {
  const dict = getDictionarySync(locale);
  const fallbackReviews = dict.pages.reviews.samples;

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
      service: review.title ?? dict.pages.reviews.defaultService,
      quote: review.text,
      author: review.authorName ?? dict.pages.reviews.defaultAuthor
    }));
  } catch {
    return fallbackReviews;
  }
});
