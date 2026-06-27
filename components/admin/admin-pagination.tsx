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
  if (totalPages <= 1) {
    return null;
  }

  const makeHref = (nextPage: number) => {
    const params = new URLSearchParams(query);
    params.set("page", String(nextPage));
    return `${basePath}?${params.toString()}`;
  };

  return (
    <div className="admin-pagination">
      <a
        className={`btn btn-ghost btn-small ${page <= 1 ? "is-disabled" : ""}`}
        href={page <= 1 ? "#" : makeHref(page - 1)}
      >
        Назад
      </a>
      <span>
        Страница {page} из {totalPages}
      </span>
      <a
        className={`btn btn-ghost btn-small ${page >= totalPages ? "is-disabled" : ""}`}
        href={page >= totalPages ? "#" : makeHref(page + 1)}
      >
        Вперед
      </a>
    </div>
  );
}
