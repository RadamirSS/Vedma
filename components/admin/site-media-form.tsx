import type { Media } from "@prisma/client";

import { saveSiteMediaSlotsAction } from "@/app/admin/actions";
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
  currentPath
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
        <p className="muted">Изображение не выбрано — используется запасной вариант.</p>
      )}
      <div className="admin-form-grid">
        <label className="admin-field full">
          <span>Загрузить новое изображение</span>
          <input className="admin-input" type="file" name={uploadName} accept="image/jpeg,image/png,image/webp" />
        </label>
        <label className="admin-field full">
          <span>Или выбрать из медиатеки</span>
          <select className="admin-select" name={selectName} defaultValue={currentPath ?? ""}>
            <option value="">Оставить текущее</option>
            {media.map((item) => (
              <option key={item.id} value={item.path}>
                {item.alt || item.filename} ({item.path})
              </option>
            ))}
          </select>
        </label>
        {altName ? (
          <label className="admin-field full">
            <span>Alt-текст</span>
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
  return (
    <form className="admin-form-grid site-media-form" action={readOnly ? undefined : saveSiteMediaSlotsAction}>
      <MediaSlotPicker
        label="Логотип в шапке"
        help="Показывается вместо буквы «Б» в шапке сайта."
        preview={mediaSlots.logoImage}
        uploadName="logo.upload"
        selectName="logo.image"
        altName="logo.alt"
        altValue={mediaSlots.logoAlt}
        media={media}
        currentPath={mediaSlots.logoImage}
      />
      <MediaSlotPicker
        label="Главное фото на первом экране"
        help="Портрет/главный визуал в hero-блоке на главной странице."
        preview={mediaSlots.heroPortrait}
        uploadName="hero.upload"
        selectName="hero.image"
        altName="hero.alt"
        altValue={mediaSlots.heroPortraitAlt}
        media={media}
        currentPath={mediaSlots.heroPortrait}
      />
      {mediaSlots.homeGallery.map((slot, index) => (
        <MediaSlotPicker
          key={slot.label}
          label={slot.label}
          help="Изображение в галерее на главной странице."
          preview={slot.src}
          uploadName={`gallery.${index}.upload`}
          selectName={`gallery.${index}.image`}
          altName={`gallery.${index}.alt`}
          altValue={slot.alt}
          media={media}
          currentPath={slot.src}
        />
      ))}
      {mediaSlots.homeDirections.map((slot) => (
        <MediaSlotPicker
          key={slot.id}
          label={`Направление: ${slot.id}`}
          help="Карточка направления на главной странице."
          preview={slot.image}
          uploadName={`direction.${slot.id}.upload`}
          selectName={`direction.${slot.id}.image`}
          altName={`direction.${slot.id}.alt`}
          altValue={slot.alt}
          media={media}
          currentPath={slot.image}
        />
      ))}
      <MediaSlotPicker
        label="Изображение в подвале"
        help="Необязательный брендовый визуал в footer."
        preview={mediaSlots.footerBrandImage}
        uploadName="footer.upload"
        selectName="footer.image"
        media={media}
        currentPath={mediaSlots.footerBrandImage}
      />
      <MediaSlotPicker
        label="Фото на странице «Обо мне»"
        help="Портрет на странице /about."
        preview={mediaSlots.aboutImage}
        uploadName="about.upload"
        selectName="about.image"
        media={media}
        currentPath={mediaSlots.aboutImage}
      />
      {!readOnly ? (
        <div className="full admin-actions-row">
          <SubmitButton className="btn btn-primary" pendingLabel="Сохранение...">
            Сохранить медиа сайта
          </SubmitButton>
        </div>
      ) : null}
    </form>
  );
}
