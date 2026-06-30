import Link from "next/link";
import { notFound } from "next/navigation";

import { updateRequestStatusAction } from "@/app/admin/actions";
import { AdminNotice } from "@/components/admin/admin-notice";
import { AdminReadOnlyNotice } from "@/components/admin/admin-read-only-notice";
import { SubmitButton } from "@/components/admin/submit-button";
import { formatAdminDate } from "@/lib/admin/format";
import { isReadOnlyAdminRole, requireAdminSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getAdminLocaleFromCookies } from "@/lib/i18n/admin/detect-locale";
import { getRequestStatusLabels, getRequestStatusOptions } from "@/lib/i18n/admin/constants";
import { getAdminDictionary } from "@/lib/i18n/admin/get-admin-dictionary";

export default async function AdminRequestDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getAdminLocaleFromCookies();
  const dict = await getAdminDictionary(locale);
  const t = dict.requests.detail;
  const requestStatusLabels = getRequestStatusLabels(dict);
  const { id } = await params;
  const query = await searchParams;
  const session = await requireAdminSession(`/admin/requests/${id}`);
  const isReadOnly = isReadOnlyAdminRole(session.user.role);
  const success = typeof query.success === "string" ? query.success : undefined;
  const request = await prisma.request.findUnique({
    where: { id },
    include: {
      selectedProduct: true,
      selectedService: true,
      customer: true,
      responsibleUser: true,
      statusHistory: {
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!request) {
    notFound();
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-title">
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{request.requestNumber}</h1>
          <p>{request.name ?? request.email ?? dict.common.noName}</p>
        </div>
        <Link className="btn btn-ghost" href="/admin/requests">
          {t.backToList}
        </Link>
      </div>

      <AdminNotice success={success} />
      {isReadOnly ? <AdminReadOnlyNotice text={dict.demoMode.requests} /> : null}

      <div className="admin-detail-grid">
        <article className="admin-card">
          <div className="admin-section-head">
            <h2>{t.dataTitle}</h2>
            <p>{t.dataDescription}</p>
          </div>
          <div className="admin-side-list">
            <div className="summary-line">
              <span>{dict.common.email}</span>
              <b>{request.email ?? dict.common.emDash}</b>
            </div>
            <div className="summary-line">
              <span>{dict.common.phone}</span>
              <b>{request.phone ?? dict.common.emDash}</b>
            </div>
            <div className="summary-line">
              <span>{dict.common.telegram}</span>
              <b>{request.telegram ?? dict.common.emDash}</b>
            </div>
            <div className="summary-line">
              <span>{t.selected}</span>
              <b>{request.selectedProduct?.title ?? request.selectedService?.title ?? dict.common.emDash}</b>
            </div>
            <p>{request.comment ?? t.commentMissing}</p>
          </div>
        </article>

        <article className="admin-card">
          <div className="admin-section-head">
            <h2>{t.updateStatus}</h2>
            <p>{t.updateStatusDescription}</p>
          </div>
          <form className="admin-form-grid" action={updateRequestStatusAction}>
            <input type="hidden" name="id" value={request.id} />
            <input type="hidden" name="adminLocale" value={locale} />
            <label className="admin-field">
              <span>{dict.common.status}</span>
              <select className="admin-select" name="status" defaultValue={request.status} disabled={isReadOnly}>
                {getRequestStatusOptions(dict).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-field full">
              <span>{t.internalComment}</span>
              <textarea className="admin-textarea" name="adminComment" defaultValue={request.adminComment ?? ""} disabled={isReadOnly} />
            </label>
            {!isReadOnly ? (
              <SubmitButton className="btn btn-primary" pendingLabel={dict.common.saving}>
                {t.saveRequest}
              </SubmitButton>
            ) : null}
          </form>
          <div className="stack-top">
            <div className="summary-line">
              <span>{dict.orders.detail.currentStatus}</span>
              <b>{requestStatusLabels[request.status]}</b>
            </div>
            <div className="summary-line">
              <span>{dict.common.responsible}</span>
              <b>{request.responsibleUser?.name ?? request.responsibleUser?.email ?? dict.common.emDash}</b>
            </div>
            <div className="summary-line">
              <span>{dict.common.createdAt}</span>
              <b>{formatAdminDate(request.createdAt, locale)}</b>
            </div>
          </div>
        </article>
      </div>

      <div className="admin-card">
        <div className="admin-section-head">
          <h2>{t.historyTitle}</h2>
          <p>{t.historyDescription}</p>
        </div>
        <div className="admin-side-list">
          {request.statusHistory.map((entry) => (
            <div key={entry.id} className="admin-card">
              <strong>{entry.newStatus}</strong>
              <span>{entry.comment ?? dict.common.noComment}</span>
              <small>{formatAdminDate(entry.createdAt, locale)}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
