"use client";

import { useCart } from "@/components/cart-context";
import type { Dictionary } from "@/lib/i18n/dictionaries/ru";

function CartIcon() {
  return (
    <svg
      className="floating-cart__svg"
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 6h15l-1.5 9h-12z" />
      <path d="M6 6 5 3H2" />
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
    </svg>
  );
}

export function FloatingCartButton({ dict }: { dict: Dictionary }) {
  const { count, openCart } = useCart();

  return (
    <div className="floating-cart">
      <button
        type="button"
        className="floating-cart__btn"
        onClick={openCart}
        aria-label={dict.header.cart}
      >
        <CartIcon />
        {count > 0 ? <span className="floating-cart__count">{count}</span> : null}
      </button>
    </div>
  );
}
