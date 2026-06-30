export function formatAdminDate(
  value: Date | string | null | undefined,
  locale: string = "ru"
) {
  if (!value) {
    return "—";
  }

  const date = value instanceof Date ? value : new Date(value);
  const localeTag = locale === "en" ? "en-US" : "ru-RU";
  return new Intl.DateTimeFormat(localeTag, {
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
