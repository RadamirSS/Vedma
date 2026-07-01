import Link from "next/link";

import { AdminNotice } from "@/components/admin/admin-notice";
import { prisma } from "@/lib/db/prisma";
import { formatAdminDate } from "@/lib/admin/format";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminLocaleFromCookies } from "@/lib/i18n/admin/detect-locale";
import { getAdminDictionary } from "@/lib/i18n/admin/get-admin-dictionary";

export default async function AdminUsersPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin("/admin/users");
  const locale = await getAdminLocaleFromCookies();
  const dict = await getAdminDictionary(locale);
  const t = dict.users;
  const params = await searchParams;
  const users = await prisma.user.findMany({
    orderBy: { updatedAt: "desc" }
  });

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-title">
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p>{t.description}</p>
        </div>
        <Link className="btn btn-primary" href="/admin/users/new">
          {t.new}
        </Link>
      </div>
      <AdminNotice
        success={typeof params.success === "string" ? params.success : undefined}
        error={typeof params.error === "string" ? params.error : undefined}
      />
      <div className="admin-table">
        <table>
          <thead>
            <tr>
              <th>{t.table.name}</th>
              <th>{t.table.email}</th>
              <th>{t.table.role}</th>
              <th>{t.table.status}</th>
              <th>{t.table.lastLogin}</th>
              <th>{t.table.actions}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name ?? dict.common.emDash}</td>
                <td>{user.email}</td>
                <td>{dict.enums.userRoles[user.role as keyof typeof dict.enums.userRoles] ?? user.role}</td>
                <td>{user.isActive ? dict.common.active : dict.common.inactive}</td>
                <td>{formatAdminDate(user.lastLoginAt, locale)}</td>
                <td>
                  <Link className="btn btn-ghost btn-small" href={`/admin/users/${user.id}`}>
                    {dict.common.edit}
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
