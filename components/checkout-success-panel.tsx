"use client";

import Link from "next/link";
import type { Route } from "next";
import { useActionState } from "react";

import { customerMarkOrderPaidAction } from "@/app/account/actions";
import { SubmitButton } from "@/components/admin/submit-button";

const initialState = { success: false, message: null as string | null };

export function CheckoutSuccessPanel({
  orderId,
  orderNumber,
  accountUrl
}: {
  orderId: string;
  orderNumber: string;
  accountUrl: string;
}) {
  const [state, formAction] = useActionState(customerMarkOrderPaidAction, initialState);

  return (
    <div className="checkout-success-panel" role="status">
      <h3>Заказ создан</h3>
      <p>
        Номер заказа: <strong>{orderNumber}</strong>
      </p>
      <p className="muted">
        Оплата пока подключается. Для теста дальнейшего пути нажмите «Я оплатил» — это временная
        заглушка, а не подтверждение реального платежа.
      </p>
      {state.message ? (
        <p className={state.success ? "checkout-success" : "checkout-error"}>{state.message}</p>
      ) : null}
      <div className="checkout-success-actions">
        {!state.success ? (
          <form action={formAction}>
            <input type="hidden" name="orderId" value={orderId} />
            <input type="hidden" name="returnTo" value="/checkout" />
            <SubmitButton className="btn btn-primary btn-wide" pendingLabel="Отправляем отметку...">
              Я оплатил
            </SubmitButton>
          </form>
        ) : null}
        <Link className="btn btn-ghost btn-wide" href={accountUrl as Route}>
          Открыть заказ в кабинете
        </Link>
      </div>
    </div>
  );
}
