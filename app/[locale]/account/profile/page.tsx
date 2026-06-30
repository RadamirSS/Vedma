import { AccountShell } from "@/components/account/account-shell";
import { AdminNotice } from "@/components/admin/admin-notice";
import { SubmitButton } from "@/components/admin/submit-button";
import { updateCustomerProfileAction } from "@/lib/actions/customer";
import { requireCustomerSession } from "@/lib/auth/session";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizeHref } from "@/lib/i18n/routing";
import { prisma } from "@/lib/db/prisma";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AccountProfilePage({ params, searchParams }: PageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);

  const session = await requireCustomerSession(localizeHref(locale, "/account/profile"));
  const routeParams = await searchParams;
  const profile = await prisma.customerProfile.findUnique({
    where: { userId: session.user.id }
  });
  const success = typeof routeParams.success === "string" ? routeParams.success : undefined;

  return (
    <AccountShell
      title={dict.account.profilePageTitle}
      description={dict.account.profileDescription}
      user={session.user}
      activeHref="/account/profile"
      locale={locale}
      dict={dict}
    >
      <div className="form-card">
        <AdminNotice success={success} />
        <form className="account-form" action={updateCustomerProfileAction}>
          <input type="hidden" name="locale" value={locale} />
          <div className="form-grid">
            <label className="field">
              <span>{dict.account.name}</span>
              <input name="name" defaultValue={session.user.name ?? ""} />
            </label>
            <label className="field">
              <span>{dict.account.email}</span>
              <input value={session.user.email} disabled />
              <small className="muted">{dict.account.emailHint}</small>
            </label>
            <label className="field">
              <span>{dict.account.phone}</span>
              <input name="phone" defaultValue={session.user.phone ?? ""} />
            </label>
            <label className="field">
              <span>{dict.account.telegram}</span>
              <input name="telegram" defaultValue={session.user.telegram ?? ""} />
            </label>
            <label className="field">
              <span>{dict.account.city}</span>
              <input name="city" defaultValue={profile?.city ?? ""} />
            </label>
            <label className="field">
              <span>{dict.account.country}</span>
              <input name="country" defaultValue={profile?.country ?? ""} />
            </label>
            <label className="field full">
              <span>{dict.account.address}</span>
              <input name="addressLine1" defaultValue={profile?.addressLine1 ?? ""} />
            </label>
            <label className="field">
              <span>{dict.account.addressLine2}</span>
              <input name="addressLine2" defaultValue={profile?.addressLine2 ?? ""} />
            </label>
            <label className="field">
              <span>{dict.account.postalCode}</span>
              <input name="postalCode" defaultValue={profile?.postalCode ?? ""} />
            </label>
          </div>
          <div className="stack-top">
            <SubmitButton className="btn btn-primary" pendingLabel={dict.account.savingProfile}>
              {dict.account.saveProfileButton}
            </SubmitButton>
          </div>
        </form>
      </div>
    </AccountShell>
  );
}
