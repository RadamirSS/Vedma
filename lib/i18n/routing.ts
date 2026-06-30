import type { Route } from "next";

import type { Locale } from "@/lib/i18n/config";
import { defaultLocale, isLocale, locales } from "@/lib/i18n/config";

export function getLocaleFromPathname(pathname: string): Locale {
  const segment = pathname.split("/").filter(Boolean)[0];
  return segment && isLocale(segment) ? segment : defaultLocale;
}

export function stripLocalePrefix(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0 && isLocale(segments[0])) {
    const rest = segments.slice(1).join("/");
    return rest ? `/${rest}` : "/";
  }

  return pathname || "/";
}

export function localizeHref(locale: Locale, href: string): Route {
  if (
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("#")
  ) {
    return href as Route;
  }

  if (href.startsWith("/admin") || href.startsWith("/api") || href.startsWith("/uploads/admin")) {
    return href as Route;
  }

  const [pathPart, queryPart] = href.split("?");
  const normalized = pathPart === "/" ? "" : pathPart.startsWith("/") ? pathPart : `/${pathPart}`;
  const localized = normalized === "" ? `/${locale}` : `/${locale}${normalized}`;
  const result = queryPart ? `${localized}?${queryPart}` : localized;
  return result as Route;
}

export function swapLocaleInPathname(pathname: string, nextLocale: Locale): Route {
  const bare = stripLocalePrefix(pathname);
  return localizeHref(nextLocale, bare);
}

export function isPublicPathWithoutLocale(pathname: string): boolean {
  if (pathname === "/") {
    return true;
  }

  const first = pathname.split("/").filter(Boolean)[0];
  return Boolean(first && !isLocale(first) && !first.startsWith("admin") && first !== "api");
}

export { locales };
