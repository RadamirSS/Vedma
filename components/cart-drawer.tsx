"use client";

import Link from "next/link";

import { useCart } from "@/components/cart-context";
import { formatCatalogLabel, formatPrice } from "@/lib/utils";

const STALE_CART_MESSAGE =
  "Товары из корзины больше недоступны. Обновите корзину или выберите товары заново.";

export function CartDrawer() {
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

  const cartIsEmpty = items.length === 0 && resolvedItems.length === 0 && !isPending;

  return (
    <>
      <div
        className={`overlay ${isOpen ? "open" : ""}`}
        onClick={closeCart}
        aria-hidden={!isOpen}
      />
      <aside className={`drawer ${isOpen ? "open" : ""}`} aria-label="Корзина">
        <div className="drawer-head">
          <h3>Корзина</h3>
          <button className="close" type="button" onClick={closeCart}>
            ×
          </button>
        </div>
        <div className="drawer-body">
          {resolveError ? <p className="checkout-error">{resolveError}</p> : null}
          {cartUnavailable ? <p className="checkout-error">{STALE_CART_MESSAGE}</p> : null}
          {resolvedItems.length === 0 ? (
            cartIsEmpty ? (
              <p className="muted">Корзина пустая. Добавьте услугу или товар из каталога.</p>
            ) : isPending ? (
              <p className="muted">Загружаем корзину...</p>
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
                      <span>{item.type === "product" ? "Т" : "У"}</span>
                    )}
                  </div>
                  <div>
                    <b>{item.title}</b>
                    <span>
                      {formatCatalogLabel(item.type === "product" ? "Товар" : "Услуга")} · {formatPrice(item.unitAmount)}
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
                        disabled={item.type === "service" || (item.maxQuantity !== null && item.quantity >= item.maxQuantity)}
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
            <span>Итого</span>
            <b>{isPending ? "..." : formatPrice(total)}</b>
          </div>
          <Link className="btn btn-primary" href="/cart" onClick={closeCart}>
            Перейти в корзину
          </Link>
          <Link className="btn btn-ghost" href="/checkout" onClick={closeCart}>
            Оформить заказ
          </Link>
          <button className="btn btn-ghost" type="button" onClick={clearCart}>
            Очистить корзину
          </button>
        </div>
      </aside>
    </>
  );
}
