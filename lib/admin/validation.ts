import type { AvailabilityStatus, Currency, PublicationStatus, Role } from "@prisma/client";

import { slugify } from "@/lib/admin/slug";
import type { AdminDictionary } from "@/lib/i18n/admin/dictionaries/ru";
import { getAdminDictionarySync } from "@/lib/i18n/admin/get-admin-dictionary";
import { isLocale, type Locale } from "@/lib/i18n/config";

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; message: string };

function getDictFromForm(formData: FormData): AdminDictionary {
  const formLocale = formData.get("adminLocale");
  const locale: Locale =
    typeof formLocale === "string" && isLocale(formLocale) ? formLocale : "ru";
  return getAdminDictionarySync(locale);
}

function requiredString(
  value: FormDataEntryValue | null,
  field: string,
  dict: AdminDictionary
) {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (!normalized) {
    throw new Error(dict.validation.requiredField.replace("{field}", field));
  }
  return normalized;
}

function optionalString(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function optionalInt(value: FormDataEntryValue | null, dict: AdminDictionary) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    throw new Error(dict.validation.nonNegativeNumbers);
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
  const dict = getDictFromForm(formData);

  try {
    const title = requiredString(formData.get("title"), dict.validation.fields.title, dict);
    const slugInput = optionalString(formData.get("slug"));
    const slug = slugInput ? slugify(slugInput) : slugify(title);
    if (!slug) {
      throw new Error(dict.validation.slugFailed);
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
        priceRub: optionalInt(formData.get("priceRub"), dict),
        priceUsd: optionalInt(formData.get("priceUsd"), dict),
        priceLabel: optionalString(formData.get("priceLabel")),
        currency: parseCurrency(formData.get("currency")),
        purpose: optionalString(formData.get("purpose")),
        availabilityStatus: parseAvailability(formData.get("availabilityStatus")),
        publicationStatus: parsePublicationStatus(formData.get("publicationStatus")),
        quantity: optionalInt(formData.get("quantity"), dict),
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
      message: error instanceof Error ? error.message : dict.validation.saveProductFailed
    };
  }
}

export function validateServiceForm(formData: FormData): ValidationResult<Record<string, unknown>> {
  const dict = getDictFromForm(formData);

  try {
    const title = requiredString(formData.get("title"), dict.validation.fields.title, dict);
    const slugInput = optionalString(formData.get("slug"));
    const slug = slugInput ? slugify(slugInput) : slugify(title);
    if (!slug) {
      throw new Error(dict.validation.slugFailed);
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
        priceRub: optionalInt(formData.get("priceRub"), dict),
        priceUsd: optionalInt(formData.get("priceUsd"), dict),
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
      message: error instanceof Error ? error.message : dict.validation.saveServiceFailed
    };
  }
}

export function validateReviewForm(formData: FormData): ValidationResult<Record<string, unknown>> {
  const dict = getDictFromForm(formData);

  try {
    return {
      success: true,
      data: {
        authorName: optionalString(formData.get("authorName")),
        title: optionalString(formData.get("title")),
        text: requiredString(formData.get("text"), dict.validation.fields.text, dict),
        image: optionalString(formData.get("image")),
        publicationStatus: parsePublicationStatus(formData.get("publicationStatus"))
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : dict.validation.saveReviewFailed
    };
  }
}

export function validateUserForm(formData: FormData): ValidationResult<Record<string, unknown>> {
  const dict = getDictFromForm(formData);

  try {
    const email = requiredString(formData.get("email"), dict.validation.fields.email, dict).toLowerCase();
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
      message: error instanceof Error ? error.message : dict.validation.saveUserFailed
    };
  }
}
