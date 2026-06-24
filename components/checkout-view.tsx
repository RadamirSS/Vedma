"use client";

import { useMemo } from "react";

import { useCart } from "@/components/cart-context";
import { LegalNotice } from "@/components/legal-notice";
import { getAllItems } from "@/lib/mock-data";
import { formatPrice } from "@/lib/utils";

const allItems = getAllItems();

export function CheckoutView() {
  const { items, total } = useCart();

  const cartItems = useMemo(
    () =>
      items.flatMap((entry) => {
        const item = allItems.find((value) => value.id === entry.id);
        return item ? [{ ...item, qty: entry.qty }] : [];
      }),
    [items]
  );

  return (
    <div className="checkout-grid">
      <form className="form-card">
        <h3>Данные клиента</h3>
        <div className="form-grid">
          <div className="field">
            <label>Имя</label>
            <input placeholder="Ваше имя" />
          </div>
          <div className="field">
            <label>Телефон</label>
            <input placeholder="+7 / +995 ..." />
          </div>
          <div className="field">
            <label>Email</label>
            <input placeholder="mail@example.com" />
          </div>
          <div className="field">
            <label>Telegram</label>
            <input placeholder="@username" />
          </div>
          <div className="field">
            <label>Способ связи</label>
            <select defaultValue="Telegram">
              <option>Telegram</option>
              <option>WhatsApp</option>
              <option>VK</option>
              <option>Email</option>
            </select>
          </div>
          <div className="field">
            <label>Город / страна</label>
            <input placeholder="Москва / Тбилиси / другое" />
          </div>
          <div className="field full">
            <label>Комментарий к заказу</label>
            <textarea placeholder="Опишите ситуацию, пожелание к товару или важные детали заявки." />
          </div>
          <label className="field full check">
            <input type="checkbox" defaultChecked />
            <span>Подтверждаю, что мне исполнилось 18 лет.</span>
          </label>
          <label className="field full check">
            <input type="checkbox" defaultChecked />
            <span>Согласен с политикой конфиденциальности, офертой и дисклеймером.</span>
          </label>
        </div>
        <button className="btn btn-primary btn-wide stack-top" type="button">
          Отправить заказ
        </button>
      </form>

      <aside className="cart-summary">
        <h3>Состав заказа</h3>
        {cartItems.length > 0 ? (
          <>
            {cartItems.map((item) => (
              <div key={item.id} className="summary-line">
                <span>
                  {item.title} × {item.qty}
                </span>
                <b>{formatPrice(item.price * item.qty)}</b>
              </div>
            ))}
            <div className="summary-line summary-total">
              <span>Итого</span>
              <b>{formatPrice(total)}</b>
            </div>
          </>
        ) : (
          <p className="muted">Корзина пока пустая. Добавьте услугу или товар из каталога.</p>
        )}
        <div className="stack-top">
          <LegalNotice />
        </div>
      </aside>
    </div>
  );
}
