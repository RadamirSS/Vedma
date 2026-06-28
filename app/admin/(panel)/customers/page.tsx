import Link from "next/link";

import { formatAdminDate } from "@/lib/admin/format";
import { prisma } from "@/lib/db/prisma";

export default async function AdminCustomersPage() {
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    include: {
      customerProfile: true,
      customerOrders: true,
      customerRequests: true,
      customerFiles: true
    },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-title">
          <span className="eyebrow">Клиенты</span>
          <h1>Customer accounts</h1>
          <p>Аккаунты создаются прямо в checkout и используют ту же систему сессий, что и админка.</p>
        </div>
      </div>

      <div className="admin-table">
        <table>
          <thead>
            <tr>
              <th>Клиент</th>
              <th>Контакты</th>
              <th>Заказы</th>
              <th>Заявки</th>
              <th>PDF</th>
              <th>Последний вход</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>
                  <strong>{customer.name ?? "Без имени"}</strong>
                  <div className="muted">{customer.email}</div>
                </td>
                <td>
                  <div>{customer.phone ?? "—"}</div>
                  <div className="muted">{customer.telegram ?? "—"}</div>
                </td>
                <td>{customer.customerOrders.length}</td>
                <td>{customer.customerRequests.length}</td>
                <td>{customer.customerFiles.length}</td>
                <td>{formatAdminDate(customer.lastLoginAt)}</td>
                <td>
                  <Link className="btn btn-ghost btn-small" href={`/admin/customers/${customer.id}`}>
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
