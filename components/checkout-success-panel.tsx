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
  const marked = state.success;

  return (
    <div className="checkout-success-panel" role="status">
      <h3>Заказ создан</h3>
      <p>
        Номер заказа: <strong>{orderNumber}</strong>
      </p>
      <p>Мы сохранили заказ в вашем кабинете.</p>
      <p className="muted">
        Оплата пока работает в тестовом режиме. Нажмите «Я оплатил», если уже перевели оплату по
        реквизитам — это временная заглушка, а не подтверждение реального платежа.
      </p>
      {state.message ? (
        <p className={marked ? "checkout-success" : "checkout-error"}>{state.message}</p>
      ) : null}
      <div className="checkout-success-actions">
        {!marked ? (
          <form action={formAction}>
            <input type="hidden" name="orderId" value={orderId} />
            <input type="hidden" name="returnTo" value="/checkout" />
            <SubmitButton className="btn btn-primary btn-wide" pendingLabel="Отправляем отметку...">
              Я оплатил
            </SubmitButton>
          </form>
        ) : null}
        <Link className="btn btn-ghost btn-wide" href={accountUrl as Route}>
          Открыть заказ
        </Link>
        <Link className="btn btn-ghost btn-wide" href="/products">
          Вернуться в магазин
        </Link>
      </div>
    </div>
  );
}
