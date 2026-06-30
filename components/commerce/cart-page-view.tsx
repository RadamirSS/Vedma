"use client";

import Link from "next/link";

import { useCart } from "@/components/cart-context";
import { formatPrice } from "@/lib/utils";

const STALE_CART_MESSAGE =
  "Товары из корзины больше недоступны. Обновите корзину или выберите товары заново.";

export function CartPageView() {
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

  if (cartIsEmpty) {
    return (
      <div className="dashboard-grid">
        <article className="form-card">
          <h3>Корзина пока пустая</h3>
          <p className="muted">Добавьте товары или услуги из каталога, и они появятся здесь.</p>
        </article>
        <aside className="cart-summary">
          <h3>Что дальше</h3>
          <p className="muted">
            После оформления заказ появится в личном кабинете. Оплата пока подтверждается вручную.
          </p>
          <div className="stack-top">
            <Link className="btn btn-primary btn-wide" href="/products">
              Перейти к товарам
            </Link>
            <Link className="btn btn-ghost btn-wide" href="/services">
              Перейти к услугам
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
          <h3>Корзина недоступна</h3>
          <p className="checkout-error">{resolveError ?? STALE_CART_MESSAGE}</p>
          <div className="stack-top hero-actions">
            <Link className="btn btn-primary" href="/products">
              Выбрать товары
            </Link>
            <Link className="btn btn-ghost" href="/services">
              Выбрать услуги
            </Link>
            <button className="btn btn-ghost" type="button" onClick={clearCart}>
              Очистить корзину
            </button>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="checkout-grid">
      <div className="form-card">
        <h3>Позиции в корзине</h3>
        <div className="cart-list-page">
          {resolvedItems.map((item) => (
            <div key={`${item.type}:${item.slug}`} className="cart-item cart-item--page">
              <div className="cart-page-item-info">
                <b>{item.title}</b>
                <span className="muted">
                  {item.type === "product" ? "Товар" : "Услуга"} · {formatPrice(item.unitAmount)}
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
        <h3>Итог</h3>
        <div className="summary-line summary-total">
          <span>Сумма заказа</span>
          <b>{isPending ? "..." : formatPrice(total)}</b>
        </div>
        <div className="stack-top">
          <Link className="btn btn-primary btn-wide" href="/checkout">
            Оформить заказ
          </Link>
        </div>
        <div className="stack-top">
          <button className="btn btn-ghost btn-wide" type="button" onClick={clearCart}>
            Очистить корзину
          </button>
        </div>
      </aside>
    </div>
  );
}
