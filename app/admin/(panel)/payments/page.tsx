import { updatePaymentStatusAction } from "@/app/admin/actions";
import { AdminNotice } from "@/components/admin/admin-notice";
import { AdminReadOnlyNotice } from "@/components/admin/admin-read-only-notice";
import { CommerceScopeTabs } from "@/components/admin/commerce-scope-tabs";
import { SubmitButton } from "@/components/admin/submit-button";
import { paymentListWhere, resolveCommerceScope } from "@/lib/admin/commerce-filters";
import { formatAdminDate } from "@/lib/admin/format";
import { isReadOnlyAdminRole, requireAdminSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { formatPrice } from "@/lib/utils";
import { getAdminLocaleFromCookies } from "@/lib/i18n/admin/detect-locale";
import {
  getCommerceScopeTabs,
  getPaymentStatusLabels,
  getPaymentStatusOptions
} from "@/lib/i18n/admin/constants";
import { getAdminDictionary } from "@/lib/i18n/admin/get-admin-dictionary";

export default async function AdminPaymentsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getAdminLocaleFromCookies();
  const dict = await getAdminDictionary(locale);
  const t = dict.payments;
  const paymentStatusLabels = getPaymentStatusLabels(dict);
  const params = await searchParams;
  const session = await requireAdminSession("/admin/payments");
  const isReadOnly = isReadOnlyAdminRole(session.user.role);
  const scopeParam = typeof params.scope === "string" ? params.scope : undefined;
  const currentScope = resolveCommerceScope(session.user.role, scopeParam);
  const success = typeof params.success === "string" ? params.success : undefined;
  const error = typeof params.error === "string" ? params.error : undefined;
  const payments = await prisma.payment.findMany({
    where: paymentListWhere(session.user.role, scopeParam),
    include: {
      order: {
        include: { customer: true }
      }
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
      {isReadOnly ? <AdminReadOnlyNotice text={dict.demoMode.payments} /> : null}

      <CommerceScopeTabs
        basePath="/admin/payments"
        currentScope={currentScope}
        tabs={session.user.role === "ADMIN" ? getCommerceScopeTabs(dict) : []}
      />

      <div className="admin-side-list">
        {payments.map((payment) => (
          <form key={payment.id} className="admin-card admin-form-grid" action={updatePaymentStatusAction}>
            <input type="hidden" name="id" value={payment.id} />
            <input type="hidden" name="adminLocale" value={locale} />
            <div>
              <strong>{payment.order?.orderNumber ?? t.noOrder}</strong>
              <p>{payment.order?.customerEmail ?? payment.order?.customer.email ?? dict.common.emDash}</p>
              <small>{formatAdminDate(payment.createdAt, locale)}</small>
            </div>
            <div>
              <strong>{formatPrice(payment.amount)}</strong>
              <p>{paymentStatusLabels[payment.status]}</p>
            </div>
            <label className="admin-field">
              <span>{dict.common.status}</span>
              <select className="admin-select" name="status" defaultValue={payment.status} disabled={isReadOnly}>
                {getPaymentStatusOptions(dict).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-field full">
              <span>{dict.common.comment}</span>
              <textarea className="admin-textarea" name="adminComment" defaultValue={payment.adminComment ?? ""} disabled={isReadOnly} />
            </label>
            {!isReadOnly ? (
              <SubmitButton className="btn btn-primary btn-small" pendingLabel={dict.common.saving}>
                {t.update}
              </SubmitButton>
            ) : null}
          </form>
        ))}
      </div>
    </div>
  );
}
