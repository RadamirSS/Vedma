import Link from "next/link";

import { AccountShell } from "@/components/account/account-shell";
import { requireCustomerSession } from "@/lib/auth/session";
import { formatAdminDate } from "@/lib/admin/format";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/admin/constants";
import { formatPrice } from "@/lib/utils";
import { prisma } from "@/lib/db/prisma";

export default async function AccountOrdersPage() {
  const session = await requireCustomerSession("/account/orders");
  const orders = await prisma.order.findMany({
    where: { customerId: session.user.id },
    include: {
      items: true,
      files: true
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <AccountShell
      title="Мои заказы"
      description="Все оформленные товары и услуги хранятся здесь. Заказ создается сразу, а администратор вручную подтверждает оплату и обновляет статус в кабинете."
      user={session.user}
    >
      <div className="account-grid">
        {orders.length === 0 ? (
          <article className="form-card">
            <h3>Заказов пока нет</h3>
            <p className="muted">После оформления корзины здесь появятся номера заказов, статусы и список вложений.</p>
          </article>
        ) : (
          orders.map((order) => (
            <article key={order.id} className="form-card">
              <div className="account-card-head">
                <div>
                  <strong>{order.orderNumber}</strong>
                  <p className="muted">{formatAdminDate(order.createdAt)}</p>
                </div>
                <div className="account-statuses">
                  <span className="pill">{ORDER_STATUS_LABELS[order.status]}</span>
                  <span className="pill">{PAYMENT_STATUS_LABELS[order.paymentStatus]}</span>
                </div>
              </div>
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
              <div className="account-card-foot">
                <span className="muted">
                  Вложений: {order.files.length}
                </span>
                <Link className="btn btn-ghost btn-small" href={`/account/orders/${order.id}`}>
                  Открыть заказ
                </Link>
              </div>
            </article>
          ))
        )}
      </div>
    </AccountShell>
  );
}
