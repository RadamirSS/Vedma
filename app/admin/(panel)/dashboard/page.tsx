import Link from "next/link";

import { AdminReadOnlyNotice } from "@/components/admin/admin-read-only-notice";
import {
  orderListWhere,
  paymentListWhere,
  requestListWhere
} from "@/lib/admin/commerce-filters";
import { formatAdminDate } from "@/lib/admin/format";
import { requireAdminSession } from "@/lib/auth/session";
import { isReadOnlyAdminRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getAdminLocaleFromCookies } from "@/lib/i18n/admin/detect-locale";
import { getAdminDictionary } from "@/lib/i18n/admin/get-admin-dictionary";

export default async function AdminDashboardPage() {
  const locale = await getAdminLocaleFromCookies();
  const dict = await getAdminDictionary(locale);
  const t = dict.dashboard;
  const session = await requireAdminSession("/admin/dashboard");
  const isReadOnly = isReadOnlyAdminRole(session.user.role);
  const orderWhere = orderListWhere(session.user.role);
  const requestWhere = requestListWhere(session.user.role);
  const paymentWhere = paymentListWhere(session.user.role);

  const [products, services, media, orders, requests, payments, recentProducts, recentServices] =
    await Promise.all([
      prisma.product.count(),
      prisma.service.count(),
      prisma.media.count(),
      prisma.order.count({ where: orderWhere }),
      prisma.request.count({ where: requestWhere }),
      prisma.payment.count({ where: paymentWhere }),
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
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p>{t.description}</p>
        </div>
        {!isReadOnly ? (
          <div className="admin-actions-row">
            <Link className="btn btn-primary" href="/admin/products/new">
              {t.addProduct}
            </Link>
            <Link className="btn btn-ghost" href="/admin/services/new">
              {t.addService}
            </Link>
          </div>
        ) : null}
      </div>

      {isReadOnly ? <AdminReadOnlyNotice /> : null}

      <section className="admin-stats">
        {[
          [t.stats.products, products],
          [t.stats.services, services],
          [t.stats.media, media],
          [t.stats.orders, orders],
          [t.stats.requests, requests],
          [t.stats.payments, payments]
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
            <h2>{t.quickActions.title}</h2>
            <p>{t.quickActions.description}</p>
          </div>
          <div className="admin-grid">
            {!isReadOnly ? (
              <Link className="admin-card" href="/admin/products/new">
                <h3>{t.quickActions.newProduct.title}</h3>
                <p>{t.quickActions.newProduct.description}</p>
              </Link>
            ) : null}
            {!isReadOnly ? (
              <Link className="admin-card" href="/admin/services/new">
                <h3>{t.quickActions.newService.title}</h3>
                <p>{t.quickActions.newService.description}</p>
              </Link>
            ) : null}
            <Link className="admin-card" href="/admin/media">
              <h3>{t.quickActions.media.title}</h3>
              <p>{t.quickActions.media.description}</p>
            </Link>
            {session.user.role === "ADMIN" ? (
              <Link className="admin-card" href="/admin/settings">
                <h3>{t.quickActions.settings.title}</h3>
                <p>{t.quickActions.settings.description}</p>
              </Link>
            ) : null}
          </div>
        </article>

        <aside>
          <div className="admin-section-head">
            <h2>{t.recentUpdates.title}</h2>
            <p>{t.recentUpdates.description}</p>
          </div>
          <div className="admin-side-list">
            {recentUpdates.map((item) => (
              <div key={item.id} className="admin-card">
                <strong>{item.title}</strong>
                <span>{formatAdminDate(item.updatedAt, locale)}</span>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
