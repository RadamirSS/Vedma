import Link from "next/link";
import { notFound } from "next/navigation";

import { updateOrderStatusAction } from "@/app/admin/actions";
import { AdminNotice } from "@/components/admin/admin-notice";
import { AdminReadOnlyNotice } from "@/components/admin/admin-read-only-notice";
import { SubmitButton } from "@/components/admin/submit-button";
import { resolveCommerceScope } from "@/lib/admin/commerce-filters";
import { formatAdminDate } from "@/lib/admin/format";
import { isReadOnlyAdminRole, requireAdminSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { formatPrice } from "@/lib/utils";
import { getAdminLocaleFromCookies } from "@/lib/i18n/admin/detect-locale";
import {
  getContactMethodLabels,
  getOrderStatusLabels,
  getOrderStatusOptions,
  getPaymentStatusLabels,
  getPaymentStatusOptions
} from "@/lib/i18n/admin/constants";
import { getAdminDictionary } from "@/lib/i18n/admin/get-admin-dictionary";

export default async function AdminOrderDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getAdminLocaleFromCookies();
  const dict = await getAdminDictionary(locale);
  const t = dict.orders.detail;
  const orderStatusLabels = getOrderStatusLabels(dict);
  const paymentStatusLabels = getPaymentStatusLabels(dict);
  const contactMethodLabels = getContactMethodLabels(dict);
  const { id } = await params;
  const query = await searchParams;
  const session = await requireAdminSession(`/admin/orders/${id}`);
  const isReadOnly = isReadOnlyAdminRole(session.user.role);
  const canViewPrivateFiles = session.user.role === "ADMIN";
  const success = typeof query.success === "string" ? query.success : undefined;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      items: {
        include: {
          product: true,
          service: true
        }
      },
      files: true,
      payments: true,
      statusHistory: {
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!order) {
    notFound();
  }

  const commerceScope = resolveCommerceScope(session.user.role);
  if (commerceScope === "production" && order.isTest) {
    notFound();
  }
  if (commerceScope === "test" && !order.isTest) {
    notFound();
  }

  const deliveryLines = [
    order.deliveryAddressFull,
    [order.deliveryCountry, order.deliveryRegion, order.deliveryCity].filter(Boolean).join(", "),
    [order.deliveryStreet, order.deliveryHouse, order.deliveryFlat].filter(Boolean).join(", "),
    order.deliveryAddress1,
    order.deliveryAddress2,
    order.deliveryPostalCode ? t.postalCode.replace("{code}", order.deliveryPostalCode) : null
  ].filter(Boolean);

  const clientName = order.customerName ?? order.customer.name ?? order.customer.email;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-title">
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{order.orderNumber}</h1>
          <p>{t.clientLine.replace("{name}", clientName)}</p>
          {order.isTest ? <span className="admin-badge admin-badge-test">{t.testOrder}</span> : null}
        </div>
        <Link className="btn btn-ghost" href="/admin/orders">
          {t.backToList}
        </Link>
      </div>

      <AdminNotice success={success} />
      {isReadOnly ? <AdminReadOnlyNotice text={dict.demoMode.orders} /> : null}
      {order.statusHistory.some((entry) =>
        entry.comment?.includes("Клиент отметил оплату через временную заглушку")
      ) ? (
        <div className="admin-card admin-card--highlight stack-top">
          <h3>{t.paymentStubTitle}</h3>
          <p>{t.paymentStubText}</p>
        </div>
      ) : null}

      <div className="admin-detail-grid">
        <article>
          <div className="admin-section-head">
            <h2>{t.compositionTitle}</h2>
            <p>{t.compositionDescription}</p>
          </div>
          <div className="admin-table">
            <table>
              <thead>
                <tr>
                  <th>{dict.common.item}</th>
                  <th>{dict.common.type}</th>
                  <th>{dict.common.quantity}</th>
                  <th>{dict.common.price}</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.titleSnapshot}</td>
                    <td>{item.itemType === "PRODUCT" ? t.product : t.service}</td>
                    <td>{item.quantity}</td>
                    <td>{formatPrice(item.priceSnapshot * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="summary-line summary-total stack-top">
            <span>{dict.common.total}</span>
            <b>{formatPrice(order.totalAmount)}</b>
          </div>
        </article>

        <aside className="admin-side-list">
          <div className="admin-card">
            <h3>{t.contactsTitle}</h3>
            <p>{order.customerEmail ?? order.customer.email}</p>
            <p>{order.customerPhone ?? order.customer.phone ?? t.phoneMissing}</p>
            <p>{order.customerTelegram ?? order.customer.telegram ?? t.telegramMissing}</p>
            <p>
              {t.contactMethod}:{" "}
              {order.contactMethod ? contactMethodLabels[order.contactMethod] : dict.common.notSelected}
            </p>
          </div>
          {order.deliveryRequired ? (
            <div className="admin-card">
              <h3>{t.delivery}</h3>
              {deliveryLines.length > 0 ? (
                deliveryLines.map((line) => <p key={line}>{line}</p>)
              ) : (
                <p className="muted">{t.addressMissing}</p>
              )}
              {order.preferredContactAt ? <p>{t.preferredTime}: {order.preferredContactAt}</p> : null}
            </div>
          ) : order.preferredContactAt ? (
            <div className="admin-card">
              <h3>{t.preferredTime}</h3>
              <p>{order.preferredContactAt}</p>
            </div>
          ) : null}
          {order.customerComment ? (
            <div className="admin-card">
              <h3>{t.clientCommentTitle}</h3>
              <p>{order.customerComment}</p>
            </div>
          ) : null}
          <div className="admin-card">
            <h3>{t.files}</h3>
            {order.files.length === 0 ? (
              <p className="muted">{t.filesNone}</p>
            ) : !canViewPrivateFiles ? (
              <p className="muted">{t.privateFilesAdminOnly}</p>
            ) : (
              <div className="admin-side-list">
                {order.files.map((file) => (
                  <a key={file.id} className="btn btn-ghost btn-small" href={`/admin/files/${file.id}`}>
                    {file.originalName}
                  </a>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      <div className="admin-detail-grid">
        <article className="admin-card">
          <div className="admin-section-head">
            <h2>{t.updateStatusesTitle}</h2>
            <p>{t.updateStatusesDescription}</p>
          </div>
          <form className="admin-form-grid" action={updateOrderStatusAction}>
            <input type="hidden" name="id" value={order.id} />
            <input type="hidden" name="adminLocale" value={locale} />
            <label className="admin-field">
              <span>{t.orderStatus}</span>
              <select className="admin-select" name="status" defaultValue={order.status} disabled={isReadOnly}>
                {getOrderStatusOptions(dict).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-field">
              <span>{t.paymentStatus}</span>
              <select className="admin-select" name="paymentStatus" defaultValue={order.paymentStatus} disabled={isReadOnly}>
                {getPaymentStatusOptions(dict).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-field full">
              <span>{t.adminComment}</span>
              <textarea className="admin-textarea" name="adminComment" defaultValue={order.adminComment ?? ""} disabled={isReadOnly} />
            </label>
            {!isReadOnly ? (
              <SubmitButton className="btn btn-primary" pendingLabel={dict.common.saving}>
                {t.saveStatus}
              </SubmitButton>
            ) : null}
          </form>
        </article>

        <article className="admin-card">
          <div className="admin-section-head">
            <h2>{t.historyTitle}</h2>
            <p>{t.historyDescription}</p>
          </div>
          <div className="admin-side-list">
            <div className="summary-line">
              <span>{t.currentStatus}</span>
              <b>{orderStatusLabels[order.status]}</b>
            </div>
            <div className="summary-line">
              <span>{t.currentPayment}</span>
              <b>{paymentStatusLabels[order.paymentStatus]}</b>
            </div>
            {order.statusHistory.map((entry) => (
              <div key={entry.id} className="admin-card">
                <strong>{entry.newStatus}</strong>
                <span>{entry.comment ?? dict.common.noComment}</span>
                <small>{formatAdminDate(entry.createdAt, locale)}</small>
              </div>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}
