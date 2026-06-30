import { headers } from "next/headers";

import { CartProvider } from "@/components/cart-context";
import { LocaleHtmlLang } from "@/components/locale-html-lang";
import { defaultLocale, isLocale } from "@/lib/i18n/config";

import "./globals.css";

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const headerStore = await headers();
  const headerLocale = headerStore.get("x-bajena-locale");
  const lang = headerLocale && isLocale(headerLocale) ? headerLocale : defaultLocale;

  return (
    <html lang={lang} suppressHydrationWarning>
      <body>
        <CartProvider>
          <LocaleHtmlLang />
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
