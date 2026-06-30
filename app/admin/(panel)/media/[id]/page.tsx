import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteMediaAction, updateMediaAction } from "@/app/admin/actions";
import { AdminReadOnlyNotice } from "@/components/admin/admin-read-only-notice";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { AdminNotice } from "@/components/admin/admin-notice";
import { DirtyForm } from "@/components/admin/dirty-form";
import { SubmitButton } from "@/components/admin/submit-button";
import { isReadOnlyAdminRole, requireAdminSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getAdminLocaleFromCookies } from "@/lib/i18n/admin/detect-locale";
import { getAdminDictionary } from "@/lib/i18n/admin/get-admin-dictionary";

export default async function AdminMediaDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getAdminLocaleFromCookies();
  const dict = await getAdminDictionary(locale);
  const t = dict.media.detail;
  const { id } = await params;
  const query = await searchParams;
  const session = await requireAdminSession(`/admin/media/${id}`);
  const isReadOnly = isReadOnlyAdminRole(session.user.role);
  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) notFound();

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-title">
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{media.filename}</h1>
        </div>
        <Link className="btn btn-ghost" href="/admin/media">
          {dict.media.site.backToLibrary}
        </Link>
      </div>
      <AdminNotice
        success={typeof query.success === "string" ? query.success : undefined}
        error={typeof query.error === "string" ? query.error : undefined}
      />
      {isReadOnly ? <AdminReadOnlyNotice text={t.demoMetadata} /> : null}
      <div className="admin-detail-grid">
        <DirtyForm action={updateMediaAction} className="admin-form-grid" disabled={isReadOnly}>
          <input type="hidden" name="id" value={media.id} />
          <input type="hidden" name="adminLocale" value={locale} />
          <label className="full">
            <span>{dict.common.preview}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="admin-thumb" src={media.path} alt={media.alt ?? ""} />
          </label>
          <label>
            <span>{dict.media.altText}</span>
            <input className="admin-input" name="alt" defaultValue={media.alt ?? ""} />
          </label>
          <label>
            <span>{t.sourceUrl}</span>
            <input className="admin-input" name="sourceUrl" defaultValue={media.sourceUrl ?? ""} />
          </label>
          <label className="full">
            <span>{t.replaceFile}</span>
            <input className="admin-input" type="file" name="replacement" accept="image/jpeg,image/png,image/webp" />
          </label>
          <div className="full admin-actions-row">
            {!isReadOnly ? (
              <SubmitButton className="btn btn-primary" pendingLabel={dict.common.saving}>
                {dict.common.save}
              </SubmitButton>
            ) : null}
            <a className="btn btn-ghost" href={media.path} target="_blank" rel="noreferrer">
              {t.openFile}
            </a>
          </div>
        </DirtyForm>
        {!isReadOnly ? (
          <aside>
            <form action={deleteMediaAction}>
              <input type="hidden" name="id" value={media.id} />
              <input type="hidden" name="adminLocale" value={locale} />
              <ConfirmSubmitButton className="btn btn-wine" message={t.deleteConfirmLinked}>
                {t.delete}
              </ConfirmSubmitButton>
            </form>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
