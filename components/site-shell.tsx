import { ReactNode } from "react";

import { CartDrawer } from "@/components/cart-drawer";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
      <CartDrawer />
      <div className="floating-social">
        <a href="https://t.me/Bazhena13witch" target="_blank" rel="noreferrer" title="Telegram">
          TG
        </a>
      </div>
    </>
  );
}
