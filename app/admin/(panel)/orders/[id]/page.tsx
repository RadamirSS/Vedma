import Link from "next/link";
import { notFound } from "next/navigation";

import { updateOrderStatusAction } from "@/app/admin/actions";
import { AdminNotice } from "@/components/admin/admin-notice";
import { AdminReadOnlyNotice } from "@/components/admin/admin-read-only-notice";
import { SubmitButton } from "@/components/admin/submit-button";
import {
  CONTACT_METHOD_LABELS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_OPTIONS
} from "@/lib/admin/constants";
import { formatAdminDate } from "@/lib/admin/format";
import { isReadOnlyAdminRole, requireAdminSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { formatPrice } from "@/lib/utils";

export default async function AdminOrderDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const session = await requireAdminSession(`/admin/orders/${id}`);
  const isReadOnly = isReadOnlyAdminRole(session.user.role);
  const canViewPrivateFiles = session.user.role === "ADMIN";
  const success = typeof query.success === "string" ? query.success : undefined;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      items: {
        include: {
          product: true,
          service: true
        }
      },
      files: true,
      payments: true,
      statusHistory: {
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!order) {
    notFound();
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-title">
          <span className="eyebrow">Заказ</span>
          <h1>{order.orderNumber}</h1>
          <p>Клиент: {order.customerName ?? order.customer.name ?? order.customer.email}</p>
        </div>
        <Link className="btn btn-ghost" href="/admin/orders">
          Назад к списку
        </Link>
      </div>

      <AdminNotice success={success} />
      {isReadOnly ? <AdminReadOnlyNotice text="Демо-аккаунт может просматривать заказ, но не может менять статусы, комментарии или открывать приватные PDF." /> : null}

      <div className="admin-detail-grid">
        <article>
          <div className="admin-section-head">
            <h2>Состав</h2>
            <p>Снимок цен фиксируется в момент checkout.</p>
          </div>
          <div className="admin-table">
            <table>
              <thead>
                <tr>
                  <th>Позиция</th>
                  <th>Тип</th>
                  <th>Количество</th>
                  <th>Цена</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.titleSnapshot}</td>
                    <td>{item.itemType === "PRODUCT" ? "Товар" : "Услуга"}</td>
                    <td>{item.quantity}</td>
                    <td>{formatPrice(item.priceSnapshot * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="summary-line summary-total stack-top">
            <span>Итого</span>
            <b>{formatPrice(order.totalAmount)}</b>
          </div>
        </article>

        <aside className="admin-side-list">
          <div className="admin-card">
            <h3>Контакты</h3>
            <p>{order.customerEmail ?? order.customer.email}</p>
            <p>{order.customerPhone ?? order.customer.phone ?? "Телефон не указан"}</p>
            <p>{order.customerTelegram ?? order.customer.telegram ?? "Telegram не указан"}</p>
            <p>
              Способ связи:{" "}
              {order.contactMethod ? CONTACT_METHOD_LABELS[order.contactMethod] : "Не выбран"}
            </p>
          </div>
          <div className="admin-card">
            <h3>Файлы</h3>
            {order.files.length === 0 ? (
              <p className="muted">Вложений нет.</p>
            ) : !canViewPrivateFiles ? (
              <p className="muted">Приватные PDF доступны только администратору.</p>
            ) : (
              <div className="admin-side-list">
                {order.files.map((file) => (
                  <a key={file.id} className="btn btn-ghost btn-small" href={`/admin/files/${file.id}`}>
                    {file.originalName}
                  </a>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      <div className="admin-detail-grid">
        <article className="admin-card">
          <div className="admin-section-head">
            <h2>Обновить статусы</h2>
            <p>Оплата и выполнение заказа меняются вручную.</p>
          </div>
          <form className="admin-form-grid" action={updateOrderStatusAction}>
            <input type="hidden" name="id" value={order.id} />
            <label className="admin-field">
              <span>Статус заказа</span>
              <select className="admin-select" name="status" defaultValue={order.status} disabled={isReadOnly}>
                {ORDER_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-field">
              <span>Статус платежа</span>
              <select className="admin-select" name="paymentStatus" defaultValue={order.paymentStatus} disabled={isReadOnly}>
                {PAYMENT_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-field full">
              <span>Комментарий администратора</span>
              <textarea className="admin-textarea" name="adminComment" defaultValue={order.adminComment ?? ""} disabled={isReadOnly} />
            </label>
            {!isReadOnly ? (
              <SubmitButton className="btn btn-primary" pendingLabel="Сохранение...">
                Сохранить статус
              </SubmitButton>
            ) : null}
          </form>
        </article>

        <article className="admin-card">
          <div className="admin-section-head">
            <h2>История</h2>
            <p>Лента событий по заказу.</p>
          </div>
          <div className="admin-side-list">
            <div className="summary-line">
              <span>Текущий статус</span>
              <b>{ORDER_STATUS_LABELS[order.status]}</b>
            </div>
            <div className="summary-line">
              <span>Текущий платеж</span>
              <b>{PAYMENT_STATUS_LABELS[order.paymentStatus]}</b>
            </div>
            {order.statusHistory.map((entry) => (
              <div key={entry.id} className="admin-card">
                <strong>{entry.newStatus}</strong>
                <span>{entry.comment ?? "Без комментария"}</span>
                <small>{formatAdminDate(entry.createdAt)}</small>
              </div>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}
