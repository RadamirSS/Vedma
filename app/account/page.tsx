import Link from "next/link";
import { redirect } from "next/navigation";

import { AccountShell } from "@/components/account/account-shell";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/admin/constants";
import { formatAdminDate } from "@/lib/admin/format";
import { getCurrentCustomerSession } from "@/lib/auth/session";
import { formatPrice } from "@/lib/utils";
import { prisma } from "@/lib/db/prisma";

export default async function AccountPage() {
  const session = await getCurrentCustomerSession();
  if (!session) {
    redirect("/account/login");
  }

  const orders = await prisma.order.findMany({
    where: { customerId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 3,
    include: { items: true }
  });

  const statusCounts = await prisma.order.groupBy({
    by: ["status", "paymentStatus"],
    where: { customerId: session.user.id },
    _count: { _all: true }
  });

  const totalOrders = statusCounts.reduce((sum, row) => sum + row._count._all, 0);
  const awaitingPayment = statusCounts
    .filter((row) =>
      ["NOT_ISSUED", "INVOICE_SENT", "PENDING", "PARTIAL"].includes(row.paymentStatus)
    )
    .reduce((sum, row) => sum + row._count._all, 0);
  const inProgress = statusCounts
    .filter((row) => row.status !== "COMPLETED" && row.status !== "CANCELLED")
    .reduce((sum, row) => sum + row._count._all, 0);

  return (
    <AccountShell
      title="Обзор"
      description="Здесь собраны ваши заказы, статусы и быстрые переходы в каталог."
      user={session.user}
      activeHref="/account"
    >
      <div className="dashboard-grid">
        <article className="form-card">
          <h3>Сводка</h3>
          <div className="account-order-list">
            <div className="summary-line">
              <span>Всего заказов</span>
              <b>{totalOrders}</b>
            </div>
            <div className="summary-line">
              <span>В работе</span>
              <b>{inProgress}</b>
            </div>
            <div className="summary-line">
              <span>Ожидают оплаты</span>
              <b>{awaitingPayment}</b>
            </div>
          </div>
          <p className="muted stack-top">
            Онлайн-оплата пока не подключена. После оформления администратор подтвердит заказ и отправит
            реквизиты вручную, а статус обновится здесь.
          </p>
        </article>
        <aside className="cart-summary">
          <h3>Быстрые действия</h3>
          <div className="stack-top hero-actions">
            <Link className="btn btn-primary btn-wide" href="/services">
              Каталог услуг
            </Link>
            <Link className="btn btn-ghost btn-wide" href="/products">
              Каталог товаров
            </Link>
            <Link className="btn btn-ghost btn-wide" href="/account/orders">
              Все заказы
            </Link>
          </div>
        </aside>
      </div>

      <div className="account-grid stack-top">
        {orders.length === 0 ? (
          <article className="form-card">
            <h3>Заказов пока нет</h3>
            <p className="muted">
              После оформления корзины здесь появятся номера заказов, статусы и состав.
            </p>
            <div className="stack-top">
              <Link className="btn btn-primary" href="/products">
                Выбрать товары
              </Link>
            </div>
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
                {order.items.slice(0, 2).map((item) => (
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
