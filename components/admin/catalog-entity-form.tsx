"use client";

import type { AvailabilityStatus, Currency, PublicationStatus } from "@prisma/client";
import { useMemo, useState } from "react";

import { useAdminI18n } from "@/components/admin/admin-i18n-provider";
import { DirtyForm } from "@/components/admin/dirty-form";
import { SubmitButton } from "@/components/admin/submit-button";

type MediaOption = {
  id: string;
  path: string;
  alt: string | null;
};

type CategoryOption = {
  value: string;
  label: string;
};

type Props = {
  entity: "product" | "service";
  action: (formData: FormData) => void | Promise<void>;
  cancelHref: string;
  previewHref?: string | null;
  media: MediaOption[];
  categoryOptions: readonly CategoryOption[];
  publicationOptions: Array<{ value: PublicationStatus; label: string }>;
  availabilityOptions?: Array<{ value: AvailabilityStatus; label: string }>;
  readOnly?: boolean;
  initial?: {
    id?: string;
    title?: string;
    slug?: string;
    category?: string | null;
    shortDescription?: string | null;
    fullDescription?: string | null;
    priceRub?: number | null;
    priceUsd?: number | null;
    priceLabel?: string | null;
    currency?: Currency;
    purpose?: string | null;
    availabilityStatus?: AvailabilityStatus;
    publicationStatus?: PublicationStatus;
    quantity?: number | null;
    image?: string | null;
    gallery?: string[];
    tags?: string[];
    seoTitle?: string | null;
    seoDescription?: string | null;
    format?: string | null;
    duration?: string | null;
    executionTime?: string | null;
  };
};

function formatMediaLabel(item: MediaOption) {
  const label = item.alt?.trim() || item.path.split("/").pop() || item.path;
  return label.length > 48 ? `${label.slice(0, 45)}...` : label;
}

