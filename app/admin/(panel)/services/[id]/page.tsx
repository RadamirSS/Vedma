import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteServiceAction, saveServiceAction } from "@/app/admin/actions";
import { AdminReadOnlyNotice } from "@/components/admin/admin-read-only-notice";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { AdminNotice } from "@/components/admin/admin-notice";
import { CatalogEntityForm } from "@/components/admin/catalog-entity-form";
import { PUBLICATION_OPTIONS, SERVICE_CATEGORY_OPTIONS } from "@/lib/admin/constants";
import { formatAdminDate } from "@/lib/admin/format";
import { isReadOnlyAdminRole, requireAdminSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export default async function AdminServiceDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
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
          <span className="eyebrow">Редактирование услуги</span>
          <h1>{service.title}</h1>
          <p>Обновлено {formatAdminDate(service.updatedAt)}</p>
        </div>
        <div className="admin-actions-row">
          <Link className="btn btn-ghost" href={`/ru/services/${service.slug}`} target="_blank">
            Preview
          </Link>
          <Link className="btn btn-ghost" href="/admin/services">
            К списку
          </Link>
        </div>
      </div>
      <AdminNotice
        success={typeof query.success === "string" ? query.success : undefined}
        error={typeof query.error === "string" ? query.error : undefined}
      />
      {isReadOnly ? <AdminReadOnlyNotice text="Демо-аккаунт может просматривать карточки услуг, но не может менять, публиковать или удалять их." /> : null}
      <div className="admin-detail-grid">
        <CatalogEntityForm
          entity="service"
          action={saveServiceAction}
          cancelHref="/admin/services"
          previewHref={`/services/${service.slug}`}
          readOnly={isReadOnly}
          media={media}
          categoryOptions={SERVICE_CATEGORY_OPTIONS}
          publicationOptions={PUBLICATION_OPTIONS}
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
              <h2>Опасная зона</h2>
              <p>Удаление отвязывает связанные медиа и убирает услугу из публичного каталога.</p>
            </div>
            <form action={deleteServiceAction}>
              <input type="hidden" name="id" value={service.id} />
              <ConfirmSubmitButton
                className="btn btn-wine"
                message="Удалить услугу? Это действие нельзя отменить."
                pendingLabel="Удаление..."
              >
                Удалить услугу
              </ConfirmSubmitButton>
            </form>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
