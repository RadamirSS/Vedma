"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { adminLocaleCookieName } from "@/lib/i18n/admin/config";
import { defaultLocale, isLocale } from "@/lib/i18n/config";
import { getLocaleFromPathname } from "@/lib/i18n/routing";

function readAdminLocaleFromCookie() {
  if (typeof document === "undefined") {
    return defaultLocale;
  }

  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${adminLocaleCookieName}=`));

  if (!match) {
    return null;
  }

  const value = match.split("=")[1];
  return value && isLocale(value) ? value : null;
}

export function LocaleHtmlLang() {
  const pathname = usePathname();
  const locale = pathname.startsWith("/admin")
    ? (readAdminLocaleFromCookie() ?? defaultLocale)
    : getLocaleFromPathname(pathname);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
