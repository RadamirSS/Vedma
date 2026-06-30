import Link from "next/link";

import { AccountShell } from "@/components/account/account-shell";
import { requireCustomerSession } from "@/lib/auth/session";
import { formatAdminDate } from "@/lib/admin/format";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/admin/constants";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizeHref } from "@/lib/i18n/routing";
import { formatPrice } from "@/lib/utils";
import { prisma } from "@/lib/db/prisma";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AccountOrdersPage({ params }: PageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);
  const session = await requireCustomerSession(localizeHref(locale, "/account/orders"));
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
      title={dict.account.ordersPageTitle}
      description={dict.account.ordersPageDescription}
      user={session.user}
      activeHref="/account/orders"
      locale={locale}
      dict={dict}
    >
      <div className="account-grid">
        {orders.length === 0 ? (
          <article className="form-card">
            <h3>{dict.account.noOrders}</h3>
            <p className="muted">{dict.account.emptyOrdersAttachments}</p>
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
                <span>{dict.cart.total}</span>
                <b>{formatPrice(order.totalAmount)}</b>
              </div>
              <div className="account-card-foot">
                <span className="muted">
                  {dict.account.attachments}: {order.files.length}
                </span>
                <Link
                  className="btn btn-ghost btn-small"
                  href={localizeHref(locale, `/account/orders/${order.id}`)}
                >
                  {dict.account.openOrder}
                </Link>
              </div>
            </article>
          ))
        )}
      </div>
    </AccountShell>
  );
}
