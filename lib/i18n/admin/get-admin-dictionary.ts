import type { Locale } from "@/lib/i18n/admin/config";
import { en } from "@/lib/i18n/admin/dictionaries/en";
import { ru, type AdminDictionary } from "@/lib/i18n/admin/dictionaries/ru";

const dictionaries: Record<Locale, AdminDictionary> = {
  en,
  ru
};

export function getAdminDictionarySync(locale: Locale): AdminDictionary {
  return dictionaries[locale];
}

export async function getAdminDictionary(locale: Locale): Promise<AdminDictionary> {
  return getAdminDictionarySync(locale);
}

export type { AdminDictionary };
