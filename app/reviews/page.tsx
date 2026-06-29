import { SectionHeading } from "@/components/section-heading";
import { getPublishedReviews } from "@/lib/reviews";

export default async function ReviewsPage() {
  const reviews = await getPublishedReviews();

  return (
    <section className="section">
      <div className="container">
        <SectionHeading
          eyebrow="Социальное доказательство"
          title="Отзывы клиентов"
          text="Реальные истории клиентов с фильтрами по типу услуги и карточками отзывов."
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
