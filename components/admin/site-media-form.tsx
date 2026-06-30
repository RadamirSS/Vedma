"use client";

"use client";

import type { Media } from "@prisma/client";

import { saveSiteMediaSlotsAction } from "@/app/admin/actions";
import { useAdminI18n } from "@/components/admin/admin-i18n-provider";
import { SubmitButton } from "@/components/admin/submit-button";
import type { SiteMediaSlotsShape } from "@/lib/admin/settings";

function MediaSlotPicker({
  label,
  help,
  preview,
  uploadName,
  selectName,
  altName,
  altValue,
  media,
  currentPath,
  formLabels
}: {
  label: string;
  help: string;
  preview?: string | null;
  uploadName: string;
  selectName: string;
  altName?: string;
  altValue?: string;
  media: Media[];
  currentPath?: string | null;
  formLabels: {
    uploadNew: string;
    selectFromLibrary: string;
    keepCurrent: string;
    altText: string;
    noImageSelected: string;
  };
}) {
  return (
    <article className="admin-card site-media-slot">
      <div className="admin-section-head">
        <h3>{label}</h3>
        <p>{help}</p>
      </div>
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="site-media-preview" src={preview} alt={altValue ?? label} />
      ) : (
        <p className="muted">{formLabels.noImageSelected}</p>
      )}
      <div className="admin-form-grid">
        <label className="admin-field full">
          <span>{formLabels.uploadNew}</span>
          <input className="admin-input" type="file" name={uploadName} accept="image/jpeg,image/png,image/webp" />
        </label>
        <label className="admin-field full">
          <span>{formLabels.selectFromLibrary}</span>
          <select className="admin-select" name={selectName} defaultValue={currentPath ?? ""}>
            <option value="">{formLabels.keepCurrent}</option>
            {media.map((item) => (
              <option key={item.id} value={item.path}>
                {item.alt || item.filename} ({item.path})
              </option>
            ))}
          </select>
        </label>
        {altName ? (
          <label className="admin-field full">
            <span>{formLabels.altText}</span>
            <input className="admin-input" name={altName} defaultValue={altValue ?? ""} />
          </label>
        ) : null}
      </div>
    </article>
  );
}

export function SiteMediaForm({
  mediaSlots,
  media,
  readOnly = false
}: {
  mediaSlots: SiteMediaSlotsShape;
  media: Media[];
  readOnly?: boolean;
}) {
  const { locale, dict } = useAdminI18n();
  const t = dict.forms.siteMedia;

  return (
    <form className="admin-form-grid site-media-form" action={readOnly ? undefined : saveSiteMediaSlotsAction}>
      <input type="hidden" name="adminLocale" value={locale} />
      <MediaSlotPicker
        label={t.logo.label}
        help={t.logo.help}
        preview={mediaSlots.logoImage}
        uploadName="logo.upload"
        selectName="logo.image"
        altName="logo.alt"
        altValue={mediaSlots.logoAlt}
        media={media}
        currentPath={mediaSlots.logoImage}
        formLabels={t}
      />
      <MediaSlotPicker
        label={t.hero.label}
        help={t.hero.help}
        preview={mediaSlots.heroPortrait}
        uploadName="hero.upload"
        selectName="hero.image"
        altName="hero.alt"
        altValue={mediaSlots.heroPortraitAlt}
        media={media}
        currentPath={mediaSlots.heroPortrait}
        formLabels={t}
      />
      {mediaSlots.homeGallery.map((slot, index) => (
        <MediaSlotPicker
          key={slot.label}
          label={slot.label}
          help={t.gallery.help}
          preview={slot.src}
          uploadName={`gallery.${index}.upload`}
          selectName={`gallery.${index}.image`}
          altName={`gallery.${index}.alt`}
          altValue={slot.alt}
          media={media}
          currentPath={slot.src}
          formLabels={t}
        />
      ))}
      {mediaSlots.homeDirections.map((slot) => (
        <MediaSlotPicker
          key={slot.id}
          label={t.direction.label.replace("{id}", slot.id)}
          help={t.direction.help}
          preview={slot.image}
          uploadName={`direction.${slot.id}.upload`}
          selectName={`direction.${slot.id}.image`}
          altName={`direction.${slot.id}.alt`}
          altValue={slot.alt}
          media={media}
          currentPath={slot.image}
          formLabels={t}
        />
      ))}
      <MediaSlotPicker
        label={t.footer.label}
        help={t.footer.help}
        preview={mediaSlots.footerBrandImage}
        uploadName="footer.upload"
        selectName="footer.image"
        media={media}
        currentPath={mediaSlots.footerBrandImage}
        formLabels={t}
      />
      <MediaSlotPicker
        label={t.about.label}
        help={t.about.help}
        preview={mediaSlots.aboutImage}
        uploadName="about.upload"
        selectName="about.image"
        media={media}
        currentPath={mediaSlots.aboutImage}
        formLabels={t}
      />
      {!readOnly ? (
        <div className="full admin-actions-row">
          <SubmitButton className="btn btn-primary" pendingLabel={t.saving}>
            {t.save}
          </SubmitButton>
        </div>
      ) : null}
    </form>
  );
}
