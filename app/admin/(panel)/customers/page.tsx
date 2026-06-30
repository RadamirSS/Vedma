import Link from "next/link";

import { formatAdminDate } from "@/lib/admin/format";
import { requireAdminSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getAdminLocaleFromCookies } from "@/lib/i18n/admin/detect-locale";
import { getAdminDictionary } from "@/lib/i18n/admin/get-admin-dictionary";

export default async function AdminCustomersPage() {
  const locale = await getAdminLocaleFromCookies();
  const dict = await getAdminDictionary(locale);
  const t = dict.customers;
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
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p>{t.description}</p>
        </div>
      </div>

      <div className="admin-table">
        <table>
          <thead>
            <tr>
              <th>{t.table.client}</th>
              <th>{t.table.contacts}</th>
              <th>{t.table.orders}</th>
              <th>{t.table.requests}</th>
              <th>{t.table.pdf}</th>
              <th>{t.table.lastLogin}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>
                  <strong>{customer.name ?? dict.common.noName}</strong>
                  <div className="muted">{customer.email}</div>
                </td>
                <td>
                  <div>{customer.phone ?? dict.common.emDash}</div>
                  <div className="muted">{customer.telegram ?? dict.common.emDash}</div>
                </td>
                <td>{customer.customerOrders.length}</td>
                <td>{customer.customerRequests.length}</td>
                <td>{customer.customerFiles.length}</td>
                <td>{formatAdminDate(customer.lastLoginAt, locale)}</td>
                <td>
                  <Link className="btn btn-ghost btn-small" href={`/admin/customers/${customer.id}`}>
                    {dict.common.open}
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
