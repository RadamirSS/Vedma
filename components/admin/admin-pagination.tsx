"use client";

import { useAdminI18n } from "@/components/admin/admin-i18n-provider";

export function AdminPagination({
  page,
  totalPages,
  basePath,
  query
}: {
  page: number;
  totalPages: number;
  basePath: string;
  query: URLSearchParams;
}) {
  const { dict } = useAdminI18n();

  if (totalPages <= 1) {
    return null;
  }

  const makeHref = (nextPage: number) => {
    const params = new URLSearchParams(query);
    params.set("page", String(nextPage));
    return `${basePath}?${params.toString()}`;
  };

  const pageLabel = dict.pagination.pageOf
    .replace("{page}", String(page))
    .replace("{totalPages}", String(totalPages));

  return (
    <div className="admin-pagination">
      <a
        className={`btn btn-ghost btn-small ${page <= 1 ? "is-disabled" : ""}`}
        href={page <= 1 ? "#" : makeHref(page - 1)}
      >
        {dict.pagination.back}
      </a>
      <span>{pageLabel}</span>
      <a
        className={`btn btn-ghost btn-small ${page >= totalPages ? "is-disabled" : ""}`}
        href={page >= totalPages ? "#" : makeHref(page + 1)}
      >
        {dict.pagination.forward}
      </a>
    </div>
  );
}
