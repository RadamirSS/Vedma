"use client";

import Link from "next/link";
import type { Route } from "next";
import { useActionState, useEffect, useMemo } from "react";

import { submitCheckoutAction, type CheckoutActionState } from "@/app/checkout/actions";
import { useCart } from "@/components/cart-context";
import { LegalNotice } from "@/components/legal-notice";
import { formatPrice } from "@/lib/utils";

const initialState: CheckoutActionState = {
  success: false,
  message: null,
  redirectTo: null
};

const STALE_CART_MESSAGE =
  "Товары из корзины больше недоступны. Обновите корзину или выберите товары заново.";

export function CheckoutView({
  currentUser
}: {
  currentUser?: {
    email: string;
    name: string | null;
    phone: string | null;
    telegram: string | null;
    city?: string | null;
    country?: string | null;
    addressLine1?: string | null;
    addressLine2?: string | null;
    postalCode?: string | null;
  } | null;
}) {
  const {
    items,
    resolvedItems,
    total,
    totalRub,
    totalUsd,
    deliveryRequired,
    clearCart,
    isPending,
    resolveError,
    cartUnavailable
  } = useCart();
  const [state, formAction, pending] = useActionState(submitCheckoutAction, initialState);

  useEffect(() => {
    if (state.success) {
      clearCart();
    }
  }, [clearCart, state.success]);

  const cartEntriesJson = useMemo(() => JSON.stringify(items), [items]);
  const cartIsEmpty = items.length === 0 && resolvedItems.length === 0 && !isPending;
  const submitDisabled = pending || isPending || resolvedItems.length === 0;

  let submitDisabledReason: string | null = null;
  if (isPending) {
    submitDisabledReason = "Загружаем состав корзины...";
  } else if (resolveError) {
    submitDisabledReason = resolveError;
  } else if (cartUnavailable) {
    submitDisabledReason = STALE_CART_MESSAGE;
  } else if (resolvedItems.length === 0) {
    submitDisabledReason = "Добавьте товары или услуги из каталога, чтобы оформить заказ.";
  }

  return (
    <div className="checkout-grid">
      <form className="form-card" action={formAction}>
        <input type="hidden" name="cartEntries" value={cartEntriesJson} />
        <h3>Данные клиента</h3>
        {resolveError ? <p className="checkout-error">{resolveError}</p> : null}
        {cartUnavailable ? <p className="checkout-error">{STALE_CART_MESSAGE}</p> : null}
        <div className="form-grid">
          <div className="field">
            <label htmlFor="name">Имя</label>
            <input id="name" name="name" placeholder="Ваше имя" defaultValue={currentUser?.name ?? ""} required />
          </div>
          <div className="field">
            <label htmlFor="phone">Телефон</label>
            <input
              id="phone"
              name="phone"
              placeholder="+7 / +995 ..."
              defaultValue={currentUser?.phone ?? ""}
            />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="mail@example.com"
              defaultValue={currentUser?.email ?? ""}
              required
            />
            <small className="muted">
              Email нужен для подтверждения заказа и будущих чеков/уведомлений.
            </small>
          </div>
          <div className="field">
            <label htmlFor="password">Пароль кабинета</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder={currentUser ? "Введите пароль для подтверждения" : "Минимум 8 символов"}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="telegram">Telegram</label>
            <input
              id="telegram"
              name="telegram"
              placeholder="@username"
              defaultValue={currentUser?.telegram ?? ""}
            />
          </div>
          <div className="field">
            <label htmlFor="contactMethod">Способ связи</label>
            <select id="contactMethod" name="contactMethod" defaultValue="TELEGRAM">
              <option value="TELEGRAM">Telegram</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="PHONE">Телефон</option>
              <option value="EMAIL">Email</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="city">Город</label>
            <input id="city" name="city" placeholder="Москва / Тбилиси / другое" defaultValue={currentUser?.city ?? ""} />
          </div>
          <div className="field">
            <label htmlFor="country">Страна</label>
            <input id="country" name="country" placeholder="Россия / Грузия / другое" defaultValue={currentUser?.country ?? ""} />
          </div>
          {deliveryRequired ? (
            <>
              <div className="field full">
                <label htmlFor="addressLine1">Адрес доставки</label>
                <input
                  id="addressLine1"
                  name="addressLine1"
                  placeholder="Улица, дом, квартира"
                  defaultValue={currentUser?.addressLine1 ?? ""}
                  required={deliveryRequired}
                />
              </div>
              <div className="field">
                <label htmlFor="addressLine2">Дополнение к адресу</label>
                <input
                  id="addressLine2"
                  name="addressLine2"
                  placeholder="Подъезд, ориентир"
                  defaultValue={currentUser?.addressLine2 ?? ""}
                />
              </div>
              <div className="field">
                <label htmlFor="postalCode">Индекс</label>
                <input
                  id="postalCode"
                  name="postalCode"
                  placeholder="101000"
                  defaultValue={currentUser?.postalCode ?? ""}
                />
              </div>
            </>
          ) : null}
          <div className="field full">
            <label htmlFor="files">PDF для разбора или анкеты</label>
            <input id="files" name="files" type="file" accept="application/pdf,.pdf" multiple />
            <small className="muted">Только PDF, до 10 МБ на файл. Файлы хранятся приватно и доступны только администратору.</small>
          </div>
          <div className="field full">
            <label htmlFor="comment">Комментарий к заказу</label>
            <textarea
              id="comment"
              name="comment"
              placeholder="Опишите ситуацию, пожелание к товару или важные детали заявки."
            />
          </div>
          <label className="field full check">
            <input type="checkbox" name="ageConfirmed" value="yes" required />
            <span>Подтверждаю, что мне исполнилось 18 лет.</span>
          </label>
          <label className="field full check">
            <input type="checkbox" name="legalAccepted" value="yes" required />
            <span>Согласен с политикой конфиденциальности, офертой и дисклеймером.</span>
          </label>
        </div>
        {state.message ? (
          <p className={state.success ? "checkout-success" : "checkout-error"}>{state.message}</p>
        ) : null}
        {submitDisabled && submitDisabledReason ? (
          <p className="checkout-error stack-top">{submitDisabledReason}</p>
        ) : null}
        <button className="btn btn-primary btn-wide stack-top" type="submit" disabled={submitDisabled}>
          {pending ? "Отправляем заказ..." : "Отправить заказ"}
        </button>
        {state.success && state.redirectTo ? (
          <Link className="btn btn-ghost btn-wide stack-top" href={state.redirectTo as Route}>
            Перейти к заказу
          </Link>
        ) : null}
      </form>

      <aside className="cart-summary">
        <h3>Состав заказа</h3>
        {resolvedItems.length > 0 ? (
          <>
            {resolvedItems.map((item) => (
              <div key={`${item.type}:${item.slug}`} className="summary-line">
                <span>
                  {item.title} × {item.quantity}
                </span>
                <b>{formatPrice(item.unitAmount * item.quantity)}</b>
              </div>
            ))}
            <div className="summary-line summary-total">
              <span>Итого</span>
              <b>{isPending ? "..." : formatPrice(total)}</b>
            </div>
            {totalRub > 0 || totalUsd > 0 ? (
              <div className="checkout-meta">
                {totalRub > 0 ? <span>RUB snapshot: {formatPrice(totalRub)}</span> : null}
                {totalUsd > 0 ? <span>USD snapshot: {totalUsd} $</span> : null}
                <span>{deliveryRequired ? "Доставка потребуется" : "Без доставки"}</span>
              </div>
            ) : null}
          </>
        ) : cartIsEmpty ? (
          <>
            <p className="muted">Корзина пока пустая. Добавьте услугу или товар из каталога.</p>
            <div className="stack-top hero-actions">
              <Link className="btn btn-primary btn-wide" href="/products">
                Перейти к товарам
              </Link>
              <Link className="btn btn-ghost btn-wide" href="/services">
                Перейти к услугам
              </Link>
            </div>
          </>
        ) : cartUnavailable ? (
          <p className="checkout-error">{STALE_CART_MESSAGE}</p>
        ) : resolveError ? (
          <p className="checkout-error">{resolveError}</p>
        ) : (
          <p className="muted">{isPending ? "Загружаем корзину..." : "Проверяем состав корзины..."}</p>
        )}
        <div className="stack-top">
          <p className="muted">
            После оформления заказ создается сразу. Онлайн-оплата пока не подключена: администратор подтвердит заказ, отправит реквизиты и обновит статус в вашем кабинете.
          </p>
          <LegalNotice />
        </div>
      </aside>
    </div>
  );
}
