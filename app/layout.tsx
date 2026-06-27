import type { Metadata } from "next";

import { CartProvider } from "@/components/cart-context";
import { SiteShell } from "@/components/site-shell";
import { getSiteSettings } from "@/lib/admin/settings";

import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return {
    metadataBase: new URL("https://bazhena.ru"),
    title: {
      default: settings.seo.defaultTitle,
      template: settings.seo.titleTemplate
    },
    description: settings.seo.defaultDescription,
    keywords: settings.seo.keywords
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const settings = await getSiteSettings();

  return (
    <html lang="ru">
      <body>
        <CartProvider>
          <SiteShell settings={settings}>{children}</SiteShell>
        </CartProvider>
      </body>
    </html>
  );
}
