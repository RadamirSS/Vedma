export const locales = ["en", "ru"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeCookieName = "bajena_locale";

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

const RUSSIAN_LOCALE_PREFIX = "ru";

export function isRussianAcceptLanguage(acceptLanguage: string | null | undefined): boolean {
  if (!acceptLanguage) {
    return false;
  }

  return acceptLanguage
    .split(",")
    .some((part) => {
      const tag = part.trim().split(";")[0]?.toLowerCase();
      return tag === RUSSIAN_LOCALE_PREFIX || tag.startsWith(`${RUSSIAN_LOCALE_PREFIX}-`);
    });
}

export function detectLocaleFromRequest(
  cookieLocale: string | undefined,
  acceptLanguage: string | null | undefined
): Locale {
  if (cookieLocale && isLocale(cookieLocale)) {
    return cookieLocale;
  }

  return isRussianAcceptLanguage(acceptLanguage) ? "ru" : defaultLocale;
}
