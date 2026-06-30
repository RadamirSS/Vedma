"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { defaultLocale } from "@/lib/i18n/config";
import { getLocaleFromPathname } from "@/lib/i18n/routing";

export function LocaleHtmlLang() {
  const pathname = usePathname();
  const locale = pathname.startsWith("/admin") ? defaultLocale : getLocaleFromPathname(pathname);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
