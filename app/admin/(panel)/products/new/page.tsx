import { AdminReadOnlyNotice } from "@/components/admin/admin-read-only-notice";
import { CatalogEntityForm } from "@/components/admin/catalog-entity-form";
import { prisma } from "@/lib/db/prisma";
import { saveProductAction } from "@/app/admin/actions";
import { AdminNotice } from "@/components/admin/admin-notice";
import { isReadOnlyAdminRole, requireAdminSession } from "@/lib/auth/session";
import { getAdminLocaleFromCookies } from "@/lib/i18n/admin/detect-locale";
import {
  getAvailabilityOptions,
  getProductCategoryOptions,
  getPublicationOptions
} from "@/lib/i18n/admin/constants";
import { getAdminDictionary } from "@/lib/i18n/admin/get-admin-dictionary";

export default async function AdminNewProductPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getAdminLocaleFromCookies();
  const dict = await getAdminDictionary(locale);
  const t = dict.products;
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
        <span className="eyebrow">{t.new}</span>
        <h1>{t.createTitle}</h1>
      </div>
      <AdminNotice
        success={typeof params.success === "string" ? params.success : undefined}
        error={typeof params.error === "string" ? params.error : undefined}
      />
      {isReadOnly ? <AdminReadOnlyNotice text={t.demoNew} /> : null}
      <CatalogEntityForm
        entity="product"
        action={saveProductAction}
        cancelHref="/admin/products"
        readOnly={isReadOnly}
        media={media}
        categoryOptions={getProductCategoryOptions(dict)}
        publicationOptions={getPublicationOptions(dict)}
        availabilityOptions={getAvailabilityOptions(dict)}
      />
    </div>
  );
}
