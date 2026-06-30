import Link from "next/link";

import { customerMarkOrderPaidFormAction } from "@/lib/actions/customer";
import { SubmitButton } from "@/components/admin/submit-button";
import { PAYMENT_STATUS_LABELS } from "@/lib/admin/constants";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/ru";
import { localizeHref } from "@/lib/i18n/routing";
import type { PaymentStatus } from "@prisma/client";

const MARKABLE_STATUSES: PaymentStatus[] = ["NOT_ISSUED", "INVOICE_SENT"];

export function OrderPaymentBlock({
  orderId,
  paymentStatus,
  markedPending = false,
  locale,
  dict
}: {
  orderId: string;
  paymentStatus: PaymentStatus;
  markedPending?: boolean;
  locale: Locale;
  dict: Dictionary;
}) {
  const canMark = MARKABLE_STATUSES.includes(paymentStatus);
  const isPending = paymentStatus === "PENDING" || markedPending;
  const returnTo = localizeHref(locale, `/account/orders/${orderId}`);
  const contactsHref = localizeHref(locale, "/contacts");

  return (
    <article className="form-card payment-block">
      <h3>{dict.account.paymentBlockTitle}</h3>
      <div className="summary-line">
        <span>{dict.account.orderStatus}</span>
        <b>{PAYMENT_STATUS_LABELS[paymentStatus]}</b>
      </div>
      <p className="muted stack-top">{dict.account.paymentSetupNote}</p>
      {isPending && !canMark ? (
        <p className="checkout-success stack-top">{dict.account.paymentMarked}</p>
      ) : null}
      {canMark ? (
        <form className="stack-top" action={customerMarkOrderPaidFormAction}>
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="orderId" value={orderId} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <p className="muted">{dict.account.paymentMarkHint}</p>
          <SubmitButton className="btn btn-primary btn-wide" pendingLabel={dict.account.paymentMarkPending}>
            {dict.account.markPaid}
          </SubmitButton>
        </form>
      ) : null}
      <p className="muted stack-top">
        {dict.account.helpPrefix}{" "}
        <Link className="text-link" href={contactsHref}>
          {dict.account.helpContactsLink}
        </Link>
        .
      </p>
    </article>
  );
}
