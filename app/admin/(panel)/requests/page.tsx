import Link from "next/link";

import { AdminNotice } from "@/components/admin/admin-notice";
import { REQUEST_STATUS_LABELS } from "@/lib/admin/constants";
import { formatAdminDate, parseSearchParam } from "@/lib/admin/format";
import { prisma } from "@/lib/db/prisma";

export default async function AdminRequestsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = parseSearchParam(params.q);
  const success = typeof params.success === "string" ? params.success : undefined;
  const error = typeof params.error === "string" ? params.error : undefined;

  const requests = await prisma.request.findMany({
    where: q
      ? {
          OR: [
            { requestNumber: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } }
          ]
        }
      : undefined,
    include: {
      selectedProduct: true,
      selectedService: true,
      responsibleUser: true
    },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-title">
          <span className="eyebrow">Заявки</span>
          <h1>Intake requests</h1>
          <p>Каждый checkout создает отдельную заявку для ручной работы менеджера.</p>
        </div>
      </div>

      <AdminNotice success={success} error={error} />

      <div className="admin-toolbar">
        <form>
          <input className="admin-input" name="q" placeholder="Номер, email или имя" defaultValue={q} />
          <div />
          <div />
          <button className="btn btn-ghost" type="submit">
            Поиск
          </button>
        </form>
      </div>

      <div className="admin-table">
        <table>
          <thead>
            <tr>
              <th>Заявка</th>
              <th>Клиент</th>
              <th>Выбрано</th>
              <th>Статус</th>
              <th>Ответственный</th>
              <th>Создана</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id}>
                <td>
                  <strong>{request.requestNumber}</strong>
                  <div className="muted">{request.email ?? "—"}</div>
                </td>
                <td>{request.name ?? "Без имени"}</td>
                <td>{request.selectedProduct?.title ?? request.selectedService?.title ?? "—"}</td>
                <td>
                  <span className="admin-badge">{REQUEST_STATUS_LABELS[request.status]}</span>
                </td>
                <td>{request.responsibleUser?.name ?? request.responsibleUser?.email ?? "—"}</td>
                <td>{formatAdminDate(request.createdAt)}</td>
                <td>
                  <Link className="btn btn-ghost btn-small" href={`/admin/requests/${request.id}`}>
                    Открыть
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
