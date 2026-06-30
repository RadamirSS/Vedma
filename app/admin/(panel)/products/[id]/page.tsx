import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteProductAction, saveProductAction } from "@/app/admin/actions";
import { AdminReadOnlyNotice } from "@/components/admin/admin-read-only-notice";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { AdminNotice } from "@/components/admin/admin-notice";
import { CatalogEntityForm } from "@/components/admin/catalog-entity-form";
import { AVAILABILITY_OPTIONS, PRODUCT_CATEGORY_OPTIONS, PUBLICATION_OPTIONS } from "@/lib/admin/constants";
import { formatAdminDate } from "@/lib/admin/format";
import { isReadOnlyAdminRole, requireAdminSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export default async function AdminProductDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const session = await requireAdminSession(`/admin/products/${id}`);
  const isReadOnly = isReadOnlyAdminRole(session.user.role);
  const [product, media] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.media.findMany({
      orderBy: { updatedAt: "desc" },
      take: 300,
      select: { id: true, path: true, alt: true }
    })
  ]);

  if (!product) notFound();

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-title">
          <span className="eyebrow">Редактирование товара</span>
          <h1>{product.title}</h1>
          <p>Обновлено {formatAdminDate(product.updatedAt)}</p>
        </div>
        <div className="admin-actions-row">
          <Link className="btn btn-ghost" href={`/ru/products/${product.slug}`} target="_blank">
            Preview
          </Link>
          <Link className="btn btn-ghost" href="/admin/products">
            К списку
          </Link>
        </div>
      </div>
      <AdminNotice
        success={typeof query.success === "string" ? query.success : undefined}
        error={typeof query.error === "string" ? query.error : undefined}
      />
      {isReadOnly ? <AdminReadOnlyNotice text="Демо-аккаунт может просматривать карточки товаров, но не может менять, публиковать или удалять их." /> : null}
      <div className="admin-detail-grid">
        <CatalogEntityForm
          entity="product"
          action={saveProductAction}
          cancelHref="/admin/products"
          previewHref={`/products/${product.slug}`}
          readOnly={isReadOnly}
          media={media}
          categoryOptions={PRODUCT_CATEGORY_OPTIONS}
          publicationOptions={PUBLICATION_OPTIONS}
          availabilityOptions={AVAILABILITY_OPTIONS}
          initial={{
            ...product,
            image: product.image ?? undefined,
            gallery: Array.isArray(product.gallery) ? product.gallery.filter((v): v is string => typeof v === "string") : [],
            tags: Array.isArray(product.tags) ? product.tags.filter((v): v is string => typeof v === "string") : []
          }}
        />
        {!isReadOnly ? (
          <aside>
            <div className="admin-section-head">
              <h2>Опасная зона</h2>
              <p>Удаление не затрагивает саму базу Package 1 и отвязывает медиа от карточки.</p>
            </div>
            <form action={deleteProductAction}>
              <input type="hidden" name="id" value={product.id} />
              <ConfirmSubmitButton
                className="btn btn-wine"
                message="Удалить товар? Это действие нельзя отменить."
                pendingLabel="Удаление..."
              >
                Удалить товар
              </ConfirmSubmitButton>
            </form>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
