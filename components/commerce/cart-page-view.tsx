"use client";

import Link from "next/link";

import { useCart } from "@/components/cart-context";
import { formatPrice } from "@/lib/utils";

export function CartPageView() {
  const { resolvedItems, total, isPending, changeQty, clearCart } = useCart();

  if (resolvedItems.length === 0) {
    return (
      <div className="dashboard-grid">
        <article className="form-card">
          <h3>Корзина пока пустая</h3>
          <p className="muted">Добавьте товары или услуги из каталога, и они появятся здесь.</p>
        </article>
        <aside className="cart-summary">
          <h3>Что дальше</h3>
          <p className="muted">После оформления заказ уйдет администратору, а в кабинете появится история заявок и платежей.</p>
          <div className="stack-top">
            <Link className="btn btn-primary btn-wide" href="/products">
              Перейти к товарам
            </Link>
          </div>
        </aside>
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
              <div>
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
