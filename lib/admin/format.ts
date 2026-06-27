export function formatAdminDate(value: Date | string | null | undefined) {
  if (!value) {
    return "—";
  }

  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

export function buildPagination(page: number, totalItems: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  return {
    page: Math.min(Math.max(1, page), totalPages),
    totalPages,
    pageSize,
    totalItems,
    skip: (Math.min(Math.max(1, page), totalPages) - 1) * pageSize
  };
}

export function parseSearchParam(value: string | string[] | undefined, fallback = "") {
  if (Array.isArray(value)) {
    return value[0] ?? fallback;
  }
  return value ?? fallback;
}
