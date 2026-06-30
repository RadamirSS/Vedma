import { serviceDirections } from "@/lib/service-directions";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/ru";
import { localizeHref } from "@/lib/i18n/routing";
import { buildTelegramLeadUrl } from "@/lib/i18n/telegram-lead";

type DirectionKey = keyof Dictionary["directions"];

export function getLocalizedDirections(dict: Dictionary, locale: Locale) {
  return serviceDirections.map((direction) => {
    const key = direction.id as DirectionKey;
    const localized = dict.directions[key];

    let href = direction.href;
    if (direction.external) {
      href = buildTelegramLeadUrl(dict.common.telegramLead, localized?.title ?? direction.title);
    } else if (href.startsWith("/")) {
      href = localizeHref(locale, href);
    }

    return {
      ...direction,
      title: localized?.title ?? direction.title,
      description: localized?.description ?? direction.description,
      linkLabel: localized?.linkLabel ?? direction.linkLabel,
      href
    };
  });
}
