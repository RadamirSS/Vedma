import { customerMarkOrderPaidFormAction } from "@/app/account/actions";
import { SubmitButton } from "@/components/admin/submit-button";
import { PAYMENT_STATUS_LABELS } from "@/lib/admin/constants";
import type { PaymentStatus } from "@prisma/client";

const MARKABLE_STATUSES: PaymentStatus[] = ["NOT_ISSUED", "INVOICE_SENT"];

export function OrderPaymentBlock({
  orderId,
  paymentStatus,
  markedPending = false
}: {
  orderId: string;
  paymentStatus: PaymentStatus;
  markedPending?: boolean;
}) {
  const canMark = MARKABLE_STATUSES.includes(paymentStatus);
  const isPending = paymentStatus === "PENDING" || markedPending;

  return (
    <article className="form-card payment-block">
      <h3>Оплата</h3>
      <div className="summary-line">
        <span>Статус</span>
        <b>{PAYMENT_STATUS_LABELS[paymentStatus]}</b>
      </div>
      <p className="muted stack-top">
        Онлайн-оплата пока подключается. После подтверждения заказа администратор отправит реквизиты
        вручную.
      </p>
      {isPending && !canMark ? (
        <p className="checkout-success stack-top">
          Отметка об оплате отправлена. Администратор проверит и обновит статус.
        </p>
      ) : null}
      {canMark ? (
        <form className="stack-top" action={customerMarkOrderPaidFormAction}>
          <input type="hidden" name="orderId" value={orderId} />
          <input type="hidden" name="returnTo" value={`/account/orders/${orderId}`} />
          <p className="muted">
            Если вы уже перевели оплату по реквизитам, можете отметить это здесь. Это временная
            заглушка до подключения онлайн-оплаты.
          </p>
          <SubmitButton className="btn btn-primary btn-wide" pendingLabel="Отправляем отметку...">
            Я оплатил
          </SubmitButton>
        </form>
      ) : null}
      <p className="muted stack-top">
        Нужна помощь? Напишите в Telegram или на странице{" "}
        <a className="text-link" href="/contacts">
          контактов
        </a>
        .
      </p>
    </article>
  );
}
