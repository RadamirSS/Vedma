import { AVAILABILITY_OPTIONS, PRODUCT_CATEGORY_OPTIONS, PUBLICATION_OPTIONS } from "@/lib/admin/constants";
import { AdminReadOnlyNotice } from "@/components/admin/admin-read-only-notice";
import { CatalogEntityForm } from "@/components/admin/catalog-entity-form";
import { prisma } from "@/lib/db/prisma";
import { saveProductAction } from "@/app/admin/actions";
import { AdminNotice } from "@/components/admin/admin-notice";
import { isReadOnlyAdminRole, requireAdminSession } from "@/lib/auth/session";

export default async function AdminNewProductPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const session = await requireAdminSession("/admin/products/new");
  const isReadOnly = isReadOnlyAdminRole(session.user.role);
  const media = await prisma.media.findMany({
    orderBy: { updatedAt: "desc" },
    take: 300,
    select: { id: true, path: true, alt: true }
  });

  return (
    <div className="admin-page">
      <div className="admin-title">
        <span className="eyebrow">Новый товар</span>
        <h1>Создать товар</h1>
      </div>
      <AdminNotice
        success={typeof params.success === "string" ? params.success : undefined}
        error={typeof params.error === "string" ? params.error : undefined}
      />
      {isReadOnly ? <AdminReadOnlyNotice text="Демо-аккаунт не может создавать товары. Форма открыта только для просмотра структуры." /> : null}
      <CatalogEntityForm
        entity="product"
        action={saveProductAction}
        cancelHref="/admin/products"
        readOnly={isReadOnly}
        media={media}
        categoryOptions={PRODUCT_CATEGORY_OPTIONS}
        publicationOptions={PUBLICATION_OPTIONS}
        availabilityOptions={AVAILABILITY_OPTIONS}
      />
    </div>
  );
}
