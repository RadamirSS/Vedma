const ACCOUNT_ALLOWED_PREFIXES = ["/account", "/checkout", "/cart"] as const;

function stripLocaleFromPath(path: string): string {
  const parts = path.split("/").filter(Boolean);
  if (parts[0] === "en" || parts[0] === "ru") {
    const rest = parts.slice(1).join("/");
    return rest ? `/${rest}` : "/";
  }

  return path;
}

function matchesAllowedPrefix(path: string, prefix: string) {
  const bare = stripLocaleFromPath(path);
  return bare === prefix || bare.startsWith(`${prefix}/`);
}

function normalizeInternalPath(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return null;
  }

  try {
    const parsed = new URL(trimmed, "http://localhost");
    if (parsed.origin !== "http://localhost") {
      return null;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

export function getSafeAdminRedirectPath(value: string | null | undefined) {
  const normalized = normalizeInternalPath(value);
  return normalized && matchesAllowedPrefix(normalized, "/admin")
    ? normalized
    : "/admin/dashboard";
}

export function getSafeCustomerRedirectPath(value: string | null | undefined) {
  const normalized = normalizeInternalPath(value);
  return normalized &&
    ACCOUNT_ALLOWED_PREFIXES.some((prefix) => matchesAllowedPrefix(normalized, prefix))
    ? normalized
    : "/account/orders";
}
