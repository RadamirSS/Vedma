import Link from "next/link";

import { AdminReadOnlyNotice } from "@/components/admin/admin-read-only-notice";
import { requireAdminSession } from "@/lib/auth/session";
import { isReadOnlyAdminRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { formatAdminDate } from "@/lib/admin/format";

export default async function AdminDashboardPage() {
  const session = await requireAdminSession("/admin/dashboard");
  const isReadOnly = isReadOnlyAdminRole(session.user.role);
  const [products, services, media, orders, requests, payments, recentProducts, recentServices] =
    await Promise.all([
      prisma.product.count(),
      prisma.service.count(),
      prisma.media.count(),
      prisma.order.count(),
      prisma.request.count(),
      prisma.payment.count(),
      prisma.product.findMany({ orderBy: { updatedAt: "desc" }, take: 5 }),
      prisma.service.findMany({ orderBy: { updatedAt: "desc" }, take: 5 })
    ]);

  const recentUpdates = [...recentProducts, ...recentServices]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 8);

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-title">
          <span className="eyebrow">Панель управления</span>
          <h1>Production CMS</h1>
          <p>Каталог, медиа, отзывы, настройки и пользователи управляются из живой базы данных.</p>
        </div>
        {!isReadOnly ? (
          <div className="admin-actions-row">
            <Link className="btn btn-primary" href="/admin/products/new">
              Добавить товар
            </Link>
            <Link className="btn btn-ghost" href="/admin/services/new">
              Добавить услугу
            </Link>
          </div>
        ) : null}
      </div>

      {isReadOnly ? <AdminReadOnlyNotice /> : null}

      <section className="admin-stats">
        {[
          ["Товары", products],
          ["Услуги", services],
          ["Медиа", media],
          ["Заказы", orders],
          ["Заявки", requests],
          ["Платежи", payments]
        ].map(([label, value]) => (
          <article key={label} className="admin-stat">
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </section>

      <section className="admin-detail-grid">
        <article>
          <div className="admin-section-head">
            <h2>Быстрые действия</h2>
            <p>Переход к основным рабочим разделам каталога.</p>
          </div>
          <div className="admin-grid">
            {!isReadOnly ? (
              <Link className="admin-card" href="/admin/products/new">
                <h3>Новый товар</h3>
                <p>Добавить карточку товара и сразу опубликовать или сохранить как черновик.</p>
              </Link>
            ) : null}
            {!isReadOnly ? (
              <Link className="admin-card" href="/admin/services/new">
                <h3>Новая услуга</h3>
                <p>Создать новый формат работы, цену и SEO-данные.</p>
              </Link>
            ) : null}
            <Link className="admin-card" href="/admin/media">
              <h3>Медиа</h3>
              <p>Загрузить, переиспользовать или заменить изображения.</p>
            </Link>
            {session.user.role === "ADMIN" ? (
              <Link className="admin-card" href="/admin/settings">
                <h3>Настройки</h3>
                <p>Обновить контакты, SEO и юридические тексты сайта.</p>
              </Link>
            ) : null}
          </div>
        </article>

        <aside>
          <div className="admin-section-head">
            <h2>Последние обновления</h2>
            <p>Свежие изменения в товарах и услугах.</p>
          </div>
          <div className="admin-side-list">
            {recentUpdates.map((item) => (
              <div key={item.id} className="admin-card">
                <strong>{item.title}</strong>
                <span>{formatAdminDate(item.updatedAt)}</span>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
