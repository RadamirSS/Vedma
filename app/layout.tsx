import { CartProvider } from "@/components/cart-context";
import { LocaleHtmlLang } from "@/components/locale-html-lang";

import "./globals.css";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <CartProvider>
          <LocaleHtmlLang />
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
