import Link from "next/link";

import { bulkServicesAction } from "@/app/admin/actions";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminNotice } from "@/components/admin/admin-notice";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminReadOnlyNotice } from "@/components/admin/admin-read-only-notice";
import { SubmitButton } from "@/components/admin/submit-button";
import { buildPagination, formatAdminDate, parseSearchParam } from "@/lib/admin/format";
import { isReadOnlyAdminRole, requireAdminSession } from "@/lib/auth/session";
import { formatPrice } from "@/lib/utils";
import { prisma } from "@/lib/db/prisma";
import { getAdminLocaleFromCookies } from "@/lib/i18n/admin/detect-locale";
import { getCategoryDisplayLabel, getPublicationOptions } from "@/lib/i18n/admin/constants";
import { getAdminDictionary } from "@/lib/i18n/admin/get-admin-dictionary";

const PAGE_SIZE = 12;

export default async function AdminServicesPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getAdminLocaleFromCookies();
  const dict = await getAdminDictionary(locale);
  const t = dict.services;
  const publicationOptions = getPublicationOptions(dict);
  const params = await searchParams;
  const q = parseSearchParam(params.q);
  const status = parseSearchParam(params.status);
  const sort = parseSearchParam(params.sort, "updatedAt-desc");
  const page = Number.parseInt(parseSearchParam(params.page, "1"), 10) || 1;
  const session = await requireAdminSession("/admin/services");
  const isReadOnly = isReadOnlyAdminRole(session.user.role);
  const success = typeof params.success === "string" ? params.success : undefined;
  const error = typeof params.error === "string" ? params.error : undefined;
  const query = new URLSearchParams();
  if (q) query.set("q", q);
  if (status) query.set("status", status);
  if (sort) query.set("sort", sort);

  const where = {
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { slug: { contains: q, mode: "insensitive" as const } }
          ]
        }
      : {}),
    ...(status ? { publicationStatus: status as "DRAFT" | "PUBLISHED" | "ARCHIVED" } : {})
  };

  const total = await prisma.service.count({ where });
  const pagination = buildPagination(page, total, PAGE_SIZE);
  const [field, direction] = sort.split("-");
  const items = await prisma.service.findMany({
    where,
    orderBy: { [field || "updatedAt"]: direction === "asc" ? "asc" : "desc" },
    skip: pagination.skip,
    take: pagination.pageSize
  });

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-title">
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p>{t.description}</p>
        </div>
        {!isReadOnly ? (
          <Link className="btn btn-primary" href="/admin/services/new">
            {t.new}
          </Link>
        ) : null}
      </div>
      <AdminNotice success={success} error={error} />
      {isReadOnly ? <AdminReadOnlyNotice /> : null}
      <div className="admin-toolbar">
        <form>
          <input className="admin-input" name="q" placeholder={dict.filters.searchByTitle} defaultValue={q} />
          <select className="admin-select" name="status" defaultValue={status}>
            <option value="">{dict.filters.allStatuses}</option>
            {publicationOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select className="admin-select" name="sort" defaultValue={sort}>
            <option value="updatedAt-desc">{dict.filters.sortUpdatedDesc}</option>
            <option value="updatedAt-asc">{dict.filters.sortUpdatedAsc}</option>
            <option value="title-asc">{dict.filters.sortTitleAsc}</option>
            <option value="title-desc">{dict.filters.sortTitleDesc}</option>
            <option value="priceRub-desc">{dict.filters.sortPriceDesc}</option>
            <option value="priceRub-asc">{dict.filters.sortPriceAsc}</option>
          </select>
          <SubmitButton className="btn btn-ghost" pendingLabel={dict.common.filtering}>
            {dict.common.apply}
          </SubmitButton>
        </form>
      </div>

      {items.length === 0 ? (
        <AdminEmptyState
          title={t.empty.title}
          text={t.empty.text}
          href={isReadOnly ? "/admin/services" : "/admin/services/new"}
          cta={isReadOnly ? dict.filters.resetFilters : t.empty.cta}
        />
      ) : (
        <form action={bulkServicesAction} className="admin-table admin-table--with-bulk">
          <input type="hidden" name="adminLocale" value={locale} />
          <table>
            <thead>
              <tr>
                <th>{isReadOnly ? dict.common.view : ""}</th>
                <th>{dict.common.image}</th>
                <th>{dict.common.name}</th>
                <th>{dict.common.category}</th>
                <th>{dict.common.price}</th>
                <th>{dict.common.status}</th>
                <th>{dict.common.updated}</th>
                <th>{dict.common.actions}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    {!isReadOnly ? <input className="admin-checkbox" type="checkbox" name="ids" value={item.id} /> : null}
                  </td>
                  <td>
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="admin-thumb" src={item.image} alt="" loading="lazy" decoding="async" />
                    ) : (
                      <span>{dict.common.emDash}</span>
                    )}
                  </td>
                  <td className="admin-cell-name">
                    <strong>{item.title}</strong>
                    <div className="muted">{item.slug}</div>
                  </td>
                  <td>{getCategoryDisplayLabel(item.normalizedCategory ?? item.category, dict)}</td>
                  <td className="admin-cell-price">{item.priceRub ? formatPrice(item.priceRub, dict.common.fromPrice) : dict.common.emDash}</td>
                  <td>
                    <span className={`admin-badge admin-badge--${item.publicationStatus.toLowerCase()}`}>
                      {dict.enums.publication[item.publicationStatus]}
                    </span>
                  </td>
                  <td>{formatAdminDate(item.updatedAt, locale)}</td>
                  <td className="admin-cell-actions">
                    <div className="admin-actions-row">
                      <Link className="btn btn-ghost btn-small" href={`/admin/services/${item.id}`}>
                        {isReadOnly ? dict.common.open : dict.common.edit}
                      </Link>
                      <Link className="btn btn-ghost btn-small" href={`/ru/services/${item.slug}`} target="_blank">
                        {dict.common.preview}
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isReadOnly ? (
            <div className="admin-bulk-bar">
              <select className="admin-select" name="bulkAction" defaultValue="publish">
                <option value="publish">{dict.filters.bulkPublish}</option>
                <option value="hide">{dict.filters.bulkHide}</option>
                <option value="draft">{dict.filters.bulkDraft}</option>
              </select>
              <div />
              <SubmitButton className="btn btn-primary btn-small" pendingLabel={dict.common.applying}>
                {dict.filters.applyToSelected}
              </SubmitButton>
            </div>
          ) : null}
        </form>
      )}
      <AdminPagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        basePath="/admin/services"
        query={query}
      />
    </div>
  );
}
