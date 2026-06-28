import { updatePaymentStatusAction } from "@/app/admin/actions";
import { AdminNotice } from "@/components/admin/admin-notice";
import { SubmitButton } from "@/components/admin/submit-button";
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_OPTIONS } from "@/lib/admin/constants";
import { formatAdminDate } from "@/lib/admin/format";
import { prisma } from "@/lib/db/prisma";
import { formatPrice } from "@/lib/utils";

export default async function AdminPaymentsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const success = typeof params.success === "string" ? params.success : undefined;
  const error = typeof params.error === "string" ? params.error : undefined;
  const payments = await prisma.payment.findMany({
    include: {
      order: {
        include: { customer: true }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-title">
          <span className="eyebrow">Платежи</span>
          <h1>Ручной контроль оплаты</h1>
          <p>Онлайн-эквайринг не подключен: статусы меняются вручную после подтверждения.</p>
        </div>
      </div>

      <AdminNotice success={success} error={error} />

      <div className="admin-side-list">
        {payments.map((payment) => (
          <form key={payment.id} className="admin-card admin-form-grid" action={updatePaymentStatusAction}>
            <input type="hidden" name="id" value={payment.id} />
            <div>
              <strong>{payment.order?.orderNumber ?? "Без заказа"}</strong>
              <p>{payment.order?.customerEmail ?? payment.order?.customer.email ?? "—"}</p>
              <small>{formatAdminDate(payment.createdAt)}</small>
            </div>
            <div>
              <strong>{formatPrice(payment.amount)}</strong>
              <p>{PAYMENT_STATUS_LABELS[payment.status]}</p>
            </div>
            <label className="admin-field">
              <span>Статус</span>
              <select className="admin-select" name="status" defaultValue={payment.status}>
                {PAYMENT_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-field full">
              <span>Комментарий</span>
              <textarea className="admin-textarea" name="adminComment" defaultValue={payment.adminComment ?? ""} />
            </label>
            <SubmitButton className="btn btn-primary btn-small" pendingLabel="Сохранение...">
              Обновить платеж
            </SubmitButton>
          </form>
        ))}
      </div>
    </div>
  );
}
