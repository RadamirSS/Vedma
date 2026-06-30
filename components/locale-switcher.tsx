"use client";

import { usePathname, useRouter } from "next/navigation";

import { localeCookieName, type Locale } from "@/lib/i18n/config";
import { getLocaleFromPathname, swapLocaleInPathname } from "@/lib/i18n/routing";
import type { Dictionary } from "@/lib/i18n/dictionaries/ru";

export function LocaleSwitcher({ dict }: { dict: Dictionary }) {
  const pathname = usePathname();
  const router = useRouter();
  const currentLocale = getLocaleFromPathname(pathname);

  function switchLocale(nextLocale: Locale) {
    if (nextLocale === currentLocale) {
      return;
    }

    document.cookie = `${localeCookieName}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    router.push(swapLocaleInPathname(pathname, nextLocale));
  }

  return (
    <div className="locale-switcher" role="group" aria-label={dict.localeSwitcher.label}>
      {(["en", "ru"] as const).map((locale) => (
        <button
          key={locale}
          type="button"
          className={`locale-switcher__btn${currentLocale === locale ? " is-active" : ""}`}
          aria-pressed={currentLocale === locale}
          onClick={() => switchLocale(locale)}
        >
          {dict.localeSwitcher[locale]}
        </button>
      ))}
    </div>
  );
}
