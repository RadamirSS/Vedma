import type { AvailabilityStatus, Currency, PublicationStatus, Role } from "@prisma/client";

import { slugify } from "@/lib/admin/slug";

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; message: string };

function requiredString(value: FormDataEntryValue | null, field: string) {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (!normalized) {
    throw new Error(`Поле «${field}» обязательно.`);
  }
  return normalized;
}

function optionalString(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function optionalInt(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    throw new Error("Числовые поля должны быть неотрицательными.");
  }
  return parsed;
}

function optionalStringArray(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  return value
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parsePublicationStatus(value: FormDataEntryValue | null): PublicationStatus {
  if (value === "DRAFT" || value === "PUBLISHED" || value === "ARCHIVED") {
    return value;
  }
  return "DRAFT";
}

function parseAvailability(value: FormDataEntryValue | null): AvailabilityStatus {
  if (
    value === "IN_STOCK" ||
    value === "ON_REQUEST" ||
    value === "OUT_OF_STOCK" ||
    value === "UNKNOWN"
  ) {
    return value;
  }
  return "UNKNOWN";
}

function parseCurrency(value: FormDataEntryValue | null): Currency {
  if (value === "USD") {
    return "USD";
  }
  return "RUB";
}

export function validateProductForm(formData: FormData): ValidationResult<Record<string, unknown>> {
  try {
    const title = requiredString(formData.get("title"), "Название");
    const slugInput = optionalString(formData.get("slug"));
    const slug = slugInput ? slugify(slugInput) : slugify(title);
    if (!slug) {
      throw new Error("Не удалось сформировать slug.");
    }

    return {
      success: true,
      data: {
        title,
        slug,
        category: optionalString(formData.get("category")),
        normalizedCategory: optionalString(formData.get("category")),
        shortDescription: optionalString(formData.get("shortDescription")),
        fullDescription: optionalString(formData.get("fullDescription")),
        priceRub: optionalInt(formData.get("priceRub")),
        priceUsd: optionalInt(formData.get("priceUsd")),
        priceLabel: optionalString(formData.get("priceLabel")),
        currency: parseCurrency(formData.get("currency")),
        purpose: optionalString(formData.get("purpose")),
        availabilityStatus: parseAvailability(formData.get("availabilityStatus")),
        publicationStatus: parsePublicationStatus(formData.get("publicationStatus")),
        quantity: optionalInt(formData.get("quantity")),
        image: optionalString(formData.get("image")),
        gallery: optionalStringArray(formData.get("gallery")),
        tags: optionalStringArray(formData.get("tags")),
        seoTitle: optionalString(formData.get("seoTitle")),
        seoDescription: optionalString(formData.get("seoDescription")),
        sourceUrl: optionalString(formData.get("sourceUrl"))
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Не удалось сохранить товар."
    };
  }
}

export function validateServiceForm(formData: FormData): ValidationResult<Record<string, unknown>> {
  try {
    const title = requiredString(formData.get("title"), "Название");
    const slugInput = optionalString(formData.get("slug"));
    const slug = slugInput ? slugify(slugInput) : slugify(title);
    if (!slug) {
      throw new Error("Не удалось сформировать slug.");
    }

    return {
      success: true,
      data: {
        title,
        slug,
        category: optionalString(formData.get("category")),
        normalizedCategory: optionalString(formData.get("category")),
        shortDescription: optionalString(formData.get("shortDescription")),
        fullDescription: optionalString(formData.get("fullDescription")),
        priceRub: optionalInt(formData.get("priceRub")),
        priceUsd: optionalInt(formData.get("priceUsd")),
        priceLabel: optionalString(formData.get("priceLabel")),
        currency: parseCurrency(formData.get("currency")),
        format: optionalString(formData.get("format")),
        duration: optionalString(formData.get("duration")),
        executionTime: optionalString(formData.get("executionTime")),
        publicationStatus: parsePublicationStatus(formData.get("publicationStatus")),
        image: optionalString(formData.get("image")),
        gallery: optionalStringArray(formData.get("gallery")),
        tags: optionalStringArray(formData.get("tags")),
        seoTitle: optionalString(formData.get("seoTitle")),
        seoDescription: optionalString(formData.get("seoDescription")),
        sourceUrl: optionalString(formData.get("sourceUrl"))
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Не удалось сохранить услугу."
    };
  }
}

export function validateReviewForm(formData: FormData): ValidationResult<Record<string, unknown>> {
  try {
    return {
      success: true,
      data: {
        authorName: optionalString(formData.get("authorName")),
        title: optionalString(formData.get("title")),
        text: requiredString(formData.get("text"), "Текст"),
        image: optionalString(formData.get("image")),
        publicationStatus: parsePublicationStatus(formData.get("publicationStatus"))
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Не удалось сохранить отзыв."
    };
  }
}

export function validateUserForm(formData: FormData): ValidationResult<Record<string, unknown>> {
  try {
    const email = requiredString(formData.get("email"), "Email").toLowerCase();
    const roleValue = formData.get("role");
    const role: Role =
      roleValue === "MANAGER" ? "MANAGER" : roleValue === "DEMO" ? "DEMO" : "ADMIN";

    return {
      success: true,
      data: {
        email,
        name: optionalString(formData.get("name")),
        role,
        isActive: formData.get("isActive") === "on",
        password: optionalString(formData.get("password"))
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Не удалось сохранить пользователя."
    };
  }
}
