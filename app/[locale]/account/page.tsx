import Link from "next/link";
import { redirect } from "next/navigation";

import { AccountShell } from "@/components/account/account-shell";
import { AdminNotice } from "@/components/admin/admin-notice";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/admin/constants";
import { formatAdminDate } from "@/lib/admin/format";
import { getCurrentAdminSession, getCurrentCustomerSession } from "@/lib/auth/session";
import { getSiteSettings } from "@/lib/admin/settings";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizeHref } from "@/lib/i18n/routing";
import { formatPrice } from "@/lib/utils";
import { prisma } from "@/lib/db/prisma";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AccountPage({ params, searchParams }: PageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);

  const routeParams = await searchParams;
  const success = typeof routeParams.success === "string" ? routeParams.success : undefined;
  const adminSession = await getCurrentAdminSession();
  if (adminSession) {
    redirect("/admin/dashboard?error=Кабинет+клиента+недоступен+для+администратора.");
  }

  const session = await getCurrentCustomerSession();
  if (!session) {
    redirect(localizeHref(locale, "/account/login"));
  }

  const settings = await getSiteSettings();
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
      title={dict.account.overviewTitle}
      description={dict.account.overviewDescription}
      user={session.user}
      activeHref="/account"
      locale={locale}
      dict={dict}
    >
      <AdminNotice success={success} />

      <div className="dashboard-grid">
        <article className="form-card">
          <h3>{dict.account.profileCard}</h3>
          <div className="account-order-list">
            <div className="summary-line">
              <span>{dict.account.name}</span>
              <b>{session.user.name ?? dict.account.notSpecified}</b>
            </div>
            <div className="summary-line">
              <span>{dict.account.email}</span>
              <b>{session.user.email}</b>
            </div>
            <div className="summary-line">
              <span>{dict.account.phone}</span>
              <b>{session.user.phone ?? "—"}</b>
            </div>
          </div>
          <div className="account-card-foot stack-top">
            <Link className="btn btn-ghost btn-small" href={localizeHref(locale, "/account/profile")}>
              {dict.account.editProfile}
            </Link>
          </div>
        </article>
        <aside className="cart-summary">
          <h3>{dict.account.summaryCard}</h3>
          <div className="account-order-list">
            <div className="summary-line">
              <span>{dict.account.totalOrders}</span>
              <b>{totalOrders}</b>
            </div>
            <div className="summary-line">
              <span>{dict.account.inProgress}</span>
              <b>{inProgress}</b>
            </div>
            <div className="summary-line">
              <span>{dict.account.awaitingPayment}</span>
              <b>{awaitingPayment}</b>
            </div>
          </div>
          <p className="muted stack-top">{dict.account.paymentSetupNote}</p>
        </aside>
      </div>

      <div className="dashboard-grid stack-top">
        <article className="form-card">
          <h3>{dict.account.quickActions}</h3>
          <div className="hero-actions">
            <Link className="btn btn-primary btn-wide" href={localizeHref(locale, "/products")}>
              {dict.account.goToProducts}
            </Link>
            <Link className="btn btn-ghost btn-wide" href={localizeHref(locale, "/services")}>
              {dict.account.chooseService}
            </Link>
            <a className="btn btn-ghost btn-wide" href={settings.socialLinks.telegram} target="_blank" rel="noreferrer">
              {dict.account.contactSupport}
            </a>
            <Link className="btn btn-ghost btn-wide" href={localizeHref(locale, "/account/orders")}>
              {dict.account.viewOrders}
            </Link>
          </div>
        </article>
      </div>

      <div className="account-grid stack-top">
        {orders.length === 0 ? (
          <article className="form-card">
            <h3>{dict.account.noOrders}</h3>
            <p className="muted">{dict.account.emptyOrdersDetail}</p>
            <div className="stack-top hero-actions">
              <Link className="btn btn-primary" href={localizeHref(locale, "/products")}>
                {dict.account.goToProducts}
              </Link>
              <Link className="btn btn-ghost" href={localizeHref(locale, "/services")}>
                {dict.account.chooseService}
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
                <span>{dict.cart.total}</span>
                <b>{formatPrice(order.totalAmount)}</b>
              </div>
              <div className="account-card-foot">
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
