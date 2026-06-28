import Link from "next/link";
import { notFound } from "next/navigation";

import { updateRequestStatusAction } from "@/app/admin/actions";
import { AdminNotice } from "@/components/admin/admin-notice";
import { SubmitButton } from "@/components/admin/submit-button";
import { REQUEST_STATUS_LABELS, REQUEST_STATUS_OPTIONS } from "@/lib/admin/constants";
import { formatAdminDate } from "@/lib/admin/format";
import { prisma } from "@/lib/db/prisma";

export default async function AdminRequestDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const success = typeof query.success === "string" ? query.success : undefined;
  const request = await prisma.request.findUnique({
    where: { id },
    include: {
      selectedProduct: true,
      selectedService: true,
      customer: true,
      responsibleUser: true,
      statusHistory: {
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!request) {
    notFound();
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-title">
          <span className="eyebrow">Заявка</span>
          <h1>{request.requestNumber}</h1>
          <p>{request.name ?? request.email ?? "Без имени"}</p>
        </div>
        <Link className="btn btn-ghost" href="/admin/requests">
          Назад к списку
        </Link>
      </div>

      <AdminNotice success={success} />

      <div className="admin-detail-grid">
        <article className="admin-card">
          <div className="admin-section-head">
            <h2>Данные заявки</h2>
            <p>Выбранная позиция, контакты и ручной комментарий.</p>
          </div>
          <div className="admin-side-list">
            <div className="summary-line">
              <span>Email</span>
              <b>{request.email ?? "—"}</b>
            </div>
            <div className="summary-line">
              <span>Телефон</span>
              <b>{request.phone ?? "—"}</b>
            </div>
            <div className="summary-line">
              <span>Telegram</span>
              <b>{request.telegram ?? "—"}</b>
            </div>
            <div className="summary-line">
              <span>Выбрано</span>
              <b>{request.selectedProduct?.title ?? request.selectedService?.title ?? "—"}</b>
            </div>
            <p>{request.comment ?? "Комментарий отсутствует."}</p>
          </div>
        </article>

        <article className="admin-card">
          <div className="admin-section-head">
            <h2>Обновить статус</h2>
            <p>Ответственный фиксируется автоматически текущим менеджером.</p>
          </div>
          <form className="admin-form-grid" action={updateRequestStatusAction}>
            <input type="hidden" name="id" value={request.id} />
            <label className="admin-field">
              <span>Статус</span>
              <select className="admin-select" name="status" defaultValue={request.status}>
                {REQUEST_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-field full">
              <span>Комментарий администратора</span>
              <textarea className="admin-textarea" name="adminComment" defaultValue={request.adminComment ?? ""} />
            </label>
            <SubmitButton className="btn btn-primary" pendingLabel="Сохранение...">
              Сохранить заявку
            </SubmitButton>
          </form>
          <div className="stack-top">
            <div className="summary-line">
              <span>Текущий статус</span>
              <b>{REQUEST_STATUS_LABELS[request.status]}</b>
            </div>
            <div className="summary-line">
              <span>Ответственный</span>
              <b>{request.responsibleUser?.name ?? request.responsibleUser?.email ?? "—"}</b>
            </div>
            <div className="summary-line">
              <span>Создана</span>
              <b>{formatAdminDate(request.createdAt)}</b>
            </div>
          </div>
        </article>
      </div>

      <div className="admin-card">
        <div className="admin-section-head">
          <h2>История</h2>
          <p>Хронология смены статусов.</p>
        </div>
        <div className="admin-side-list">
          {request.statusHistory.map((entry) => (
            <div key={entry.id} className="admin-card">
              <strong>{entry.newStatus}</strong>
              <span>{entry.comment ?? "Без комментария"}</span>
              <small>{formatAdminDate(entry.createdAt)}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
