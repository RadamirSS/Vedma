import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteServiceAction, saveServiceAction } from "@/app/admin/actions";
import { AdminReadOnlyNotice } from "@/components/admin/admin-read-only-notice";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { AdminNotice } from "@/components/admin/admin-notice";
import { CatalogEntityForm } from "@/components/admin/catalog-entity-form";
import { formatAdminDate } from "@/lib/admin/format";
import { isReadOnlyAdminRole, requireAdminSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getAdminLocaleFromCookies } from "@/lib/i18n/admin/detect-locale";
import { getServiceCategoryOptions, getPublicationOptions } from "@/lib/i18n/admin/constants";
import { getAdminDictionary } from "@/lib/i18n/admin/get-admin-dictionary";

export default async function AdminServiceDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getAdminLocaleFromCookies();
  const dict = await getAdminDictionary(locale);
  const t = dict.services.detail;
  const { id } = await params;
  const query = await searchParams;
  const session = await requireAdminSession(`/admin/services/${id}`);
  const isReadOnly = isReadOnlyAdminRole(session.user.role);
  const [service, media] = await Promise.all([
    prisma.service.findUnique({ where: { id } }),
    prisma.media.findMany({
      orderBy: { updatedAt: "desc" },
      take: 300,
      select: { id: true, path: true, alt: true }
    })
  ]);

  if (!service) notFound();

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-title">
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{service.title}</h1>
          <p>{t.updatedAt.replace("{date}", formatAdminDate(service.updatedAt, locale))}</p>
        </div>
        <div className="admin-actions-row">
          <Link className="btn btn-ghost" href={`/ru/services/${service.slug}`} target="_blank">
            {dict.common.preview}
          </Link>
          <Link className="btn btn-ghost" href="/admin/services">
            {dict.common.backToList}
          </Link>
        </div>
      </div>
      <AdminNotice
        success={typeof query.success === "string" ? query.success : undefined}
        error={typeof query.error === "string" ? query.error : undefined}
      />
      {isReadOnly ? <AdminReadOnlyNotice text={dict.demoMode.services} /> : null}
      <div className="admin-detail-grid">
        <CatalogEntityForm
          entity="service"
          action={saveServiceAction}
          cancelHref="/admin/services"
          previewHref={`/services/${service.slug}`}
          readOnly={isReadOnly}
          media={media}
          categoryOptions={getServiceCategoryOptions(dict)}
          publicationOptions={getPublicationOptions(dict)}
          initial={{
            ...service,
            image: service.image ?? undefined,
            gallery: Array.isArray(service.gallery) ? service.gallery.filter((v): v is string => typeof v === "string") : [],
            tags: Array.isArray(service.tags) ? service.tags.filter((v): v is string => typeof v === "string") : []
          }}
        />
        {!isReadOnly ? (
          <aside>
            <div className="admin-section-head">
              <h2>{dict.common.dangerousZone}</h2>
              <p>{t.dangerousZoneDescription}</p>
            </div>
            <form action={deleteServiceAction}>
              <input type="hidden" name="id" value={service.id} />
              <input type="hidden" name="adminLocale" value={locale} />
              <ConfirmSubmitButton
                className="btn btn-wine"
                message={t.deleteConfirm}
                pendingLabel={t.deleting}
              >
                {t.delete}
              </ConfirmSubmitButton>
            </form>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
