"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { CartDrawer } from "@/components/cart-drawer";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import type { SiteSettingsShape } from "@/lib/admin/settings";

export function SiteShell({
  children,
  settings
}: {
  children: ReactNode;
  settings: SiteSettingsShape;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer settings={settings} />
      <CartDrawer />
      <div className="floating-social">
        <a href={settings.socialLinks.telegram} target="_blank" rel="noreferrer" title="Telegram">
          TG
        </a>
      </div>
    </>
  );
}
