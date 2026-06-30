import { saveSettingsAction, seedSettingsAction } from "@/app/admin/actions";
import { AdminNotice } from "@/components/admin/admin-notice";
import { DirtyForm } from "@/components/admin/dirty-form";
import { SubmitButton } from "@/components/admin/submit-button";
import { getSiteSettings } from "@/lib/admin/settings";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminLocaleFromCookies } from "@/lib/i18n/admin/detect-locale";
import { getAdminDictionary } from "@/lib/i18n/admin/get-admin-dictionary";

export default async function AdminSettingsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin("/admin/settings");
  const locale = await getAdminLocaleFromCookies();
  const dict = await getAdminDictionary(locale);
  const t = dict.settings;
  const f = t.fields;
  const params = await searchParams;
  const settings = await getSiteSettings();

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-title">
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p>{t.description}</p>
        </div>
        <form action={seedSettingsAction}>
          <input type="hidden" name="adminLocale" value={locale} />
          <SubmitButton className="btn btn-ghost btn-small">{t.reseed}</SubmitButton>
        </form>
      </div>
      <AdminNotice
        success={typeof params.success === "string" ? params.success : undefined}
        error={typeof params.error === "string" ? params.error : undefined}
      />
      <DirtyForm action={saveSettingsAction} className="admin-form-grid">
        <input type="hidden" name="adminLocale" value={locale} />
        <label><span>{f.telegram}</span><input className="admin-input" name="contacts.telegram" defaultValue={settings.contacts.telegram} /></label>
        <label><span>{f.vk}</span><input className="admin-input" name="contacts.vk" defaultValue={settings.contacts.vk} /></label>
        <label><span>{f.phone}</span><input className="admin-input" name="contacts.phone" defaultValue={settings.contacts.phone} /></label>
        <label><span>{f.email}</span><input className="admin-input" name="contacts.email" defaultValue={settings.contacts.email} /></label>
        <label><span>{f.responseHours}</span><input className="admin-input" name="contacts.responseHours" defaultValue={settings.contacts.responseHours} /></label>
        <label><span>{f.workFormat}</span><input className="admin-input" name="contacts.workFormat" defaultValue={settings.contacts.workFormat} /></label>
        <label><span>{f.seoTitle}</span><input className="admin-input" name="seo.defaultTitle" defaultValue={settings.seo.defaultTitle} /></label>
        <label><span>{f.seoTemplate}</span><input className="admin-input" name="seo.titleTemplate" defaultValue={settings.seo.titleTemplate} /></label>
        <label className="full"><span>{f.seoDescription}</span><textarea className="admin-textarea" name="seo.defaultDescription" defaultValue={settings.seo.defaultDescription} /></label>
        <label className="full"><span>{f.seoKeywords}</span><textarea className="admin-textarea" name="seo.keywords" defaultValue={settings.seo.keywords} /></label>
        <label><span>{f.heroEyebrow}</span><input className="admin-input" name="homepage.eyebrow" defaultValue={settings.homepage.eyebrow} /></label>
        <label><span>{f.heroTitle}</span><input className="admin-input" name="homepage.title" defaultValue={settings.homepage.title} /></label>
        <label className="full"><span>{f.heroLead}</span><textarea className="admin-textarea" name="homepage.lead" defaultValue={settings.homepage.lead} /></label>
        <label className="full"><span>{f.heroDescription}</span><textarea className="admin-textarea" name="homepage.description" defaultValue={settings.homepage.description} /></label>
        <label><span>{f.primaryCta}</span><input className="admin-input" name="homepage.primaryLabel" defaultValue={settings.homepage.primaryLabel} /></label>
        <label><span>{f.secondaryCta}</span><input className="admin-input" name="homepage.secondaryLabel" defaultValue={settings.homepage.secondaryLabel} /></label>
        <label><span>{f.telegramCta}</span><input className="admin-input" name="homepage.telegramLabel" defaultValue={settings.homepage.telegramLabel} /></label>
        <label className="full"><span>{f.footerDescription}</span><textarea className="admin-textarea" name="footer.description" defaultValue={settings.footer.description} /></label>
        <label className="full"><span>{f.footerDisclaimer}</span><textarea className="admin-textarea" name="footer.disclaimer" defaultValue={settings.footer.disclaimer} /></label>
        <label><span>{f.copyright}</span><input className="admin-input" name="footer.copyright" defaultValue={settings.footer.copyright} /></label>
        <label><span>{f.telegramUrl}</span><input className="admin-input" name="socialLinks.telegram" defaultValue={settings.socialLinks.telegram} /></label>
        <label><span>{f.vkUrl}</span><input className="admin-input" name="socialLinks.vk" defaultValue={settings.socialLinks.vk} /></label>
        <label><span>{f.instagramUrl}</span><input className="admin-input" name="socialLinks.instagram" defaultValue={settings.socialLinks.instagram} /></label>
        <label><span>{f.youtubeUrl}</span><input className="admin-input" name="socialLinks.youtube" defaultValue={settings.socialLinks.youtube} /></label>
        <label><span>{f.privacyTitle}</span><input className="admin-input" name="legalPages.privacyTitle" defaultValue={settings.legalPages.privacyTitle} /></label>
        <label className="full"><span>{f.privacyText}</span><textarea className="admin-textarea" name="legalPages.privacyText" defaultValue={settings.legalPages.privacyText} /></label>
        <label><span>{f.offerTitle}</span><input className="admin-input" name="legalPages.offerTitle" defaultValue={settings.legalPages.offerTitle} /></label>
        <label className="full"><span>{f.offerText}</span><textarea className="admin-textarea" name="legalPages.offerText" defaultValue={settings.legalPages.offerText} /></label>
        <label><span>{f.disclaimerTitle}</span><input className="admin-input" name="legalPages.disclaimerTitle" defaultValue={settings.legalPages.disclaimerTitle} /></label>
        <label className="full"><span>{f.disclaimerText}</span><textarea className="admin-textarea" name="legalPages.disclaimerText" defaultValue={settings.legalPages.disclaimerText} /></label>
        <label><span>{f.primaryCurrency}</span><input className="admin-input" name="currencies.primary" defaultValue={settings.currencies.primary} /></label>
        <label><span>{f.secondaryCurrency}</span><input className="admin-input" name="currencies.secondary" defaultValue={settings.currencies.secondary} /></label>
        <div className="full admin-actions-row">
          <SubmitButton className="btn btn-primary" pendingLabel={dict.common.saving}>
            {t.save}
          </SubmitButton>
        </div>
      </DirtyForm>
    </div>
  );
}
