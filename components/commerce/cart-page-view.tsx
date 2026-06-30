"use client";

import Link from "next/link";

import { useCart } from "@/components/cart-context";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/ru";
import { localizeHref } from "@/lib/i18n/routing";
import { formatPrice } from "@/lib/utils";

export function CartPageView({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const {
    resolvedItems,
    total,
    isPending,
    changeQty,
    clearCart,
    resolveError,
    cartUnavailable,
    items
  } = useCart();

  const cartIsEmpty = items.length === 0 && resolvedItems.length === 0 && !isPending;
  const staleMessage = dict.checkout.staleCart;

  if (cartIsEmpty) {
    return (
      <div className="dashboard-grid">
        <article className="form-card">
          <h3>{dict.cart.emptyTitle}</h3>
          <p className="muted">{dict.cart.emptyHintExtended}</p>
        </article>
        <aside className="cart-summary">
          <h3>{dict.cart.whatsNext}</h3>
          <p className="muted">{dict.cart.whatsNextHint}</p>
          <div className="stack-top">
            <Link className="btn btn-primary btn-wide" href={localizeHref(locale, "/products")}>
              {dict.cart.goToProducts}
            </Link>
            <Link className="btn btn-ghost btn-wide" href={localizeHref(locale, "/services")}>
              {dict.cart.goToServices}
            </Link>
          </div>
        </aside>
      </div>
    );
  }

  if (cartUnavailable || resolveError) {
    return (
      <div className="dashboard-grid">
        <article className="form-card">
          <h3>{dict.cart.unavailableTitle}</h3>
          <p className="checkout-error">{resolveError ?? staleMessage}</p>
          <div className="stack-top hero-actions">
            <Link className="btn btn-primary" href={localizeHref(locale, "/products")}>
              {dict.cart.chooseProducts}
            </Link>
            <Link className="btn btn-ghost" href={localizeHref(locale, "/services")}>
              {dict.cart.chooseServices}
            </Link>
            <button className="btn btn-ghost" type="button" onClick={clearCart}>
              {dict.cart.clearCart}
            </button>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="checkout-grid">
      <div className="form-card">
        <h3>{dict.cart.lineItems}</h3>
        <div className="cart-list-page">
          {resolvedItems.map((item) => (
            <div key={`${item.type}:${item.slug}`} className="cart-item cart-item--page">
              <div className="cart-page-item-info">
                <b>{item.title}</b>
                <span className="muted">
                  {item.type === "product" ? dict.cart.productType : dict.cart.serviceType} ·{" "}
                  {formatPrice(item.unitAmount)}
                </span>
              </div>
              <div className="qty">
                <button
                  type="button"
                  onClick={() => changeQty(item.type, item.slug, -1)}
                  disabled={item.type === "service"}
                >
                  −
                </button>
                <span>{item.quantity}</span>
                <button
                  type="button"
                  onClick={() => changeQty(item.type, item.slug, 1)}
                  disabled={
                    item.type === "service" ||
                    (item.maxQuantity !== null && item.quantity >= item.maxQuantity)
                  }
                >
                  +
                </button>
              </div>
              <div className="cart-line-total">{formatPrice(item.unitAmount * item.quantity)}</div>
            </div>
          ))}
        </div>
      </div>
      <aside className="cart-summary">
        <h3>{dict.cart.total}</h3>
        <div className="summary-line summary-total">
          <span>{dict.cart.orderTotal}</span>
          <b>{isPending ? "..." : formatPrice(total)}</b>
        </div>
        <div className="stack-top">
          <Link className="btn btn-primary btn-wide" href={localizeHref(locale, "/checkout")}>
            {dict.cart.checkout}
          </Link>
        </div>
        <div className="stack-top">
          <button className="btn btn-ghost btn-wide" type="button" onClick={clearCart}>
            {dict.cart.clearCart}
          </button>
        </div>
      </aside>
    </div>
  );
}
