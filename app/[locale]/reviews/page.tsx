import { SectionHeading } from "@/components/section-heading";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getPublishedReviews } from "@/lib/reviews";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ReviewsPage({ params }: PageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);
  const reviews = await getPublishedReviews(locale);

  return (
    <section className="section">
      <div className="container">
        <SectionHeading
          eyebrow={dict.pages.reviews.eyebrow}
          title={dict.pages.reviews.title}
          text={dict.pages.reviews.text}
        />
        <div className="reviews">
          {reviews.map((review) => (
            <article key={review.id} className="review-card">
              <span className="service">{review.service}</span>
              <p>«{review.quote}»</p>
              <small>{review.author}</small>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
