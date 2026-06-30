"use client";

import Link from "next/link";

import { useCart } from "@/components/cart-context";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/ru";
import { localizeHref } from "@/lib/i18n/routing";
import { formatCatalogLabel, formatPrice } from "@/lib/utils";

export function CartDrawer({
  locale,
  dict
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const {
    resolvedItems,
    total,
    isOpen,
    closeCart,
    changeQty,
    clearCart,
    isPending,
    resolveError,
    cartUnavailable,
    items
  } = useCart();

  const t = dict.cart;
  const staleCartMessage = dict.checkout.staleCart;
  const cartIsEmpty = items.length === 0 && resolvedItems.length === 0 && !isPending;

  return (
    <>
      <div
        className={`overlay ${isOpen ? "open" : ""}`}
        onClick={closeCart}
        aria-hidden={!isOpen}
      />
      <aside className={`drawer ${isOpen ? "open" : ""}`} aria-label={t.drawerTitle}>
        <div className="drawer-head">
          <h3>{t.drawerTitle}</h3>
          <button className="close" type="button" onClick={closeCart}>
            ×
          </button>
        </div>
        <div className="drawer-body">
          {resolveError ? <p className="checkout-error">{resolveError}</p> : null}
          {cartUnavailable ? <p className="checkout-error">{staleCartMessage}</p> : null}
          {resolvedItems.length === 0 ? (
            cartIsEmpty ? (
              <p className="muted">
                {t.empty} {t.emptyHint}
              </p>
            ) : isPending ? (
              <p className="muted">{t.loading}</p>
            ) : null
          ) : (
            resolvedItems.map((item) => {
              return (
                <div key={`${item.type}:${item.slug}`} className="cart-item">
                  <div className="cart-thumb">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt="" />
                    ) : (
                      <span>{item.type === "product" ? "T" : "S"}</span>
                    )}
                  </div>
                  <div>
                    <b>{item.title}</b>
                    <span>
                      {formatCatalogLabel(item.type === "product" ? dict.catalog.products : dict.catalog.services)} ·{" "}
                      {formatPrice(item.unitAmount)}
                    </span>
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
                  </div>
                  <button
                    className="remove"
                    type="button"
                    onClick={() => changeQty(item.type, item.slug, -item.quantity)}
                  >
                    ×
                  </button>
                </div>
              );
            })
          )}
        </div>
        <div className="drawer-foot">
          <div className="total">
            <span>{t.total}</span>
            <b>{isPending ? "..." : formatPrice(total)}</b>
          </div>
          <Link className="btn btn-primary" href={localizeHref(locale, "/cart")} onClick={closeCart}>
            {t.viewCart}
          </Link>
          <Link className="btn btn-ghost" href={localizeHref(locale, "/checkout")} onClick={closeCart}>
            {t.checkout}
          </Link>
          <button className="btn btn-ghost" type="button" onClick={clearCart}>
            {t.remove}
          </button>
        </div>
      </aside>
    </>
  );
}
