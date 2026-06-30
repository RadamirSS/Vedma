import type { Locale } from "@/lib/i18n/config";
import { en } from "@/lib/i18n/dictionaries/en";
import { ru, type Dictionary } from "@/lib/i18n/dictionaries/ru";

const dictionaries: Record<Locale, Dictionary> = {
  en,
  ru
};

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale];
}

export type { Dictionary };
