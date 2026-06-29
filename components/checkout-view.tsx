"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo } from "react";

import { submitCheckoutAction, type CheckoutActionState } from "@/app/checkout/actions";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { CheckoutSuccessPanel } from "@/components/checkout-success-panel";
import { SoftTrustNotice } from "@/components/soft-trust-notice";
import { useCart } from "@/components/cart-context";
import { formatPrice } from "@/lib/utils";

const initialState: CheckoutActionState = {
  success: false,
  message: null,
  redirectTo: null,
  orderId: null,
  orderNumber: null
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
  const submitDisabled = pending || isPending || resolvedItems.length === 0 || state.success;
  const hasProducts = resolvedItems.some((item) => item.type === "product");
  const hasServices = resolvedItems.some((item) => item.type === "service");
  const isLoggedIn = Boolean(currentUser);

  let submitDisabledReason: string | null = null;
  if (state.success) {
    submitDisabledReason = null;
  } else if (isPending) {
    submitDisabledReason = "Загружаем состав корзины...";
  } else if (resolveError) {
    submitDisabledReason = resolveError;
  } else if (cartUnavailable) {
    submitDisabledReason = STALE_CART_MESSAGE;
  } else if (resolvedItems.length === 0) {
    submitDisabledReason = "Добавьте товары или услуги из каталога, чтобы оформить заказ.";
  }

  const productCommentLabel = "Комментарий к заказу / пожелания по доставке";
  const serviceCommentLabel = "Опишите запрос или ситуацию";

  if (state.success && state.orderId && state.orderNumber && state.redirectTo) {
    return (
      <div className="checkout-grid checkout-grid--success">
        <CheckoutSuccessPanel
          orderId={state.orderId}
          orderNumber={state.orderNumber}
          accountUrl={state.redirectTo}
        />
        <aside className="cart-summary">
          <SoftTrustNotice compact />
        </aside>
      </div>
    );
  }

  return (
    <div className="checkout-grid">
      <form className="form-card" action={formAction} noValidate={false}>
        <input type="hidden" name="cartEntries" value={cartEntriesJson} />
        <h3>Данные клиента</h3>
        {resolveError ? <p className="checkout-error">{resolveError}</p> : null}
        {cartUnavailable ? <p className="checkout-error">{STALE_CART_MESSAGE}</p> : null}

        {hasProducts ? (
          <div className="checkout-note checkout-note--info">
            <p>После успешного оформления заказа товар будет предварительно зарезервирован.</p>
            <p>Администратор подтвердит наличие и отправит реквизиты.</p>
            <p>Пожалуйста, проверьте контактные данные и адрес доставки.</p>
          </div>
        ) : null}

        {hasServices && !hasProducts ? (
          <div className="checkout-note checkout-note--info">
            <p>После оформления заявки администратор свяжется для согласования времени и формата.</p>
            <p>Оплата пока вручную после подтверждения.</p>
          </div>
        ) : null}

        <div className="form-grid">
          <div className="field">
            <label htmlFor="name">Имя</label>
            <input id="name" name="name" placeholder="Ваше имя" defaultValue={currentUser?.name ?? ""} required />
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
          {!isLoggedIn ? (
            <div className="field">
              <label htmlFor="password">Пароль кабинета</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Минимум 8 символов"
                minLength={8}
                required
              />
            </div>
          ) : null}
          <div className="field">
            <label htmlFor="phone">Телефон{hasProducts ? " *" : ""}</label>
            <input
              id="phone"
              name="phone"
              placeholder="+7 / +995 ..."
              defaultValue={currentUser?.phone ?? ""}
              required={hasProducts}
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

          {deliveryRequired ? (
            <div className="field full checkout-section">
              <h4>Доставка</h4>
              <AddressAutocomplete />
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="country">Страна</label>
                  <input
                    id="country"
                    name="country"
                    placeholder="Россия / Грузия"
                    defaultValue={currentUser?.country ?? ""}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="region">Регион</label>
                  <input id="region" name="region" placeholder="Область / край" />
                </div>
                <div className="field">
                  <label htmlFor="city">Город</label>
                  <input
                    id="city"
                    name="city"
                    placeholder="Москва / Тбилиси"
                    defaultValue={currentUser?.city ?? ""}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="street">Улица</label>
                  <input id="street" name="street" placeholder="Улица" />
                </div>
                <div className="field">
                  <label htmlFor="house">Дом</label>
                  <input id="house" name="house" placeholder="Дом" />
                </div>
                <div className="field">
                  <label htmlFor="flat">Квартира / офис</label>
                  <input id="flat" name="flat" placeholder="Квартира" />
                </div>
                <div className="field full">
                  <label htmlFor="addressLine1">Адрес доставки</label>
                  <input
                    id="addressLine1"
                    name="addressLine1"
                    placeholder="Улица, дом, квартира"
                    defaultValue={currentUser?.addressLine1 ?? ""}
                    required
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
              </div>
            </div>
          ) : null}

          {hasServices ? (
            <div className="field full checkout-section">
              <h4>Запрос по услуге</h4>
              <div className="field full">
                <label htmlFor="serviceComment">{serviceCommentLabel}</label>
                <textarea
                  id="serviceComment"
                  name="serviceComment"
                  placeholder="Опишите ситуацию, запрос или ожидания от работы."
                />
              </div>
              <div className="field full">
                <label htmlFor="preferredContactAt">Удобное время связи</label>
                <input
                  id="preferredContactAt"
                  name="preferredContactAt"
                  placeholder="Например: будни после 18:00 или суббота утром"
                />
              </div>
            </div>
          ) : null}

          {hasProducts ? (
            <div className="field full">
              <label htmlFor="comment">{productCommentLabel}</label>
              <textarea
                id="comment"
                name="comment"
                placeholder="Пожелания по доставке, упаковке или составу заказа."
              />
            </div>
          ) : null}

          <label className="field full check">
            <input type="checkbox" name="ageConfirmed" value="yes" required />
            <span>Подтверждаю, что мне исполнилось 18 лет.</span>
          </label>
          <label className="field full check">
            <input type="checkbox" name="legalAccepted" value="yes" required />
            <span>Согласен с политикой конфиденциальности и офертой.</span>
          </label>
        </div>
        {state.message && !state.success ? <p className="checkout-error">{state.message}</p> : null}
        {submitDisabled && submitDisabledReason ? (
          <p className="checkout-error stack-top">{submitDisabledReason}</p>
        ) : null}
        <button className="btn btn-primary btn-wide stack-top" type="submit" disabled={submitDisabled}>
          {pending ? "Отправляем заказ..." : "Отправить заказ"}
        </button>
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
          <SoftTrustNotice compact />
        </div>
      </aside>
    </div>
  );
}
