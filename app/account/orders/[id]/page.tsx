import { notFound } from "next/navigation";

import { AccountShell } from "@/components/account/account-shell";
import { requireCustomerSession } from "@/lib/auth/session";
import { formatAdminDate } from "@/lib/admin/format";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/admin/constants";
import { formatPrice } from "@/lib/utils";
import { prisma } from "@/lib/db/prisma";

export default async function AccountOrderDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireCustomerSession("/account/orders");
  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: {
      id,
      customerId: session.user.id
    },
    include: {
      items: true,
      files: true,
      payments: true,
      statusHistory: { orderBy: { createdAt: "desc" } }
    }
  });

  if (!order) {
    notFound();
  }

  return (
    <AccountShell
      title={order.orderNumber}
      description="Детали заказа, ручной статус платежа и история обработки."
      user={session.user}
    >
      <div className="dashboard-grid">
        <article className="form-card">
          <h3>Состав заказа</h3>
          <div className="account-order-list">
            {order.items.map((item) => (
              <div key={item.id} className="summary-line">
                <span>
                  {item.titleSnapshot} × {item.quantity}
                </span>
                <b>{formatPrice(item.priceSnapshot * item.quantity)}</b>
              </div>
            ))}
          </div>
          <div className="summary-line summary-total">
            <span>Итого</span>
            <b>{formatPrice(order.totalAmount)}</b>
          </div>
        </article>
        <aside className="cart-summary">
          <h3>Статусы</h3>
          <div className="summary-line">
            <span>Заказ</span>
            <b>{ORDER_STATUS_LABELS[order.status]}</b>
          </div>
          <div className="summary-line">
            <span>Платеж</span>
            <b>{PAYMENT_STATUS_LABELS[order.paymentStatus]}</b>
          </div>
        </aside>
      </div>

      <div className="dashboard-grid stack-top">
        <article className="form-card">
          <h3>История обработки</h3>
          <div className="account-order-list">
            {order.statusHistory.map((entry) => (
              <div key={entry.id} className="summary-line">
                <span>
                  {entry.newStatus}
                  {entry.comment ? ` · ${entry.comment}` : ""}
                </span>
                <b>{formatAdminDate(entry.createdAt)}</b>
              </div>
            ))}
          </div>
        </article>
        <article className="cart-summary">
          <h3>PDF и вложения</h3>
          {order.files.length === 0 ? (
            <p className="muted">Вложений нет.</p>
          ) : (
            <div className="account-order-list">
              {order.files.map((file) => (
                <div key={file.id} className="summary-line">
                  <span>{file.originalName}</span>
                  <b>{Math.round(file.size / 1024)} KB</b>
                </div>
              ))}
            </div>
          )}
        </article>
      </div>
    </AccountShell>
  );
}
