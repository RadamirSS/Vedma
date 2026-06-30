"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { customerLogoutAction } from "@/app/account/actions";

import {
  checkoutCustomerLoginAction,
  submitCheckoutAction,
  type CheckoutActionState
} from "@/app/checkout/actions";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { CheckoutSuccessPanel } from "@/components/checkout-success-panel";
import { SoftTrustNotice } from "@/components/soft-trust-notice";
import { SubmitButton } from "@/components/admin/submit-button";
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

function FieldWrap({
  name,
  label,
  fieldErrors,
  children,
  hint
}: {
  name: string;
  label: string;
  fieldErrors?: Record<string, string>;
  children: ReactNode;
  hint?: string;
}) {
  const error = fieldErrors?.[name];
  return (
    <div className={`field ${error ? "has-error" : ""}`} data-field={name}>
      <label htmlFor={name}>{label}</label>
      {children}
      {hint ? <small className="muted">{hint}</small> : null}
      {error ? <span className="field-error">{error}</span> : null}
    </div>
  );
}

export function CheckoutView({
  currentUser,
  loginError
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
  loginError?: string | null;
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
  const [accountMode, setAccountMode] = useState<"new" | "existing">("new");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      clearCart();
    }
  }, [clearCart, state.success]);

  useEffect(() => {
    if (!state.fieldErrors || Object.keys(state.fieldErrors).length === 0) {
      return;
    }
    const firstKey = Object.keys(state.fieldErrors)[0];
    const target =
      formRef.current?.querySelector<HTMLElement>(`[data-field="${firstKey}"]`) ??
      formRef.current?.querySelector<HTMLElement>(`#${firstKey}`);
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
    target?.querySelector<HTMLElement>("input, select, textarea")?.focus();
  }, [state.fieldErrors]);

  const cartEntriesJson = useMemo(() => JSON.stringify(items), [items]);
  const cartIsEmpty = items.length === 0 && resolvedItems.length === 0 && !isPending;
  const submitDisabled = pending || isPending || resolvedItems.length === 0 || state.success;
  const hasProducts = resolvedItems.some((item) => item.type === "product");
  const hasServices = resolvedItems.some((item) => item.type === "service");
  const isLoggedIn = Boolean(currentUser);
  const fieldErrors = state.fieldErrors ?? {};
  const showCheckoutForm = isLoggedIn || accountMode === "new";

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
      <div className="form-card">
        {resolveError ? <p className="checkout-error">{resolveError}</p> : null}
        {cartUnavailable ? <p className="checkout-error">{STALE_CART_MESSAGE}</p> : null}
        {loginError ? <p className="checkout-error">{loginError}</p> : null}

        <section className="checkout-account-section">
          <h3>Кабинет покупателя</h3>
          {isLoggedIn ? (
            <div className="checkout-account-confirmed">
              <p>
                Вы вошли как <strong>{currentUser?.email}</strong>
              </p>
              <p className="muted">
                Данные профиля подставлены ниже. Заказ будет сохранён в вашем кабинете.
              </p>
              <form action={customerLogoutAction} className="stack-top">
                <button type="submit" className="text-link">
                  Выйти и сменить аккаунт
                </button>
              </form>
            </div>
          ) : (
            <>
              <p className="muted">
                Создайте кабинет для отслеживания заказа или войдите, если уже регистрировались.
              </p>
              <div className="checkout-account-mode" role="radiogroup" aria-label="Режим кабинета">
                <label className={`checkout-mode-option ${accountMode === "new" ? "is-active" : ""}`}>
                  <input
                    type="radio"
                    name="accountModePreview"
                    value="new"
                    checked={accountMode === "new"}
                    onChange={() => setAccountMode("new")}
                  />
                  Я новый клиент
                </label>
                <label className={`checkout-mode-option ${accountMode === "existing" ? "is-active" : ""}`}>
                  <input
                    type="radio"
                    name="accountModePreview"
                    value="existing"
                    checked={accountMode === "existing"}
                    onChange={() => setAccountMode("existing")}
                  />
                  У меня уже есть кабинет
                </label>
              </div>
              {accountMode === "existing" ? (
                <form className="checkout-login-form stack-top" action={checkoutCustomerLoginAction}>
                  <FieldWrap name="email" label="Email" fieldErrors={fieldErrors}>
                    <input id="email" name="email" type="email" placeholder="mail@example.com" />
                  </FieldWrap>
                  <FieldWrap name="password" label="Пароль" fieldErrors={fieldErrors}>
                    <input id="password" name="password" type="password" placeholder="Пароль кабинета" />
                  </FieldWrap>
                  <SubmitButton className="btn btn-primary btn-wide" pendingLabel="Входим...">
                    Войти и продолжить
                  </SubmitButton>
                  <p className="muted">
                    Или{" "}
                    <Link className="text-link" href="/account/login?next=/checkout">
                      войти на отдельной странице
                    </Link>
                    .
                  </p>
                </form>
              ) : null}
            </>
          )}
        </section>

        {showCheckoutForm ? (
          <form ref={formRef} className="stack-top" action={formAction} noValidate>
            <input type="hidden" name="cartEntries" value={cartEntriesJson} />
            <input type="hidden" name="accountMode" value={isLoggedIn ? "existing" : accountMode} />

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

            {state.message && !state.success ? (
              <p className="checkout-error-summary checkout-error">{state.message}</p>
            ) : null}

            <div className="form-grid">
              <FieldWrap name="name" label="Имя" fieldErrors={fieldErrors}>
                <input
                  id="name"
                  name="name"
                  placeholder="Ваше имя"
                  defaultValue={currentUser?.name ?? ""}
                  className={fieldErrors.name ? "input-error" : undefined}
                  aria-invalid={fieldErrors.name ? true : undefined}
                />
              </FieldWrap>

              {!isLoggedIn && accountMode === "new" ? (
                <>
                  <FieldWrap
                    name="email"
                    label="Email"
                    fieldErrors={fieldErrors}
                    hint="Email нужен для подтверждения заказа и будущих чеков/уведомлений."
                  >
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="mail@example.com"
                      className={fieldErrors.email ? "input-error" : undefined}
                      aria-invalid={fieldErrors.email ? true : undefined}
                    />
                  </FieldWrap>
                  <FieldWrap name="emailConfirm" label="Повторите email" fieldErrors={fieldErrors}>
                    <input
                      id="emailConfirm"
                      name="emailConfirm"
                      type="email"
                      placeholder="mail@example.com"
                      className={fieldErrors.emailConfirm ? "input-error" : undefined}
                      aria-invalid={fieldErrors.emailConfirm ? true : undefined}
                    />
                  </FieldWrap>
                  <FieldWrap name="password" label="Пароль кабинета" fieldErrors={fieldErrors}>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Минимум 8 символов"
                      className={fieldErrors.password ? "input-error" : undefined}
                      aria-invalid={fieldErrors.password ? true : undefined}
                    />
                  </FieldWrap>
                  <FieldWrap name="passwordConfirm" label="Повторите пароль" fieldErrors={fieldErrors}>
                    <input
                      id="passwordConfirm"
                      name="passwordConfirm"
                      type="password"
                      placeholder="Повторите пароль"
                      className={fieldErrors.passwordConfirm ? "input-error" : undefined}
                      aria-invalid={fieldErrors.passwordConfirm ? true : undefined}
                    />
                  </FieldWrap>
                </>
              ) : null}

              {isLoggedIn ? (
                <input type="hidden" name="email" value={currentUser?.email ?? ""} />
              ) : null}

              <FieldWrap name="phone" label={`Телефон${hasProducts ? " *" : ""}`} fieldErrors={fieldErrors}>
                <input
                  id="phone"
                  name="phone"
                  placeholder="+7 / +995 ..."
                  defaultValue={currentUser?.phone ?? ""}
                  className={fieldErrors.phone ? "input-error" : undefined}
                  aria-invalid={fieldErrors.phone ? true : undefined}
                />
              </FieldWrap>
              <FieldWrap name="telegram" label="Telegram (необязательно)" fieldErrors={fieldErrors}>
                <input
                  id="telegram"
                  name="telegram"
                  placeholder="@username"
                  defaultValue={currentUser?.telegram ?? ""}
                />
              </FieldWrap>
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
                  <AddressAutocomplete
                    fieldErrors={fieldErrors}
                    defaultValues={{
                      country: currentUser?.country ?? undefined,
                      city: currentUser?.city ?? undefined,
                      addressLine1: currentUser?.addressLine1 ?? undefined,
                      addressLine2: currentUser?.addressLine2 ?? undefined,
                      postalCode: currentUser?.postalCode ?? undefined
                    }}
                  />
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

              <label className={`field full check ${fieldErrors.ageConfirmed ? "has-error" : ""}`} data-field="ageConfirmed">
                <input type="checkbox" name="ageConfirmed" value="yes" />
                <span>Подтверждаю, что мне исполнилось 18 лет.</span>
                {fieldErrors.ageConfirmed ? <span className="field-error">{fieldErrors.ageConfirmed}</span> : null}
              </label>
              <label className={`field full check ${fieldErrors.legalAccepted ? "has-error" : ""}`} data-field="legalAccepted">
                <input type="checkbox" name="legalAccepted" value="yes" />
                <span>Согласен с политикой конфиденциальности и офертой.</span>
                {fieldErrors.legalAccepted ? <span className="field-error">{fieldErrors.legalAccepted}</span> : null}
              </label>
            </div>

            {submitDisabled && submitDisabledReason ? (
              <p className="checkout-error stack-top">{submitDisabledReason}</p>
            ) : null}
            <button className="btn btn-primary btn-wide stack-top" type="submit" disabled={submitDisabled}>
              {pending ? "Отправляем заказ..." : "Отправить заказ"}
            </button>
          </form>
        ) : null}
      </div>

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
