import Link from "next/link";
import { notFound } from "next/navigation";

import { updateCustomerNotesAction } from "@/app/admin/actions";
import { AdminNotice } from "@/components/admin/admin-notice";
import { AdminReadOnlyNotice } from "@/components/admin/admin-read-only-notice";
import { SubmitButton } from "@/components/admin/submit-button";
import { formatAdminDate } from "@/lib/admin/format";
import { isReadOnlyAdminRole, requireAdminSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getAdminLocaleFromCookies } from "@/lib/i18n/admin/detect-locale";
import { getAdminDictionary } from "@/lib/i18n/admin/get-admin-dictionary";

export default async function AdminCustomerDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getAdminLocaleFromCookies();
  const dict = await getAdminDictionary(locale);
  const t = dict.customers.detail;
  const { id } = await params;
  const query = await searchParams;
  const session = await requireAdminSession(`/admin/customers/${id}`);
  const isReadOnly = isReadOnlyAdminRole(session.user.role);
  const canViewPrivateFiles = session.user.role === "ADMIN";
  const success = typeof query.success === "string" ? query.success : undefined;
  const customer = await prisma.user.findFirst({
    where: {
      id,
      role: "CUSTOMER"
    },
    include: {
      customerProfile: true,
      customerOrders: {
        orderBy: { createdAt: "desc" }
      },
      customerRequests: {
        orderBy: { createdAt: "desc" }
      },
      customerFiles: {
        orderBy: { uploadedAt: "desc" }
      }
    }
  });

  if (!customer) {
    notFound();
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-title">
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{customer.name ?? customer.email}</h1>
          <p>{customer.email}</p>
        </div>
        <Link className="btn btn-ghost" href="/admin/customers">
          {t.backToList}
        </Link>
      </div>

      <AdminNotice success={success} />
      {isReadOnly ? <AdminReadOnlyNotice text={dict.demoMode.customers} /> : null}

      <div className="admin-detail-grid">
        <article className="admin-card">
          <div className="admin-section-head">
            <h2>{t.contactsTitle}</h2>
            <p>{t.contactsDescription}</p>
          </div>
          <div className="admin-side-list">
            <div className="summary-line">
              <span>{dict.common.phone}</span>
              <b>{customer.phone ?? dict.common.emDash}</b>
            </div>
            <div className="summary-line">
              <span>{dict.common.telegram}</span>
              <b>{customer.telegram ?? dict.common.emDash}</b>
            </div>
            <div className="summary-line">
              <span>{t.city}</span>
              <b>{customer.customerProfile?.city ?? dict.common.emDash}</b>
            </div>
            <div className="summary-line">
              <span>{t.country}</span>
              <b>{customer.customerProfile?.country ?? dict.common.emDash}</b>
            </div>
            <div className="summary-line">
              <span>{t.address}</span>
              <b>{customer.customerProfile?.addressLine1 ?? dict.common.emDash}</b>
            </div>
          </div>
        </article>

        <article className="admin-card">
          <div className="admin-section-head">
            <h2>{t.notesTitle}</h2>
            <p>{t.notesDescriptionShort}</p>
          </div>
          <form className="admin-form-grid" action={updateCustomerNotesAction}>
            <input type="hidden" name="userId" value={customer.id} />
            <input type="hidden" name="adminLocale" value={locale} />
            <label className="admin-field full">
              <span>{t.note}</span>
              <textarea
                className="admin-textarea"
                name="adminNotes"
                defaultValue={customer.customerProfile?.adminNotes ?? ""}
                disabled={isReadOnly}
              />
            </label>
            {!isReadOnly ? (
              <SubmitButton className="btn btn-primary" pendingLabel={dict.common.saving}>
                {t.saveNotes}
              </SubmitButton>
            ) : null}
          </form>
        </article>
      </div>

      <div className="admin-detail-grid">
        <article className="admin-card">
          <div className="admin-section-head">
            <h2>{t.ordersTitle}</h2>
            <p>{t.ordersDescription}</p>
          </div>
          <div className="admin-side-list">
            {customer.customerOrders.map((order) => (
              <Link key={order.id} className="admin-card" href={`/admin/orders/${order.id}`}>
                <strong>{order.orderNumber}</strong>
                <span>{formatAdminDate(order.createdAt, locale)}</span>
              </Link>
            ))}
          </div>
        </article>

        <article className="admin-card">
          <div className="admin-section-head">
            <h2>{t.requestsAndPdfTitle}</h2>
            <p>{t.requestsAndPdfDescription}</p>
          </div>
          <div className="admin-side-list">
            {customer.customerRequests.map((request) => (
              <Link key={request.id} className="admin-card" href={`/admin/requests/${request.id}`}>
                <strong>{request.requestNumber}</strong>
                <span>{formatAdminDate(request.createdAt, locale)}</span>
              </Link>
            ))}
            {canViewPrivateFiles ? (
              customer.customerFiles.map((file) => (
                <a key={file.id} className="btn btn-ghost btn-small" href={`/admin/files/${file.id}`}>
                  {file.originalName}
                </a>
              ))
            ) : customer.customerFiles.length > 0 ? (
              <p className="muted">{dict.orders.detail.privateFilesAdminOnly}</p>
            ) : null}
          </div>
        </article>
      </div>
    </div>
  );
}
