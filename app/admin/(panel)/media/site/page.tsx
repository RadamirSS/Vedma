import Link from "next/link";

import { AdminNotice } from "@/components/admin/admin-notice";
import { AdminReadOnlyNotice } from "@/components/admin/admin-read-only-notice";
import { SiteMediaForm } from "@/components/admin/site-media-form";
import { getSiteSettings } from "@/lib/admin/settings";
import { isReadOnlyAdminRole, requireAdminSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export default async function AdminSiteMediaPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const session = await requireAdminSession("/admin/media/site");
  const isReadOnly = isReadOnlyAdminRole(session.user.role);
  const success = typeof params.success === "string" ? params.success : undefined;
  const error = typeof params.error === "string" ? params.error : undefined;
  const [settings, media] = await Promise.all([
    getSiteSettings(),
    prisma.media.findMany({ orderBy: { updatedAt: "desc" }, take: 200 })
  ]);

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-title">
          <span className="eyebrow">Медиа сайта</span>
          <h1>Медиа сайта</h1>
          <p>Управляйте логотипом, hero-портретом, галереей и изображениями направлений на публичном сайте.</p>
        </div>
        <Link className="btn btn-ghost" href="/admin/media">
          К медиатеке
        </Link>
      </div>

      <AdminNotice success={success} error={error} />
      {isReadOnly ? (
        <AdminReadOnlyNotice text="Демо-аккаунт может просматривать слоты медиа сайта, но не может сохранять изменения." />
      ) : null}

      <SiteMediaForm mediaSlots={settings.mediaSlots} media={media} readOnly={isReadOnly} />
    </div>
  );
}
