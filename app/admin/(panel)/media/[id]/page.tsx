import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteMediaAction, updateMediaAction } from "@/app/admin/actions";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { AdminNotice } from "@/components/admin/admin-notice";
import { DirtyForm } from "@/components/admin/dirty-form";
import { SubmitButton } from "@/components/admin/submit-button";
import { prisma } from "@/lib/db/prisma";

export default async function AdminMediaDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) notFound();

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-title">
          <span className="eyebrow">Редактирование медиа</span>
          <h1>{media.filename}</h1>
        </div>
        <Link className="btn btn-ghost" href="/admin/media">
          К медиатеке
        </Link>
      </div>
      <AdminNotice
        success={typeof query.success === "string" ? query.success : undefined}
        error={typeof query.error === "string" ? query.error : undefined}
      />
      <div className="admin-detail-grid">
        <DirtyForm action={updateMediaAction} className="admin-form-grid">
          <input type="hidden" name="id" value={media.id} />
          <label className="full">
            <span>Preview</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="admin-thumb" src={media.path} alt={media.alt ?? ""} />
          </label>
          <label>
            <span>Alt text</span>
            <input className="admin-input" name="alt" defaultValue={media.alt ?? ""} />
          </label>
          <label>
            <span>Source URL</span>
            <input className="admin-input" name="sourceUrl" defaultValue={media.sourceUrl ?? ""} />
          </label>
          <label className="full">
            <span>Replace file</span>
            <input className="admin-input" type="file" name="replacement" accept="image/jpeg,image/png,image/webp" />
          </label>
          <div className="full admin-actions-row">
            <SubmitButton className="btn btn-primary">Сохранить</SubmitButton>
            <a className="btn btn-ghost" href={media.path} target="_blank" rel="noreferrer">
              Открыть файл
            </a>
          </div>
        </DirtyForm>
        <aside>
          <form action={deleteMediaAction}>
            <input type="hidden" name="id" value={media.id} />
            <ConfirmSubmitButton
              className="btn btn-wine"
              message="Удалить файл из медиатеки? Если он привязан к товару или услуге, удаление будет остановлено."
            >
              Удалить файл
            </ConfirmSubmitButton>
          </form>
        </aside>
      </div>
    </div>
  );
}
