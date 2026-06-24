import { SectionHeading } from "@/components/section-heading";

export default function AdminPreviewPage() {
  return (
    <section className="section">
      <div className="container">
        <SectionHeading
          eyebrow="Опциональный экран"
          title="Визуальный preview админ-панели"
          text="Здесь показывается только настроение будущей внутренней системы: заявки, заказы и быстрые фильтры."
        />
        <div className="dashboard-grid">
          <article className="form-card">
            <h3>Новые заявки</h3>
            <div className="summary-line">
              <span>Диагностика ситуации</span>
              <b>Новая</b>
            </div>
            <div className="summary-line">
              <span>Свеча на денежный поток</span>
              <b>Уточнение деталей</b>
            </div>
            <div className="summary-line">
              <span>Родовая диагностика</span>
              <b>Назначена</b>
            </div>
          </article>
          <article className="cart-summary">
            <h3>Панель действий</h3>
            <p className="muted">Фильтры по статусам, подтверждение заявок и заметки администратора без реальной логики.</p>
          </article>
        </div>
      </div>
    </section>
  );
}
