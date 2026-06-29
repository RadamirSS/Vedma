import { notFound } from "next/navigation";

import { AccountShell } from "@/components/account/account-shell";
import { AdminNotice } from "@/components/admin/admin-notice";
import { OrderPaymentBlock } from "@/components/account/order-payment-block";
import { requireCustomerSession } from "@/lib/auth/session";
import { formatAdminDate } from "@/lib/admin/format";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/admin/constants";
import { formatPrice } from "@/lib/utils";
import { prisma } from "@/lib/db/prisma";

export default async function AccountOrderDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireCustomerSession("/account/orders");
  const query = await searchParams;
  const success = typeof query.success === "string" ? query.success : undefined;
  const error = typeof query.error === "string" ? query.error : undefined;
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

  const deliveryLines = [
    order.deliveryAddressFull,
    [order.deliveryCountry, order.deliveryRegion, order.deliveryCity].filter(Boolean).join(", "),
    [order.deliveryStreet, order.deliveryHouse, order.deliveryFlat].filter(Boolean).join(", "),
    order.deliveryAddress1,
    order.deliveryAddress2,
    order.deliveryPostalCode ? `Индекс: ${order.deliveryPostalCode}` : null
  ].filter(Boolean);

  const hasServiceItems = order.items.some((item) => item.itemType === "SERVICE");

  return (
    <AccountShell
      title={order.orderNumber}
      description="Детали заказа, оплата и следующие шаги."
      user={session.user}
      activeHref="/account/orders"
    >
      <AdminNotice success={success} error={error} />

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
            <span>Номер заказа</span>
            <b>{order.orderNumber}</b>
          </div>
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
        <OrderPaymentBlock orderId={order.id} paymentStatus={order.paymentStatus} />
        {order.customerComment ? (
          <article className="form-card">
            <h3>{hasServiceItems ? "Запрос / комментарий" : "Комментарий к заказу"}</h3>
            <p>{order.customerComment}</p>
            {order.preferredContactAt ? (
              <p className="muted stack-top">Удобное время связи: {order.preferredContactAt}</p>
            ) : null}
          </article>
        ) : order.preferredContactAt ? (
          <article className="form-card">
            <h3>Удобное время связи</h3>
            <p>{order.preferredContactAt}</p>
          </article>
        ) : null}
      </div>

      {order.deliveryRequired && deliveryLines.length > 0 ? (
        <article className="form-card stack-top">
          <h3>Доставка</h3>
          <div className="account-order-list">
            {deliveryLines.map((line) => (
              <div key={line} className="summary-line">
                <span>{line}</span>
              </div>
            ))}
          </div>
        </article>
      ) : null}

      <article className="form-card stack-top">
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

      {order.files.length > 0 ? (
        <article className="form-card stack-top">
          <h3>Вложения ({order.files.length})</h3>
          <div className="account-order-list">
            {order.files.map((file) => (
              <div key={file.id} className="summary-line">
                <span>{file.originalName}</span>
                <b>{Math.round(file.size / 1024)} KB</b>
              </div>
            ))}
          </div>
        </article>
      ) : null}
    </AccountShell>
  );
}
