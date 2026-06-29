import Link from "next/link";

import { AdminNotice } from "@/components/admin/admin-notice";
import { CommerceScopeTabs } from "@/components/admin/commerce-scope-tabs";
import {
  commerceScopeTabs,
  orderListWhere,
  resolveCommerceScope
} from "@/lib/admin/commerce-filters";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/admin/constants";
import { formatAdminDate, parseSearchParam } from "@/lib/admin/format";
import { requireAdminSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { formatPrice } from "@/lib/utils";

export default async function AdminOrdersPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const session = await requireAdminSession("/admin/orders");
  const q = parseSearchParam(params.q);
  const scopeParam = typeof params.scope === "string" ? params.scope : undefined;
  const currentScope = resolveCommerceScope(session.user.role, scopeParam);
  const success = typeof params.success === "string" ? params.success : undefined;
  const error = typeof params.error === "string" ? params.error : undefined;

  const searchWhere = q
    ? {
        OR: [
          { orderNumber: { contains: q, mode: "insensitive" as const } },
          { customerEmail: { contains: q, mode: "insensitive" as const } },
          { customerName: { contains: q, mode: "insensitive" as const } }
        ]
      }
    : undefined;

  const orders = await prisma.order.findMany({
    where: orderListWhere(session.user.role, scopeParam, searchWhere),
    include: {
      customer: true,
      items: true
    },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-title">
          <span className="eyebrow">Заказы</span>
          <h1>Commerce backlog</h1>
          <p>Новые корзины, ручные статусы оплаты и состав заказа в одной таблице.</p>
        </div>
      </div>

      <AdminNotice success={success} error={error} />

      <CommerceScopeTabs
        basePath="/admin/orders"
        currentScope={currentScope}
        tabs={commerceScopeTabs(session.user.role)}
        query={q}
      />

      <div className="admin-toolbar">
        <form>
          {scopeParam ? <input type="hidden" name="scope" value={scopeParam} /> : null}
          <input className="admin-input" name="q" placeholder="Номер, email или имя клиента" defaultValue={q} />
          <div />
          <div />
          <button className="btn btn-ghost" type="submit">
            Поиск
          </button>
        </form>
      </div>

      <div className="admin-table">
        <table>
          <thead>
            <tr>
              <th>Заказ</th>
              <th>Клиент</th>
              <th>Позиции</th>
              <th>Сумма</th>
              <th>Статусы</th>
              <th>Создан</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>
                  <strong>{order.orderNumber}</strong>
                  {order.isTest ? <span className="admin-badge admin-badge-test">Тест</span> : null}
                  <div className="muted">{order.customerEmail ?? "—"}</div>
                </td>
                <td>
                  <strong>{order.customerName ?? order.customer.name ?? "Без имени"}</strong>
                  <div className="muted">{order.customerPhone ?? order.customer.phone ?? "—"}</div>
                </td>
                <td>{order.items.length}</td>
                <td>{formatPrice(order.totalAmount)}</td>
                <td>
                  <div className="admin-side-list">
                    <span className="admin-badge">{ORDER_STATUS_LABELS[order.status]}</span>
                    <span className="admin-badge">{PAYMENT_STATUS_LABELS[order.paymentStatus]}</span>
                  </div>
                </td>
                <td>{formatAdminDate(order.createdAt)}</td>
                <td>
                  <Link className="btn btn-ghost btn-small" href={`/admin/orders/${order.id}`}>
                    Открыть
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
