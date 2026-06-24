"use client";

import Link from "next/link";

import { useCart } from "@/components/cart-context";
import { getAllItems } from "@/lib/mock-data";
import { formatCatalogLabel, formatPrice } from "@/lib/utils";

const allItems = getAllItems();

export function CartDrawer() {
  const { items, total, isOpen, closeCart, changeQty, clearCart } = useCart();

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
          {items.length === 0 ? (
            <p className="muted">Корзина пустая. Добавьте услугу или товар из каталога.</p>
          ) : (
            items.map((entry) => {
              const item = allItems.find((value) => value.id === entry.id);
              if (!item) return null;

              return (
                <div key={entry.id} className="cart-item">
                  <div className="cart-thumb">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt="" />
                    ) : (
                      item.icon
                    )}
                  </div>
                  <div>
                    <b>{item.title}</b>
                    <span>
                      {formatCatalogLabel(item.category)} · {formatPrice(item.price)}
                    </span>
                    <div className="qty">
                      <button type="button" onClick={() => changeQty(entry.id, -1)}>
                        −
                      </button>
                      <span>{entry.qty}</span>
                      <button type="button" onClick={() => changeQty(entry.id, 1)}>
                        +
                      </button>
                    </div>
                  </div>
                  <button className="remove" type="button" onClick={() => changeQty(entry.id, -entry.qty)}>
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
            <b>{formatPrice(total)}</b>
          </div>
          <Link className="btn btn-primary" href="/checkout" onClick={closeCart}>
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
