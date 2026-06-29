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

  const deliveryLines = [
    order.deliveryCountry ? `Страна: ${order.deliveryCountry}` : null,
    order.deliveryCity ? `Город: ${order.deliveryCity}` : null,
    order.deliveryAddress1 ? `Адрес: ${order.deliveryAddress1}` : null,
    order.deliveryAddress2 ? `Дополнение: ${order.deliveryAddress2}` : null,
    order.deliveryPostalCode ? `Индекс: ${order.deliveryPostalCode}` : null
  ].filter(Boolean);

  return (
    <AccountShell
      title={order.orderNumber}
      description="Детали заказа, статусы и вложения. Оплата пока подтверждается вручную — реквизиты пришлёт администратор после проверки заказа."
      user={session.user}
      activeHref="/account/orders"
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
          <p className="muted stack-top">
            Онлайн-оплата пока не подключена. После подтверждения заказа администратор отправит реквизиты
            отдельно, а статус обновится в этом кабинете.
          </p>
        </aside>
      </div>

      <div className="dashboard-grid stack-top">
        {order.customerComment ? (
          <article className="form-card">
            <h3>Комментарий к заказу</h3>
            <p>{order.customerComment}</p>
          </article>
        ) : null}
        {order.deliveryRequired && deliveryLines.length > 0 ? (
          <article className="form-card">
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
          <h3>PDF и вложения ({order.files.length})</h3>
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
