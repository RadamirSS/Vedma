import { AccountShell } from "@/components/account/account-shell";
import { AdminNotice } from "@/components/admin/admin-notice";
import { SubmitButton } from "@/components/admin/submit-button";
import { updateCustomerProfileAction } from "@/app/account/actions";
import { requireCustomerSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export default async function AccountProfilePage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireCustomerSession("/account/profile");
  const params = await searchParams;
  const profile = await prisma.customerProfile.findUnique({
    where: { userId: session.user.id }
  });
  const success = typeof params.success === "string" ? params.success : undefined;

  return (
    <AccountShell
      title="Профиль клиента"
      description="Контакты, адрес и данные доставки используются для следующих заказов."
      user={session.user}
      activeHref="/account/profile"
    >
      <div className="form-card">
        <AdminNotice success={success} />
        <form className="account-form" action={updateCustomerProfileAction}>
          <div className="form-grid">
            <label className="field">
              <span>Имя</span>
              <input name="name" defaultValue={session.user.name ?? ""} />
            </label>
            <label className="field">
              <span>Email</span>
              <input value={session.user.email} disabled />
              <small className="muted">
                Email нужен для подтверждения заказа и будущих чеков/уведомлений.
              </small>
            </label>
            <label className="field">
              <span>Телефон</span>
              <input name="phone" defaultValue={session.user.phone ?? ""} />
            </label>
            <label className="field">
              <span>Telegram</span>
              <input name="telegram" defaultValue={session.user.telegram ?? ""} />
            </label>
            <label className="field">
              <span>Город</span>
              <input name="city" defaultValue={profile?.city ?? ""} />
            </label>
            <label className="field">
              <span>Страна</span>
              <input name="country" defaultValue={profile?.country ?? ""} />
            </label>
            <label className="field full">
              <span>Адрес</span>
              <input name="addressLine1" defaultValue={profile?.addressLine1 ?? ""} />
            </label>
            <label className="field">
              <span>Дополнение</span>
              <input name="addressLine2" defaultValue={profile?.addressLine2 ?? ""} />
            </label>
            <label className="field">
              <span>Индекс</span>
              <input name="postalCode" defaultValue={profile?.postalCode ?? ""} />
            </label>
          </div>
          <div className="stack-top">
            <SubmitButton className="btn btn-primary" pendingLabel="Сохраняем...">
              Сохранить профиль
            </SubmitButton>
          </div>
        </form>
      </div>
    </AccountShell>
  );
}
