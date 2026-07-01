import Link from "next/link";

import { AdminNotice } from "@/components/admin/admin-notice";
import { CommerceScopeTabs } from "@/components/admin/commerce-scope-tabs";
import { orderListWhere, resolveCommerceScope } from "@/lib/admin/commerce-filters";
import { formatAdminDate, parseSearchParam } from "@/lib/admin/format";
import { requireAdminSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { formatPrice } from "@/lib/utils";
import { getAdminLocaleFromCookies } from "@/lib/i18n/admin/detect-locale";
import {
  getCommerceScopeTabs,
  getOrderStatusLabels,
  getPaymentStatusLabels
} from "@/lib/i18n/admin/constants";
import { getAdminDictionary } from "@/lib/i18n/admin/get-admin-dictionary";

export default async function AdminOrdersPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getAdminLocaleFromCookies();
  const dict = await getAdminDictionary(locale);
  const t = dict.orders;
  const orderStatusLabels = getOrderStatusLabels(dict);
  const paymentStatusLabels = getPaymentStatusLabels(dict);
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
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p>{t.description}</p>
        </div>
      </div>

      <AdminNotice success={success} error={error} />

      <CommerceScopeTabs
        basePath="/admin/orders"
        currentScope={currentScope}
        tabs={session.user.role === "ADMIN" ? getCommerceScopeTabs(dict) : []}
        query={q}
      />

      <div className="admin-toolbar">
        <form>
          {scopeParam ? <input type="hidden" name="scope" value={scopeParam} /> : null}
          <input className="admin-input" name="q" placeholder={dict.filters.searchOrder} defaultValue={q} />
          <div />
          <div />
          <button className="btn btn-ghost" type="submit">
            {dict.common.search}
          </button>
        </form>
      </div>

      <div className="admin-table">
        <table>
          <thead>
            <tr>
              <th>{t.table.order}</th>
              <th>{t.table.client}</th>
              <th>{t.table.items}</th>
              <th>{t.table.total}</th>
              <th>{t.table.statuses}</th>
              <th>{t.table.created}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>
                  <strong>{order.orderNumber}</strong>
                  {order.isTest ? <span className="admin-badge admin-badge-test">{dict.common.test}</span> : null}
                  <div className="muted">{order.customerEmail ?? dict.common.emDash}</div>
                </td>
                <td>
                  <strong>{order.customerName ?? order.customer.name ?? dict.common.noName}</strong>
                  <div className="muted">{order.customerPhone ?? order.customer.phone ?? dict.common.emDash}</div>
                </td>
                <td>{order.items.length}</td>
                <td>{formatPrice(order.totalAmount)}</td>
                <td>
                  <div className="admin-side-list">
                    <span className="admin-badge">{orderStatusLabels[order.status]}</span>
                    <span className="admin-badge">{paymentStatusLabels[order.paymentStatus]}</span>
                  </div>
                </td>
                <td>{formatAdminDate(order.createdAt, locale)}</td>
                <td>
                  <Link className="btn btn-ghost btn-small" href={`/admin/orders/${order.id}`}>
                    {dict.common.open}
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
