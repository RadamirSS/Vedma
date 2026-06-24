import type { Metadata } from "next";

import { CartProvider } from "@/components/cart-context";
import { SiteShell } from "@/components/site-shell";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://bazhena.ru"),
  title: {
    default: "Бажена — Магия Жизни",
    template: "%s | Бажена — Магия Жизни"
  },
  description:
    "Таро, диагностика, трансформационные практики и магические товары. Личный бренд Бажены — проводника в мире тонких практик."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        <CartProvider>
          <SiteShell>{children}</SiteShell>
        </CartProvider>
      </body>
    </html>
  );
}
