import Link from "next/link";

import { AdminNotice } from "@/components/admin/admin-notice";
import { CommerceScopeTabs } from "@/components/admin/commerce-scope-tabs";
import { requestListWhere, resolveCommerceScope } from "@/lib/admin/commerce-filters";
import { formatAdminDate, parseSearchParam } from "@/lib/admin/format";
import { requireAdminSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getAdminLocaleFromCookies } from "@/lib/i18n/admin/detect-locale";
import { getCommerceScopeTabs, getRequestStatusLabels } from "@/lib/i18n/admin/constants";
import { getAdminDictionary } from "@/lib/i18n/admin/get-admin-dictionary";

export default async function AdminRequestsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getAdminLocaleFromCookies();
  const dict = await getAdminDictionary(locale);
  const t = dict.requests;
  const requestStatusLabels = getRequestStatusLabels(dict);
  const params = await searchParams;
  const session = await requireAdminSession("/admin/requests");
  const q = parseSearchParam(params.q);
  const scopeParam = typeof params.scope === "string" ? params.scope : undefined;
  const currentScope = resolveCommerceScope(session.user.role, scopeParam);
  const success = typeof params.success === "string" ? params.success : undefined;
  const error = typeof params.error === "string" ? params.error : undefined;

  const searchWhere = q
    ? {
        OR: [
          { requestNumber: { contains: q, mode: "insensitive" as const } },
          { email: { contains: q, mode: "insensitive" as const } },
          { name: { contains: q, mode: "insensitive" as const } }
        ]
      }
    : undefined;

  const requests = await prisma.request.findMany({
    where: requestListWhere(session.user.role, scopeParam, searchWhere),
    include: {
      selectedProduct: true,
      selectedService: true,
      responsibleUser: true
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
        basePath="/admin/requests"
        currentScope={currentScope}
        tabs={session.user.role === "ADMIN" ? getCommerceScopeTabs(dict) : []}
        query={q}
      />

      <div className="admin-toolbar">
        <form>
          {scopeParam ? <input type="hidden" name="scope" value={scopeParam} /> : null}
          <input className="admin-input" name="q" placeholder={dict.filters.searchRequest} defaultValue={q} />
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
              <th>{t.table.request}</th>
              <th>{t.table.client}</th>
              <th>{t.table.selected}</th>
              <th>{t.table.status}</th>
              <th>{t.table.responsible}</th>
              <th>{t.table.created}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id}>
                <td>
                  <strong>{request.requestNumber}</strong>
                  {request.isTest ? <span className="admin-badge admin-badge-test">{dict.common.test}</span> : null}
                  <div className="muted">{request.email ?? dict.common.emDash}</div>
                </td>
                <td>{request.name ?? dict.common.noName}</td>
                <td>{request.selectedProduct?.title ?? request.selectedService?.title ?? dict.common.emDash}</td>
                <td>
                  <span className="admin-badge">{requestStatusLabels[request.status]}</span>
                </td>
                <td>{request.responsibleUser?.name ?? request.responsibleUser?.email ?? dict.common.emDash}</td>
                <td>{formatAdminDate(request.createdAt, locale)}</td>
                <td>
                  <Link className="btn btn-ghost btn-small" href={`/admin/requests/${request.id}`}>
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
