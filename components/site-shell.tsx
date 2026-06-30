"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { CartDrawer } from "@/components/cart-drawer";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import type { SiteSettingsShape } from "@/lib/admin/settings";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/ru";

export function SiteShell({
  children,
  settings,
  locale,
  dict
}: {
  children: ReactNode;
  settings: SiteSettingsShape;
  locale: Locale;
  dict: Dictionary;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <Header
        logoImage={settings.mediaSlots.logoImage}
        logoAlt={settings.mediaSlots.logoAlt}
        locale={locale}
        dict={dict}
      />
      <main>{children}</main>
      <Footer settings={settings} locale={locale} dict={dict} />
      <CartDrawer locale={locale} dict={dict} />
      <div className="floating-social">
        <a href={settings.socialLinks.telegram} target="_blank" rel="noreferrer" title="Telegram">
          TG
        </a>
      </div>
    </>
  );
}
