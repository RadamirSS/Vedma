"use client";

import { useCart } from "@/components/cart-context";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/ru";

export function FloatingCartButton({
  locale,
  dict
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const { count, openCart } = useCart();

  return (
    <div className="floating-cart">
      <button
        type="button"
        className="floating-cart__btn"
        onClick={openCart}
        aria-label={dict.header.cart}
      >
        <span className="floating-cart__icon" aria-hidden="true">
          {locale === "en" ? "Cart" : "Корз."}
        </span>
        {count > 0 ? <span className="floating-cart__count">{count}</span> : null}
      </button>
    </div>
  );
}
