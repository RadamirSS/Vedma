"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { customerLogoutAction, submitCheckoutAction, checkoutCustomerLoginAction, type CheckoutActionState } from "@/lib/actions/customer";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { CheckoutSuccessPanel } from "@/components/checkout-success-panel";
import { SoftTrustNotice } from "@/components/soft-trust-notice";
import { SubmitButton } from "@/components/admin/submit-button";
import { useCart } from "@/components/cart-context";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/ru";
import { localizeHref } from "@/lib/i18n/routing";
import { formatPrice } from "@/lib/utils";

const initialState: CheckoutActionState = {
  success: false,
  message: null,
  redirectTo: null,
  orderId: null,
  orderNumber: null
};

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
  loginError,
  locale,
  dict
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
  locale: Locale;
  dict: Dictionary;
}) {
  const {
    items,
    resolvedItems,
    total,
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

  const t = dict.checkout;
  const staleCartMessage = t.staleCart;

  let submitDisabledReason: string | null = null;
  if (state.success) {
    submitDisabledReason = null;
  } else if (isPending) {
    submitDisabledReason = t.loadingCart;
  } else if (resolveError) {
    submitDisabledReason = resolveError;
  } else if (cartUnavailable) {
    submitDisabledReason = staleCartMessage;
  } else if (resolvedItems.length === 0) {
    submitDisabledReason = t.addItemsHint;
  }

  const productCommentLabel = t.productCommentLabel;
  const serviceCommentLabel = t.serviceCommentLabel;

  if (state.success && state.orderId && state.orderNumber && state.redirectTo) {
    return (
      <div className="checkout-grid checkout-grid--success">
        <CheckoutSuccessPanel
          orderId={state.orderId}
          orderNumber={state.orderNumber}
          accountUrl={state.redirectTo}
          locale={locale}
          dict={dict}
        />
        <aside className="cart-summary">
          <SoftTrustNotice compact text={dict.trust.softNotice} />
        </aside>
      </div>
    );
  }

  return (
    <div className="checkout-grid">
      <div className="form-card">
        {resolveError ? <p className="checkout-error">{resolveError}</p> : null}
        {cartUnavailable ? <p className="checkout-error">{staleCartMessage}</p> : null}
        {loginError ? <p className="checkout-error">{loginError}</p> : null}

        <section className="checkout-account-section">
          <h3>{t.customerAccount}</h3>
          {isLoggedIn ? (
            <div className="checkout-account-confirmed">
              <p>
                {t.loggedInAs} <strong>{currentUser?.email}</strong>
              </p>
              <p className="muted">{t.profilePrefilled}</p>
              <form action={customerLogoutAction} className="stack-top">
                <input type="hidden" name="locale" value={locale} />
                <button type="submit" className="text-link">
                  {t.logoutSwitch}
                </button>
              </form>
            </div>
          ) : (
            <>
              <p className="muted">{t.accountHint}</p>
              <div className="checkout-account-mode" role="radiogroup" aria-label={t.customerAccount}>
                <label className={`checkout-mode-option ${accountMode === "new" ? "is-active" : ""}`}>
                  <input
                    type="radio"
                    name="accountModePreview"
                    value="new"
                    checked={accountMode === "new"}
                    onChange={() => setAccountMode("new")}
                  />
                  <span>{t.newCustomer}</span>
                </label>
                <label className={`checkout-mode-option ${accountMode === "existing" ? "is-active" : ""}`}>
                  <input
                    type="radio"
                    name="accountModePreview"
                    value="existing"
                    checked={accountMode === "existing"}
                    onChange={() => setAccountMode("existing")}
                  />
                  <span>{t.existingCustomer}</span>
                </label>
              </div>
              {accountMode === "existing" ? (
                <form className="checkout-login-form stack-top" action={checkoutCustomerLoginAction}>
                  <input type="hidden" name="locale" value={locale} />
                  <FieldWrap name="email" label={t.email} fieldErrors={fieldErrors}>
                    <input id="email" name="email" type="email" placeholder={t.emailPlaceholder} />
                  </FieldWrap>
                  <FieldWrap name="password" label={t.password} fieldErrors={fieldErrors}>
                    <input id="password" name="password" type="password" placeholder={t.passwordPlaceholder} />
                  </FieldWrap>
                  <SubmitButton className="btn btn-primary btn-wide" pendingLabel={dict.account.loginPending}>
                    {t.loginContinue}
                  </SubmitButton>
                  <p className="muted">
                    {t.or}{" "}
                    <Link
                      className="text-link"
                      href={`${localizeHref(locale, "/account/login")}?next=${encodeURIComponent(localizeHref(locale, "/checkout"))}`}
                    >
                      {t.loginSeparate}
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
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="cartEntries" value={cartEntriesJson} />
            <input type="hidden" name="accountMode" value={isLoggedIn ? "existing" : accountMode} />

            {hasProducts ? (
              <div className="checkout-note checkout-note--info">
                <p>{t.productNote1}</p>
                <p>{t.productNote2}</p>
                <p>{t.productNote3}</p>
              </div>
            ) : null}

            {hasServices && !hasProducts ? (
              <div className="checkout-note checkout-note--info">
                <p>{t.serviceNote1}</p>
                <p>{t.serviceNote2}</p>
              </div>
            ) : null}

            {state.message && !state.success ? (
              <p className="checkout-error-summary checkout-error">{state.message}</p>
            ) : null}

            <div className="form-grid">
              <FieldWrap name="name" label={t.name} fieldErrors={fieldErrors}>
                <input
                  id="name"
                  name="name"
                  placeholder={t.namePlaceholder}
                  defaultValue={currentUser?.name ?? ""}
                  className={fieldErrors.name ? "input-error" : undefined}
                  aria-invalid={fieldErrors.name ? true : undefined}
                />
              </FieldWrap>

              {!isLoggedIn && accountMode === "new" ? (
                <>
                  <FieldWrap
                    name="email"
                    label={t.email}
                    fieldErrors={fieldErrors}
                    hint={t.emailHint}
                  >
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder={t.emailPlaceholder}
                      className={fieldErrors.email ? "input-error" : undefined}
                      aria-invalid={fieldErrors.email ? true : undefined}
                    />
                  </FieldWrap>
                  <FieldWrap name="emailConfirm" label={t.emailConfirm} fieldErrors={fieldErrors}>
                    <input
                      id="emailConfirm"
                      name="emailConfirm"
                      type="email"
                      placeholder={t.emailPlaceholder}
                      className={fieldErrors.emailConfirm ? "input-error" : undefined}
                      aria-invalid={fieldErrors.emailConfirm ? true : undefined}
                    />
                  </FieldWrap>
                  <FieldWrap name="password" label={t.accountPassword} fieldErrors={fieldErrors}>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      placeholder={t.passwordMin}
                      className={fieldErrors.password ? "input-error" : undefined}
                      aria-invalid={fieldErrors.password ? true : undefined}
                    />
                  </FieldWrap>
                  <FieldWrap name="passwordConfirm" label={t.passwordConfirm} fieldErrors={fieldErrors}>
                    <input
                      id="passwordConfirm"
                      name="passwordConfirm"
                      type="password"
                      placeholder={t.passwordConfirm}
                      className={fieldErrors.passwordConfirm ? "input-error" : undefined}
                      aria-invalid={fieldErrors.passwordConfirm ? true : undefined}
                    />
                  </FieldWrap>
                </>
              ) : null}

              {isLoggedIn ? (
                <input type="hidden" name="email" value={currentUser?.email ?? ""} />
              ) : null}

              <FieldWrap name="phone" label={`${t.phone}${hasProducts ? " *" : ""}`} fieldErrors={fieldErrors}>
                <input
                  id="phone"
                  name="phone"
                  placeholder={t.phonePlaceholder}
                  defaultValue={currentUser?.phone ?? ""}
                  className={fieldErrors.phone ? "input-error" : undefined}
                  aria-invalid={fieldErrors.phone ? true : undefined}
                />
              </FieldWrap>
              <FieldWrap name="telegram" label={t.telegram} fieldErrors={fieldErrors}>
                <input
                  id="telegram"
                  name="telegram"
                  placeholder={t.telegramPlaceholder}
                  defaultValue={currentUser?.telegram ?? ""}
                />
              </FieldWrap>
              <div className="field">
                <label htmlFor="contactMethod">{t.contactMethod}</label>
                <select id="contactMethod" name="contactMethod" defaultValue="TELEGRAM">
                  <option value="TELEGRAM">{t.contactMethods.telegram}</option>
                  <option value="WHATSAPP">{t.contactMethods.whatsapp}</option>
                  <option value="PHONE">{t.contactMethods.phone}</option>
                  <option value="EMAIL">{t.contactMethods.email}</option>
                </select>
              </div>

              {deliveryRequired ? (
                <div className="field full checkout-section">
                  <h4>{t.delivery}</h4>
                  <AddressAutocomplete
                    dict={dict}
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
                  <h4>{t.serviceRequest}</h4>
                  <div className="field full">
                    <label htmlFor="serviceComment">{serviceCommentLabel}</label>
                    <textarea
                      id="serviceComment"
                      name="serviceComment"
                      placeholder={t.serviceCommentPlaceholder}
                    />
                  </div>
                  <div className="field full">
                    <label htmlFor="preferredContactAt">{t.preferredContact}</label>
                    <input
                      id="preferredContactAt"
                      name="preferredContactAt"
                      placeholder={t.preferredContactPlaceholder}
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
                    placeholder={t.productCommentPlaceholder}
                  />
                </div>
              ) : null}

              <label className={`field full check ${fieldErrors.ageConfirmed ? "has-error" : ""}`} data-field="ageConfirmed">
                <input type="checkbox" name="ageConfirmed" value="yes" />
                <span>{t.ageConfirm}</span>
                {fieldErrors.ageConfirmed ? <span className="field-error">{fieldErrors.ageConfirmed}</span> : null}
              </label>
              <label className={`field full check ${fieldErrors.legalAccepted ? "has-error" : ""}`} data-field="legalAccepted">
                <input type="checkbox" name="legalAccepted" value="yes" />
                <span>{t.legalAccept}</span>
                {fieldErrors.legalAccepted ? <span className="field-error">{fieldErrors.legalAccepted}</span> : null}
              </label>
            </div>

            {submitDisabled && submitDisabledReason ? (
              <p className="checkout-error stack-top">{submitDisabledReason}</p>
            ) : null}
            <button className="btn btn-primary btn-wide stack-top" type="submit" disabled={submitDisabled}>
              {pending ? t.submitting : t.submitOrder}
            </button>
          </form>
        ) : null}
      </div>

      <aside className="cart-summary">
        <h3>{t.orderSummary}</h3>
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
              <span>{t.total}</span>
              <b>{isPending ? "..." : formatPrice(total)}</b>
            </div>
            {deliveryRequired ? (
              <p className="muted checkout-delivery-note">{t.deliveryRequired}</p>
            ) : null}
          </>
        ) : cartIsEmpty ? (
          <>
            <p className="muted">{t.emptyCart}</p>
            <div className="stack-top hero-actions">
              <Link className="btn btn-primary btn-wide" href={localizeHref(locale, "/products")}>
                {dict.cart.goToProducts}
              </Link>
              <Link className="btn btn-ghost btn-wide" href={localizeHref(locale, "/services")}>
                {dict.cart.goToServices}
              </Link>
            </div>
          </>
        ) : cartUnavailable ? (
          <p className="checkout-error">{staleCartMessage}</p>
        ) : resolveError ? (
          <p className="checkout-error">{resolveError}</p>
        ) : (
          <p className="muted">{isPending ? dict.cart.loading : t.checkingCart}</p>
        )}
        <div className="stack-top">
          <SoftTrustNotice compact text={dict.trust.softNotice} />
        </div>
      </aside>
    </div>
  );
}
