import { SectionHeading } from "@/components/section-heading";
import { reviews } from "@/lib/mock-data";

export default function ReviewsPage() {
  return (
    <section className="section">
      <div className="container">
        <SectionHeading
          eyebrow="Социальное доказательство"
          title="Отзывы клиентов"
          text="В реальной версии сюда можно добавить скриншоты Telegram / VK, фильтры по типу услуги и карточки историй."
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
