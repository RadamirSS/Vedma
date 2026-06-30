import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { SiteShell } from "@/components/site-shell";
import { getSiteSettings } from "@/lib/admin/settings";
import { locales, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bajena.it";

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: dict.meta.defaultTitle,
      template: dict.meta.titleTemplate
    },
    description: dict.meta.defaultDescription,
    alternates: {
      canonical: `${siteUrl}/${locale}`,
      languages: {
        en: `${siteUrl}/en`,
        ru: `${siteUrl}/ru`,
        "x-default": `${siteUrl}/en`
      }
    }
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale: localeParam } = await params;

  if (!locales.includes(localeParam as Locale)) {
    notFound();
  }

  const locale = localeParam as Locale;
  const [settings, dict] = await Promise.all([getSiteSettings(), getDictionary(locale)]);

  return (
    <SiteShell settings={settings} locale={locale} dict={dict}>
      {children}
    </SiteShell>
  );
}
