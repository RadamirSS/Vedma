import { cookies, headers } from "next/headers";

import { adminLocaleCookieName } from "@/lib/i18n/admin/config";
import { detectLocaleFromRequest, isLocale, localeCookieName, type Locale } from "@/lib/i18n/config";

export async function getAdminLocaleFromCookies(): Promise<Locale> {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const adminLocale = cookieStore.get(adminLocaleCookieName)?.value;
  const siteLocale = cookieStore.get(localeCookieName)?.value;
  const acceptLanguage = headerStore.get("accept-language");

  if (adminLocale && isLocale(adminLocale)) {
    return adminLocale;
  }

  if (siteLocale && isLocale(siteLocale)) {
    return siteLocale;
  }

  return detectLocaleFromRequest(undefined, acceptLanguage);
}

export async function getAdminLocaleFromForm(formData: FormData): Promise<Locale> {
  const formLocale = formData.get("adminLocale");

  if (typeof formLocale === "string" && isLocale(formLocale)) {
    return formLocale;
  }

  return getAdminLocaleFromCookies();
}
