"use client";

import type { AvailabilityStatus, Currency, PublicationStatus } from "@prisma/client";

import { DirtyForm } from "@/components/admin/dirty-form";
import { SubmitButton } from "@/components/admin/submit-button";

type MediaOption = {
  id: string;
  path: string;
  alt: string | null;
};

type Props = {
  entity: "product" | "service";
  action: (formData: FormData) => void | Promise<void>;
  cancelHref: string;
  previewHref?: string | null;
  media: MediaOption[];
  categoryOptions: readonly string[];
  publicationOptions: Array<{ value: PublicationStatus; label: string }>;
  availabilityOptions?: Array<{ value: AvailabilityStatus; label: string }>;
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
    sourceUrl?: string | null;
    format?: string | null;
    duration?: string | null;
    executionTime?: string | null;
  };
};

export function CatalogEntityForm({
  entity,
  action,
  cancelHref,
  previewHref,
  media,
  categoryOptions,
  publicationOptions,
  availabilityOptions,
  initial
}: Props) {
  return (
    <DirtyForm action={action} className="admin-form-grid">
      {initial?.id ? <input type="hidden" name="id" value={initial.id} /> : null}

      <label>
        <span>Название</span>
        <input className="admin-input" name="title" required defaultValue={initial?.title ?? ""} />
      </label>

      <label>
        <span>Slug</span>
        <input className="admin-input" name="slug" defaultValue={initial?.slug ?? ""} />
      </label>

      <label>
        <span>Категория</span>
        <select className="admin-select" name="category" defaultValue={initial?.category ?? ""}>
          <option value="">Выберите категорию</option>
          {categoryOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>Статус публикации</span>
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
            <span>Наличие</span>
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
            <span>Количество</span>
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
            <span>Формат</span>
            <input className="admin-input" name="format" defaultValue={initial?.format ?? ""} />
          </label>
          <label>
            <span>Длительность</span>
            <input
              className="admin-input"
              name="duration"
              defaultValue={initial?.duration ?? ""}
            />
          </label>
          <label>
            <span>Срок исполнения</span>
            <input
              className="admin-input"
              name="executionTime"
              defaultValue={initial?.executionTime ?? ""}
            />
          </label>
        </>
      ) : (
        <label>
          <span>Назначение</span>
          <input className="admin-input" name="purpose" defaultValue={initial?.purpose ?? ""} />
        </label>
      )}

      <label>
        <span>Цена RUB</span>
        <input
          className="admin-input"
          name="priceRub"
          type="number"
          min={0}
          defaultValue={initial?.priceRub ?? ""}
        />
      </label>

      <label>
        <span>Цена USD</span>
        <input
          className="admin-input"
          name="priceUsd"
          type="number"
          min={0}
          defaultValue={initial?.priceUsd ?? ""}
        />
      </label>

      <label>
        <span>Подпись цены</span>
        <input
          className="admin-input"
          name="priceLabel"
          defaultValue={initial?.priceLabel ?? ""}
        />
      </label>

      <label>
        <span>Валюта</span>
        <select className="admin-select" name="currency" defaultValue={initial?.currency ?? "RUB"}>
          <option value="RUB">RUB</option>
          <option value="USD">USD</option>
        </select>
      </label>

      <label className="full">
        <span>Короткое описание</span>
        <textarea
          className="admin-textarea"
          name="shortDescription"
          defaultValue={initial?.shortDescription ?? ""}
        />
      </label>

      <label className="full">
        <span>Полное описание</span>
        <textarea
          className="admin-textarea"
          name="fullDescription"
          defaultValue={initial?.fullDescription ?? ""}
        />
      </label>

      <label>
        <span>Главное изображение</span>
        <select className="admin-select" name="image" defaultValue={initial?.image ?? ""}>
          <option value="">Без изображения</option>
          {media.map((item) => (
            <option key={item.id} value={item.path}>
              {item.path}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>Загрузить новое главное изображение</span>
        <input
          className="admin-input"
          name="mainImageUpload"
          type="file"
          accept="image/jpeg,image/png,image/webp"
        />
        <small className="muted">JPG, PNG или WEBP до 10 МБ. Если выбран и файл, и медиа из списка, файл имеет приоритет.</small>
      </label>

      <label>
        <span>Исходный URL</span>
        <input className="admin-input" name="sourceUrl" defaultValue={initial?.sourceUrl ?? ""} />
      </label>

      <label className="full">
        <span>Галерея</span>
        <textarea
          className="admin-textarea"
          name="gallery"
          defaultValue={(initial?.gallery ?? []).join("\n")}
          placeholder="/uploads/... по одной строке"
        />
      </label>

      <label className="full">
        <span>Теги</span>
        <textarea
          className="admin-textarea"
          name="tags"
          defaultValue={(initial?.tags ?? []).join("\n")}
          placeholder="по одному тегу на строку"
        />
      </label>

      <label>
        <span>SEO title</span>
        <input className="admin-input" name="seoTitle" defaultValue={initial?.seoTitle ?? ""} />
      </label>

      <label>
        <span>SEO description</span>
        <textarea
          className="admin-textarea"
          name="seoDescription"
          defaultValue={initial?.seoDescription ?? ""}
        />
      </label>

      <div className="full admin-actions-row">
        <SubmitButton className="btn btn-primary" pendingLabel="Сохранение...">
          Сохранить
        </SubmitButton>
        <a className="btn btn-ghost" href={cancelHref}>
          Отмена
        </a>
        {previewHref ? (
          <a className="btn btn-ghost" href={previewHref} target="_blank" rel="noreferrer">
            Preview
          </a>
        ) : null}
      </div>
    </DirtyForm>
  );
}
