import { saveSettingsAction, seedSettingsAction } from "@/app/admin/actions";
import { AdminNotice } from "@/components/admin/admin-notice";
import { DirtyForm } from "@/components/admin/dirty-form";
import { SubmitButton } from "@/components/admin/submit-button";
import { getSiteSettings } from "@/lib/admin/settings";
import { requireAdmin } from "@/lib/auth/session";

export default async function AdminSettingsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin("/admin/settings");
  const params = await searchParams;
  const settings = await getSiteSettings();

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-title">
          <span className="eyebrow">Настройки сайта</span>
          <h1>Управление текстами и SEO</h1>
          <p>Все значения хранятся в `SiteSetting` и отражаются на публичных страницах без смены URL.</p>
        </div>
        <form action={seedSettingsAction}>
          <SubmitButton className="btn btn-ghost btn-small">Переинициализировать базу</SubmitButton>
        </form>
      </div>
      <AdminNotice
        success={typeof params.success === "string" ? params.success : undefined}
        error={typeof params.error === "string" ? params.error : undefined}
      />
      <DirtyForm action={saveSettingsAction} className="admin-form-grid">
        <label><span>Telegram</span><input className="admin-input" name="contacts.telegram" defaultValue={settings.contacts.telegram} /></label>
        <label><span>VK</span><input className="admin-input" name="contacts.vk" defaultValue={settings.contacts.vk} /></label>
        <label><span>Телефон</span><input className="admin-input" name="contacts.phone" defaultValue={settings.contacts.phone} /></label>
        <label><span>Email</span><input className="admin-input" name="contacts.email" defaultValue={settings.contacts.email} /></label>
        <label><span>График ответа</span><input className="admin-input" name="contacts.responseHours" defaultValue={settings.contacts.responseHours} /></label>
        <label><span>Формат работы</span><input className="admin-input" name="contacts.workFormat" defaultValue={settings.contacts.workFormat} /></label>
        <label><span>SEO title</span><input className="admin-input" name="seo.defaultTitle" defaultValue={settings.seo.defaultTitle} /></label>
        <label><span>SEO template</span><input className="admin-input" name="seo.titleTemplate" defaultValue={settings.seo.titleTemplate} /></label>
        <label className="full"><span>SEO description</span><textarea className="admin-textarea" name="seo.defaultDescription" defaultValue={settings.seo.defaultDescription} /></label>
        <label className="full"><span>SEO keywords</span><textarea className="admin-textarea" name="seo.keywords" defaultValue={settings.seo.keywords} /></label>
        <label><span>Hero eyebrow</span><input className="admin-input" name="homepage.eyebrow" defaultValue={settings.homepage.eyebrow} /></label>
        <label><span>Hero title</span><input className="admin-input" name="homepage.title" defaultValue={settings.homepage.title} /></label>
        <label className="full"><span>Hero lead</span><textarea className="admin-textarea" name="homepage.lead" defaultValue={settings.homepage.lead} /></label>
        <label className="full"><span>Hero description</span><textarea className="admin-textarea" name="homepage.description" defaultValue={settings.homepage.description} /></label>
        <label><span>Primary CTA</span><input className="admin-input" name="homepage.primaryLabel" defaultValue={settings.homepage.primaryLabel} /></label>
        <label><span>Secondary CTA</span><input className="admin-input" name="homepage.secondaryLabel" defaultValue={settings.homepage.secondaryLabel} /></label>
        <label><span>Telegram CTA</span><input className="admin-input" name="homepage.telegramLabel" defaultValue={settings.homepage.telegramLabel} /></label>
        <label className="full"><span>Footer description</span><textarea className="admin-textarea" name="footer.description" defaultValue={settings.footer.description} /></label>
        <label className="full"><span>Footer disclaimer</span><textarea className="admin-textarea" name="footer.disclaimer" defaultValue={settings.footer.disclaimer} /></label>
        <label><span>Copyright</span><input className="admin-input" name="footer.copyright" defaultValue={settings.footer.copyright} /></label>
        <label><span>Telegram URL</span><input className="admin-input" name="socialLinks.telegram" defaultValue={settings.socialLinks.telegram} /></label>
        <label><span>VK URL</span><input className="admin-input" name="socialLinks.vk" defaultValue={settings.socialLinks.vk} /></label>
        <label><span>Instagram URL</span><input className="admin-input" name="socialLinks.instagram" defaultValue={settings.socialLinks.instagram} /></label>
        <label><span>YouTube URL</span><input className="admin-input" name="socialLinks.youtube" defaultValue={settings.socialLinks.youtube} /></label>
        <label><span>Privacy title</span><input className="admin-input" name="legalPages.privacyTitle" defaultValue={settings.legalPages.privacyTitle} /></label>
        <label className="full"><span>Privacy text</span><textarea className="admin-textarea" name="legalPages.privacyText" defaultValue={settings.legalPages.privacyText} /></label>
        <label><span>Offer title</span><input className="admin-input" name="legalPages.offerTitle" defaultValue={settings.legalPages.offerTitle} /></label>
        <label className="full"><span>Offer text</span><textarea className="admin-textarea" name="legalPages.offerText" defaultValue={settings.legalPages.offerText} /></label>
        <label><span>Disclaimer title</span><input className="admin-input" name="legalPages.disclaimerTitle" defaultValue={settings.legalPages.disclaimerTitle} /></label>
        <label className="full"><span>Disclaimer text</span><textarea className="admin-textarea" name="legalPages.disclaimerText" defaultValue={settings.legalPages.disclaimerText} /></label>
        <label><span>Основная валюта</span><input className="admin-input" name="currencies.primary" defaultValue={settings.currencies.primary} /></label>
        <label><span>Доп. валюта</span><input className="admin-input" name="currencies.secondary" defaultValue={settings.currencies.secondary} /></label>
        <div className="full admin-actions-row">
          <SubmitButton className="btn btn-primary">Сохранить настройки</SubmitButton>
        </div>
      </DirtyForm>
    </div>
  );
}
