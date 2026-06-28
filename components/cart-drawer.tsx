"use client";

import Link from "next/link";

import { useCart } from "@/components/cart-context";
import { formatCatalogLabel, formatPrice } from "@/lib/utils";

export function CartDrawer() {
  const {
    resolvedItems,
    total,
    isOpen,
    closeCart,
    changeQty,
    clearCart,
    isPending
  } = useCart();

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
          {resolvedItems.length === 0 ? (
            <p className="muted">Корзина пустая. Добавьте услугу или товар из каталога.</p>
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
