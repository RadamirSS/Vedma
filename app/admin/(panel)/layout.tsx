import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminSession } from "@/lib/auth/session";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminSession("/admin/dashboard");

  return (
    <AdminShell
      role={session.user.role}
      userName={session.user.name}
      email={session.user.email}
    >
      {children}
    </AdminShell>
  );
}
