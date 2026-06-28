import Link from "next/link";
import { notFound } from "next/navigation";

import { updateCustomerNotesAction } from "@/app/admin/actions";
import { AdminNotice } from "@/components/admin/admin-notice";
import { SubmitButton } from "@/components/admin/submit-button";
import { formatAdminDate } from "@/lib/admin/format";
import { prisma } from "@/lib/db/prisma";

export default async function AdminCustomerDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const success = typeof query.success === "string" ? query.success : undefined;
  const customer = await prisma.user.findFirst({
    where: {
      id,
      role: "CUSTOMER"
    },
    include: {
      customerProfile: true,
      customerOrders: {
        orderBy: { createdAt: "desc" }
      },
      customerRequests: {
        orderBy: { createdAt: "desc" }
      },
      customerFiles: {
        orderBy: { uploadedAt: "desc" }
      }
    }
  });

  if (!customer) {
    notFound();
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-title">
          <span className="eyebrow">Клиент</span>
          <h1>{customer.name ?? customer.email}</h1>
          <p>{customer.email}</p>
        </div>
        <Link className="btn btn-ghost" href="/admin/customers">
          Назад к клиентам
        </Link>
      </div>

      <AdminNotice success={success} />

      <div className="admin-detail-grid">
        <article className="admin-card">
          <div className="admin-section-head">
            <h2>Контакты и доставка</h2>
            <p>Данные из checkout и личного кабинета.</p>
          </div>
          <div className="admin-side-list">
            <div className="summary-line">
              <span>Телефон</span>
              <b>{customer.phone ?? "—"}</b>
            </div>
            <div className="summary-line">
              <span>Telegram</span>
              <b>{customer.telegram ?? "—"}</b>
            </div>
            <div className="summary-line">
              <span>Город</span>
              <b>{customer.customerProfile?.city ?? "—"}</b>
            </div>
            <div className="summary-line">
              <span>Страна</span>
              <b>{customer.customerProfile?.country ?? "—"}</b>
            </div>
            <div className="summary-line">
              <span>Адрес</span>
              <b>{customer.customerProfile?.addressLine1 ?? "—"}</b>
            </div>
          </div>
        </article>

        <article className="admin-card">
          <div className="admin-section-head">
            <h2>Заметки менеджера</h2>
            <p>Внутренняя заметка по клиенту.</p>
          </div>
          <form className="admin-form-grid" action={updateCustomerNotesAction}>
            <input type="hidden" name="userId" value={customer.id} />
            <label className="admin-field full">
              <span>Заметка</span>
              <textarea
                className="admin-textarea"
                name="adminNotes"
                defaultValue={customer.customerProfile?.adminNotes ?? ""}
              />
            </label>
            <SubmitButton className="btn btn-primary" pendingLabel="Сохранение...">
              Сохранить заметку
            </SubmitButton>
          </form>
        </article>
      </div>

      <div className="admin-detail-grid">
        <article className="admin-card">
          <div className="admin-section-head">
            <h2>Заказы</h2>
            <p>Последние заказы клиента.</p>
          </div>
          <div className="admin-side-list">
            {customer.customerOrders.map((order) => (
              <Link key={order.id} className="admin-card" href={`/admin/orders/${order.id}`}>
                <strong>{order.orderNumber}</strong>
                <span>{formatAdminDate(order.createdAt)}</span>
              </Link>
            ))}
          </div>
        </article>

        <article className="admin-card">
          <div className="admin-section-head">
            <h2>Заявки и PDF</h2>
            <p>История обращений и приватных вложений.</p>
          </div>
          <div className="admin-side-list">
            {customer.customerRequests.map((request) => (
              <Link key={request.id} className="admin-card" href={`/admin/requests/${request.id}`}>
                <strong>{request.requestNumber}</strong>
                <span>{formatAdminDate(request.createdAt)}</span>
              </Link>
            ))}
            {customer.customerFiles.map((file) => (
              <a key={file.id} className="btn btn-ghost btn-small" href={`/admin/files/${file.id}`}>
                {file.originalName}
              </a>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}
