import { SectionHeading } from "@/components/section-heading";

export default function AccountPreviewPage() {
  return (
    <section className="section">
      <div className="container">
        <SectionHeading
          eyebrow="Опциональный экран"
          title="Личный кабинет клиента"
          text="Экран показывает только визуальное направление: статусы заказов, недавние обращения и быстрые действия."
        />
        <div className="dashboard-grid">
          <article className="form-card">
            <h3>Мои заказы</h3>
            <div className="summary-line">
              <span>Расклад на отношения</span>
              <b>Ожидает подтверждения</b>
            </div>
            <div className="summary-line">
              <span>Свеча «Защита»</span>
              <b>Собирается</b>
            </div>
            <div className="summary-line">
              <span>Амулет на личную силу</span>
              <b>Под заказ</b>
            </div>
          </article>
          <article className="cart-summary">
            <h3>Быстрые действия</h3>
            <p className="muted">Повторить заказ, задать вопрос Бажене, посмотреть историю заявок.</p>
          </article>
        </div>
      </div>
    </section>
  );
}
