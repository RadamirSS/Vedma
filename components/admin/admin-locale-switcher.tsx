"use client";

import { useRouter } from "next/navigation";

import { adminLocaleCookieMaxAge, adminLocaleCookieName } from "@/lib/i18n/admin/config";
import { getAdminDictionarySync } from "@/lib/i18n/admin/get-admin-dictionary";
import type { Locale } from "@/lib/i18n/config";

export function AdminLocaleSwitcher({ locale }: { locale: Locale }) {
  const router = useRouter();
  const dict = getAdminDictionarySync(locale);

  function setLocale(nextLocale: Locale) {
    if (nextLocale === locale) {
      return;
    }

    document.cookie = `${adminLocaleCookieName}=${nextLocale}; Path=/admin; Max-Age=${adminLocaleCookieMaxAge}; SameSite=Lax`;
    router.refresh();
  }

  return (
    <div className="locale-switcher admin-locale-switcher" role="group" aria-label={dict.common.localeSwitcherLabel}>
      <button
        type="button"
        className={`locale-switcher__btn${locale === "en" ? " is-active" : ""}`}
        aria-pressed={locale === "en"}
        onClick={() => setLocale("en")}
      >
        EN
      </button>
      <button
        type="button"
        className={`locale-switcher__btn${locale === "ru" ? " is-active" : ""}`}
        aria-pressed={locale === "ru"}
        onClick={() => setLocale("ru")}
      >
        RU
      </button>
    </div>
  );
}