export function CatalogEntityForm({
  entity,
  action,
  cancelHref,
  previewHref,
  media,
  categoryOptions,
  publicationOptions,
  availabilityOptions,
  readOnly = false,
  initial
}: Props) {
  const { locale, dict } = useAdminI18n();
  const t = dict.forms.catalogEntity;
  const [selectedImage, setSelectedImage] = useState(initial?.image ?? "");
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);

  const previewSrc = useMemo(() => {
    if (uploadPreview) {
      return uploadPreview;
    }
    return selectedImage || initial?.image || null;
  }, [initial?.image, selectedImage, uploadPreview]);

  return (
    <DirtyForm action={action} className="admin-form-grid" disabled={readOnly}>
      <input type="hidden" name="adminLocale" value={locale} />
      {initial?.id ? <input type="hidden" name="id" value={initial.id} /> : null}

      <label>
        <span>{t.title}</span>
        <input className="admin-input" name="title" required defaultValue={initial?.title ?? ""} />
      </label>

      <label>
        <span>{t.slug}</span>
        <input className="admin-input" name="slug" defaultValue={initial?.slug ?? ""} />
      </label>

      <label>
        <span>{t.category}</span>
        <select className="admin-select" name="category" defaultValue={initial?.category ?? ""}>
          <option value="">{t.selectCategory}</option>
          {categoryOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>{t.publicationStatus}</span>
        <select
          className="admin-select"
          name="publicationStatus"
          defaultValue={initial?.publicationStatus ?? "DRAFT"}
        >
          {publicationOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {entity === "product" && availabilityOptions ? (
        <>
          <label>
            <span>{t.availability}</span>
            <select
              className="admin-select"
              name="availabilityStatus"
              defaultValue={initial?.availabilityStatus ?? "UNKNOWN"}
            >
              {availabilityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{t.quantity}</span>
            <input
              className="admin-input"
              name="quantity"
              type="number"
              min={0}
              defaultValue={initial?.quantity ?? ""}
            />
          </label>
        </>
      ) : null}

      {entity === "service" ? (
        <>
          <label>
            <span>{t.format}</span>
            <input className="admin-input" name="format" defaultValue={initial?.format ?? ""} />
          </label>
          <label>
            <span>{t.duration}</span>
            <input
              className="admin-input"
              name="duration"
              defaultValue={initial?.duration ?? ""}
            />
          </label>
          <label>
            <span>{t.executionTime}</span>
            <input
              className="admin-input"
              name="executionTime"
              defaultValue={initial?.executionTime ?? ""}
            />
          </label>
        </>
      ) : (
        <label>
          <span>{t.purpose}</span>
          <input className="admin-input" name="purpose" defaultValue={initial?.purpose ?? ""} />
        </label>
      )}

      <label>
        <span>{t.priceRub}</span>
        <input
          className="admin-input"
          name="priceRub"
          type="number"
          min={0}
          defaultValue={initial?.priceRub ?? ""}
        />
      </label>

      <label>
        <span>{t.priceUsd}</span>
        <input
          className="admin-input"
          name="priceUsd"
          type="number"
          min={0}
          defaultValue={initial?.priceUsd ?? ""}
        />
      </label>

      <label>
        <span>{t.priceLabel}</span>
        <input
          className="admin-input"
          name="priceLabel"
          defaultValue={initial?.priceLabel ?? ""}
        />
      </label>

      <label>
        <span>{t.currency}</span>
        <select className="admin-select" name="currency" defaultValue={initial?.currency ?? "RUB"}>
          <option value="RUB">RUB</option>
          <option value="USD">USD</option>
        </select>
      </label>

      <label className="full">
        <span>{t.shortDescription}</span>
        <textarea
          className="admin-textarea"
          name="shortDescription"
          defaultValue={initial?.shortDescription ?? ""}
        />
      </label>

      <label className="full">
        <span>{t.fullDescription}</span>
        <textarea
          className="admin-textarea"
          name="fullDescription"
          defaultValue={initial?.fullDescription ?? ""}
        />
      </label>

      <div className="full admin-image-section">
        <label>
          <span>{t.uploadMainImage}</span>
          <input
            className="admin-input"
            name="mainImageUpload"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) {
                setUploadPreview(null);
                return;
              }
              setUploadPreview(URL.createObjectURL(file));
            }}
          />
          <small className="muted">{t.uploadMainImageHint}</small>
        </label>

        <label>
          <span>{t.selectFromLibrary}</span>
          <select
            className="admin-select"
            name="image"
            value={selectedImage}
            onChange={(event) => {
              setSelectedImage(event.target.value);
              setUploadPreview(null);
            }}
          >
            <option value="">{t.noImage}</option>
            {media.map((item) => (
              <option key={item.id} value={item.path}>
                {formatMediaLabel(item)}
              </option>
            ))}
          </select>
        </label>

        {previewSrc ? (
          <div className="admin-image-preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewSrc} alt={t.mainImagePreviewAlt} />
          </div>
        ) : null}
      </div>

      <label className="full">
        <span>{t.gallery}</span>
        <textarea
          className="admin-textarea"
          name="gallery"
          defaultValue={(initial?.gallery ?? []).join("\n")}
          placeholder={t.galleryPlaceholder}
        />
      </label>

      <label className="full">
        <span>{t.tags}</span>
        <textarea
          className="admin-textarea"
          name="tags"
          defaultValue={(initial?.tags ?? []).join("\n")}
          placeholder={t.tagsPlaceholder}
        />
      </label>

      <label>
        <span>{t.seoTitle}</span>
        <input className="admin-input" name="seoTitle" defaultValue={initial?.seoTitle ?? ""} />
      </label>

      <label>
        <span>{t.seoDescription}</span>
        <textarea
          className="admin-textarea"
          name="seoDescription"
          defaultValue={initial?.seoDescription ?? ""}
        />
      </label>

      <div className="full admin-actions-row">
        {!readOnly ? (
          <SubmitButton className="btn btn-primary" pendingLabel={t.saving}>
            {t.save}
          </SubmitButton>
        ) : null}
        <a className="btn btn-ghost" href={cancelHref}>
          {readOnly ? t.backToList : t.cancel}
        </a>
        {previewHref ? (
          <a className="btn btn-ghost" href={previewHref} target="_blank" rel="noreferrer">
            {t.openOnSite}
          </a>
        ) : null}
      </div>
    </DirtyForm>
  );
}
