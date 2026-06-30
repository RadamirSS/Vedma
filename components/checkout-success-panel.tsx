"use client";

import Link from "next/link";
import type { Route } from "next";
import { useActionState } from "react";

import { customerMarkOrderPaidAction } from "@/lib/actions/customer";
import { SubmitButton } from "@/components/admin/submit-button";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/ru";
import { localizeHref } from "@/lib/i18n/routing";

const initialState = { success: false, message: null as string | null };

export function CheckoutSuccessPanel({
  orderId,
  orderNumber,
  accountUrl,
  locale,
  dict
}: {
  orderId: string;
  orderNumber: string;
  accountUrl: string;
  locale: Locale;
  dict: Dictionary;
}) {
  const [state, formAction] = useActionState(customerMarkOrderPaidAction, initialState);
  const marked = state.success;
  const t = dict.checkout;

  return (
    <div className="checkout-success-panel" role="status">
      <h3>{t.successTitle}</h3>
      <p>
        {dict.account.orderNumber}: <strong>{orderNumber}</strong>
      </p>
      <p>{t.successSaved}</p>
      <p className="muted">{t.paymentManual}</p>
      {state.message ? (
        <p className={marked ? "checkout-success" : "checkout-error"}>{state.message}</p>
      ) : null}
      <div className="checkout-success-actions">
        {!marked ? (
          <form action={formAction}>
            <input type="hidden" name="orderId" value={orderId} />
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="returnTo" value={localizeHref(locale, "/checkout")} />
            <SubmitButton className="btn btn-primary btn-wide" pendingLabel={dict.account.markPaidPending}>
              {t.iHavePaid}
            </SubmitButton>
          </form>
        ) : null}
        <Link className="btn btn-ghost btn-wide" href={accountUrl as Route}>
          {t.viewOrder}
        </Link>
        <Link className="btn btn-ghost btn-wide" href={localizeHref(locale, "/products")}>
          {t.continueShopping}
        </Link>
      </div>
    </div>
  );
}
