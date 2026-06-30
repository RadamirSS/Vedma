import Link from "next/link";

import { AdminNotice } from "@/components/admin/admin-notice";
import { AdminReadOnlyNotice } from "@/components/admin/admin-read-only-notice";
import { SiteMediaForm } from "@/components/admin/site-media-form";
import { getSiteSettings } from "@/lib/admin/settings";
import { isReadOnlyAdminRole, requireAdminSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getAdminLocaleFromCookies } from "@/lib/i18n/admin/detect-locale";
import { getAdminDictionary } from "@/lib/i18n/admin/get-admin-dictionary";

export default async function AdminSiteMediaPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getAdminLocaleFromCookies();
  const dict = await getAdminDictionary(locale);
  const t = dict.media.site;
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
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p>{t.description}</p>
        </div>
        <Link className="btn btn-ghost" href="/admin/media">
          {t.backToLibrary}
        </Link>
      </div>

      <AdminNotice success={success} error={error} />
      {isReadOnly ? <AdminReadOnlyNotice text={dict.demoMode.siteMedia} /> : null}

      <SiteMediaForm mediaSlots={settings.mediaSlots} media={media} readOnly={isReadOnly} />
    </div>
  );
}
