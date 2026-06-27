import Link from "next/link";

import { bulkServicesAction } from "@/app/admin/actions";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminNotice } from "@/components/admin/admin-notice";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { SubmitButton } from "@/components/admin/submit-button";
import { buildPagination, formatAdminDate, parseSearchParam } from "@/lib/admin/format";
import { formatPrice } from "@/lib/utils";
import { prisma } from "@/lib/db/prisma";

const PAGE_SIZE = 12;

export default async function AdminServicesPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = parseSearchParam(params.q);
  const status = parseSearchParam(params.status);
  const sort = parseSearchParam(params.sort, "updatedAt-desc");
  const page = Number.parseInt(parseSearchParam(params.page, "1"), 10) || 1;
  const success = typeof params.success === "string" ? params.success : undefined;
  const error = typeof params.error === "string" ? params.error : undefined;
  const query = new URLSearchParams();
  if (q) query.set("q", q);
  if (status) query.set("status", status);
  if (sort) query.set("sort", sort);

  const where = {
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { slug: { contains: q, mode: "insensitive" as const } }
          ]
        }
      : {}),
    ...(status ? { publicationStatus: status as "DRAFT" | "PUBLISHED" | "ARCHIVED" } : {})
  };

  const total = await prisma.service.count({ where });
  const pagination = buildPagination(page, total, PAGE_SIZE);
  const [field, direction] = sort.split("-");
  const items = await prisma.service.findMany({
    where,
    orderBy: { [field || "updatedAt"]: direction === "asc" ? "asc" : "desc" },
    skip: pagination.skip,
    take: pagination.pageSize
  });

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-title">
          <span className="eyebrow">Услуги</span>
          <h1>Управление услугами</h1>
          <p>Редактирование всех текущих форматов работы с поиском, сортировкой и массовыми действиями.</p>
        </div>
        <Link className="btn btn-primary" href="/admin/services/new">
          Новая услуга
        </Link>
      </div>
      <AdminNotice success={success} error={error} />
      <div className="admin-toolbar">
        <form>
          <input className="admin-input" name="q" placeholder="Поиск по названию или slug" defaultValue={q} />
          <select className="admin-select" name="status" defaultValue={status}>
            <option value="">Все статусы</option>
            <option value="DRAFT">Черновик</option>
            <option value="PUBLISHED">Опубликовано</option>
            <option value="ARCHIVED">Скрыто</option>
          </select>
          <select className="admin-select" name="sort" defaultValue={sort}>
            <option value="updatedAt-desc">Сначала обновленные</option>
            <option value="updatedAt-asc">Сначала старые</option>
            <option value="title-asc">Название А-Я</option>
            <option value="title-desc">Название Я-А</option>
            <option value="priceRub-desc">Цена по убыванию</option>
            <option value="priceRub-asc">Цена по возрастанию</option>
          </select>
          <SubmitButton className="btn btn-ghost" pendingLabel="Фильтр...">
            Применить
          </SubmitButton>
        </form>
      </div>

      {items.length === 0 ? (
        <AdminEmptyState
          title="Услуги не найдены"
          text="Измените фильтры или добавьте новую услугу."
          href="/admin/services/new"
          cta="Добавить услугу"
        />
      ) : (
        <form action={bulkServicesAction} className="admin-table">
          <table>
            <thead>
              <tr>
                <th />
                <th>Изображение</th>
                <th>Название</th>
                <th>Категория</th>
                <th>Цена</th>
                <th>Статус</th>
                <th>Обновлено</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <input className="admin-checkbox" type="checkbox" name="ids" value={item.id} />
                  </td>
                  <td>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {item.image ? <img className="admin-thumb" src={item.image} alt="" /> : <span>—</span>}
                  </td>
                  <td>
                    <strong>{item.title}</strong>
                    <div className="muted">{item.slug}</div>
                  </td>
                  <td>{item.normalizedCategory ?? item.category ?? "—"}</td>
                  <td>{item.priceRub ? formatPrice(item.priceRub, "от") : "—"}</td>
                  <td>
                    <span className={`admin-badge admin-badge--${item.publicationStatus.toLowerCase()}`}>
                      {item.publicationStatus}
                    </span>
                  </td>
                  <td>{formatAdminDate(item.updatedAt)}</td>
                  <td>
                    <div className="admin-actions-row">
                      <Link className="btn btn-ghost btn-small" href={`/admin/services/${item.id}`}>
                        Редактировать
                      </Link>
                      <Link className="btn btn-ghost btn-small" href={`/services/${item.slug}`} target="_blank">
                        Preview
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="admin-toolbar">
            <select className="admin-select" name="bulkAction" defaultValue="publish">
              <option value="publish">Опубликовать</option>
              <option value="hide">Скрыть</option>
              <option value="draft">В черновик</option>
            </select>
            <div />
            <div />
            <SubmitButton className="btn btn-primary btn-small" pendingLabel="Применение...">
              Применить к выбранным
            </SubmitButton>
          </div>
        </form>
      )}
      <AdminPagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        basePath="/admin/services"
        query={query}
      />
    </div>
  );
}
