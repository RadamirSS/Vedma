import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteProductAction, saveProductAction } from "@/app/admin/actions";
import { AdminReadOnlyNotice } from "@/components/admin/admin-read-only-notice";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { AdminNotice } from "@/components/admin/admin-notice";
import { CatalogEntityForm } from "@/components/admin/catalog-entity-form";
import { formatAdminDate } from "@/lib/admin/format";
import { isReadOnlyAdminRole, requireAdminSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getAdminLocaleFromCookies } from "@/lib/i18n/admin/detect-locale";
import {
  getAvailabilityOptions,
  getProductCategoryOptions,
  getPublicationOptions
} from "@/lib/i18n/admin/constants";
import { getAdminDictionary } from "@/lib/i18n/admin/get-admin-dictionary";

export default async function AdminProductDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getAdminLocaleFromCookies();
  const dict = await getAdminDictionary(locale);
  const t = dict.products.detail;
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
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{product.title}</h1>
          <p>{t.updatedAt.replace("{date}", formatAdminDate(product.updatedAt, locale))}</p>
        </div>
        <div className="admin-actions-row">
          <Link className="btn btn-ghost" href={`/ru/products/${product.slug}`} target="_blank">
            {dict.common.preview}
          </Link>
          <Link className="btn btn-ghost" href="/admin/products">
            {dict.common.backToList}
          </Link>
        </div>
      </div>
      <AdminNotice
        success={typeof query.success === "string" ? query.success : undefined}
        error={typeof query.error === "string" ? query.error : undefined}
      />
      {isReadOnly ? <AdminReadOnlyNotice text={dict.demoMode.products} /> : null}
      <div className="admin-detail-grid">
        <CatalogEntityForm
          entity="product"
          action={saveProductAction}
          cancelHref="/admin/products"
          previewHref={`/products/${product.slug}`}
          readOnly={isReadOnly}
          media={media}
          categoryOptions={getProductCategoryOptions(dict)}
          publicationOptions={getPublicationOptions(dict)}
          availabilityOptions={getAvailabilityOptions(dict)}
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
              <h2>{dict.common.dangerousZone}</h2>
              <p>{t.dangerousZoneDescription}</p>
            </div>
            <form action={deleteProductAction}>
              <input type="hidden" name="id" value={product.id} />
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
