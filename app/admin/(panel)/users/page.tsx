import Link from "next/link";

import { AdminNotice } from "@/components/admin/admin-notice";
import { prisma } from "@/lib/db/prisma";
import { formatAdminDate } from "@/lib/admin/format";
import { requireAdmin } from "@/lib/auth/session";

export default async function AdminUsersPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin("/admin/users");
  const params = await searchParams;
  const users = await prisma.user.findMany({
    orderBy: { updatedAt: "desc" }
  });

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-title">
          <span className="eyebrow">Пользователи</span>
          <h1>Управление администраторами</h1>
          <p>Только администратор может создавать менеджеров, редактировать роли и сбрасывать пароли.</p>
        </div>
        <Link className="btn btn-primary" href="/admin/users/new">
          Новый пользователь
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
              <th>Имя</th>
              <th>Email</th>
              <th>Роль</th>
              <th>Статус</th>
              <th>Последний вход</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name ?? "—"}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.isActive ? "Активен" : "Отключен"}</td>
                <td>{formatAdminDate(user.lastLoginAt)}</td>
                <td>
                  <Link className="btn btn-ghost btn-small" href={`/admin/users/${user.id}`}>
                    Редактировать
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
