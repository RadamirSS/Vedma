import Link from "next/link";

import { formatAdminDate } from "@/lib/admin/format";
import { requireAdminSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export default async function AdminCustomersPage() {
  const session = await requireAdminSession("/admin/customers");
  const isDemo = session.user.role === "DEMO";

  const customers = await prisma.user.findMany({
    where: isDemo
      ? {
          role: "CUSTOMER",
          OR: [
            { customerOrders: { some: { isTest: true } } },
            { customerRequests: { some: { isTest: true } } }
          ]
        }
      : {
          role: "CUSTOMER",
          OR: [
            { customerOrders: { some: { isTest: false } } },
            { customerRequests: { some: { isTest: false } } },
            { customerOrders: { none: {} }, customerRequests: { none: {} } }
          ]
        },
    include: {
      customerProfile: true,
      customerOrders: {
        where: isDemo ? { isTest: true } : { isTest: false }
      },
      customerRequests: {
        where: isDemo ? { isTest: true } : { isTest: false }
      },
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
          <p>Аккаунты создаются в checkout или через регистрацию и используют ту же систему сессий.</p>
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
