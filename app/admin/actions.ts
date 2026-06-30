"use server";

import { randomUUID } from "node:crypto";

import { OrderStatus, PaymentStatus, RequestStatus, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { deleteMediaFileIfUnlinked, formatMediaStorageError, replaceStoredFile, storeUploadedFile } from "@/lib/admin/media";
import { propagateMediaPathChange, revalidateMediaPathChange } from "@/lib/admin/media-path-sync";
import { getSiteSettings, type SiteMediaSlotsShape } from "@/lib/admin/settings";
import {
  validateProductForm,
  validateReviewForm,
  validateServiceForm,
  validateUserForm
} from "@/lib/admin/validation";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  clearAdminSession,
  createAdminSession,
  requireWritableAdmin,
  requireWritableManagerOrAdmin
} from "@/lib/auth/session";
import { getSafeAdminRedirectPath } from "@/lib/auth/safe-redirect";
import { prisma } from "@/lib/db/prisma";
import {
  getOrderStatusLabels,
  getPaymentStatusLabels,
  getRequestStatusLabels
} from "@/lib/i18n/admin/constants";
import { getAdminLocaleFromCookies, getAdminLocaleFromForm } from "@/lib/i18n/admin/detect-locale";
import type { AdminDictionary } from "@/lib/i18n/admin/dictionaries/ru";
import { getAdminDictionarySync } from "@/lib/i18n/admin/get-admin-dictionary";

function encodeNotice(message: string) {
  return encodeURIComponent(message);
}

function toNullableString(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function syncProductMedia(productId: string, paths: string[]) {
  await prisma.media.updateMany({
    where: {
      productId,
      path: { notIn: paths }
    },
    data: { productId: null }
  });

  if (paths.length > 0) {
    await prisma.media.updateMany({
      where: {
        path: { in: paths },
        OR: [{ productId: null }, { productId }]
      },
      data: { productId }
    });
  }
}

async function syncServiceMedia(serviceId: string, paths: string[]) {
  await prisma.media.updateMany({
    where: {
      serviceId,
      path: { notIn: paths }
    },
    data: { serviceId: null }
  });

  if (paths.length > 0) {
    await prisma.media.updateMany({
      where: {
        path: { in: paths },
        OR: [{ serviceId: null }, { serviceId }]
      },
      data: { serviceId }
    });
  }
}

async function storeCatalogMainImage(
  file: File,
  alt: string | null,
  mediaErrors?: AdminDictionary["mediaErrors"]
) {
  const stored = await storeUploadedFile(file, mediaErrors);
  const media = await prisma.media.create({
    data: {
      path: stored.publicPath,
      filename: stored.filename,
      mimeType: stored.mimeType,
      size: stored.size,
      alt
    }
  });

  return media.path;
}

function requirePasswordLength(
  password: string | null,
  dict: AdminDictionary,
  required = false
) {
  if (!password && !required) {
    return null;
  }
  if (!password || password.length < 8) {
    throw new Error(dict.actions.users.passwordRequired);
  }
  return password;
}

export async function loginAction(formData: FormData) {
  const locale = await getAdminLocaleFromForm(formData);
  const dict = getAdminDictionarySync(locale);
  const email = toNullableString(formData.get("email"))?.toLowerCase();
  const password = toNullableString(formData.get("password"));
  const next = getSafeAdminRedirectPath(toNullableString(formData.get("next")));

  if (!email || !password) {
    redirect(`/admin/login?error=${encodeNotice(dict.actions.auth.enterEmailPassword)}`);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive || !verifyPassword(password, user.passwordHash)) {
    redirect(`/admin/login?error=${encodeNotice(dict.actions.auth.invalidCredentials)}`);
  }

  if (user.role !== Role.ADMIN && user.role !== Role.MANAGER && user.role !== Role.DEMO) {
    redirect(`/admin/login?error=${encodeNotice(dict.actions.auth.accessDenied)}`);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  await createAdminSession(user.id);
  redirect(next);
}

export async function logoutAction() {
  const locale = await getAdminLocaleFromCookies();
  const dict = getAdminDictionarySync(locale);
  await clearAdminSession();
  redirect("/admin/login?success=" + encodeNotice(dict.actions.auth.loggedOut));
}

export async function saveProductAction(formData: FormData) {
  const locale = await getAdminLocaleFromForm(formData);
  const dict = getAdminDictionarySync(locale);
  await requireWritableManagerOrAdmin("/admin/products");
  const validation = validateProductForm(formData);
  const id = toNullableString(formData.get("id"));

  if (!validation.success) {
    redirect(`/admin/products${id ? `/${id}` : "/new"}?error=${encodeNotice(validation.message)}`);
  }

  const data = validation.data as {
    title: string;
    slug: string;
    category: string | null;
    normalizedCategory: string | null;
    shortDescription: string | null;
    fullDescription: string | null;
    priceRub: number | null;
    priceUsd: number | null;
    priceLabel: string | null;
    currency: "RUB" | "USD";
    purpose: string | null;
    availabilityStatus: "IN_STOCK" | "ON_REQUEST" | "OUT_OF_STOCK" | "UNKNOWN";
    publicationStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    quantity: number | null;
    image: string | null;
    gallery: string[];
    tags: string[];
    seoTitle: string | null;
    seoDescription: string | null;
    sourceUrl: string | null;
  };
  const mainImageUpload = formData.get("mainImageUpload");
  const existing = await prisma.product.findFirst({
    where: {
      slug: String(data.slug),
      ...(id ? { id: { not: id } } : {})
    }
  });

  if (existing) {
    redirect(`/admin/products${id ? `/${id}` : "/new"}?error=${encodeNotice(dict.actions.products.slugInUse)}`);
  }

  let imagePath = data.image;
  if (mainImageUpload instanceof File && mainImageUpload.size > 0) {
    try {
      imagePath = await storeCatalogMainImage(mainImageUpload, data.title, dict.mediaErrors);
    } catch (error) {
      redirect(
        `/admin/products${id ? `/${id}` : "/new"}?error=${encodeNotice(formatMediaStorageError(error, dict.mediaErrors))}`
      );
    }
  }

  const payload = {
    ...data,
    image: imagePath,
    gallery: Array.isArray(data.gallery) ? data.gallery : [],
    tags: Array.isArray(data.tags) ? data.tags : [],
    priceLabel: data.priceLabel || (data.priceRub ? `${data.priceRub} ₽` : null)
  };

  const product = id
    ? await prisma.product.update({
        where: { id },
        data: payload
      })
    : await prisma.product.create({
        data: {
          ...payload,
          sourceId: `admin-product-${randomUUID()}`
        }
      });

  await syncProductMedia(
    product.id,
    [payload.image, ...(payload.gallery as string[])].filter((value): value is string => Boolean(value))
  );

  revalidatePath("/products");
  revalidatePath(`/products/${product.slug}`);
  revalidatePath("/");
  revalidatePath("/admin/products");
  revalidatePath("/admin/media");
  redirect(`/admin/products/${product.id}?success=${encodeNotice(dict.actions.products.saved)}`);
}

export async function deleteProductAction(formData: FormData) {
  const locale = await getAdminLocaleFromForm(formData);
  const dict = getAdminDictionarySync(locale);
  await requireWritableManagerOrAdmin("/admin/products");
  const id = toNullableString(formData.get("id"));
  if (!id) {
    redirect(`/admin/products?error=${encodeNotice(dict.actions.products.notSelected)}`);
  }

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    redirect(`/admin/products?error=${encodeNotice(dict.actions.products.notFound)}`);
  }

  await prisma.media.updateMany({
    where: { productId: id },
    data: { productId: null }
  });
  await prisma.product.delete({ where: { id } });

  revalidatePath("/products");
  revalidatePath(`/products/${product.slug}`);
  revalidatePath("/");
  revalidatePath("/admin/products");
  redirect(`/admin/products?success=${encodeNotice(dict.actions.products.deleted)}`);
}

export async function bulkProductsAction(formData: FormData) {
  const locale = await getAdminLocaleFromForm(formData);
  const dict = getAdminDictionarySync(locale);
  await requireWritableManagerOrAdmin("/admin/products");
  const ids = formData.getAll("ids").filter((value): value is string => typeof value === "string");
  const action = toNullableString(formData.get("bulkAction"));

  if (ids.length === 0 || !action) {
    redirect(`/admin/products?error=${encodeNotice(dict.actions.products.selectItemsAndAction)}`);
  }

  const publicationStatus =
    action === "publish" ? "PUBLISHED" : action === "hide" ? "ARCHIVED" : "DRAFT";

  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    select: { slug: true }
  });

  await prisma.product.updateMany({
    where: { id: { in: ids } },
    data: { publicationStatus }
  });

  revalidatePath("/products");
  for (const product of products) {
    revalidatePath(`/products/${product.slug}`);
  }
  revalidatePath("/");
  revalidatePath("/admin/products");
  redirect(`/admin/products?success=${encodeNotice(dict.actions.products.bulkDone)}`);
}

export async function saveServiceAction(formData: FormData) {
  const locale = await getAdminLocaleFromForm(formData);
  const dict = getAdminDictionarySync(locale);
  await requireWritableManagerOrAdmin("/admin/services");
  const validation = validateServiceForm(formData);
  const id = toNullableString(formData.get("id"));

  if (!validation.success) {
    redirect(`/admin/services${id ? `/${id}` : "/new"}?error=${encodeNotice(validation.message)}`);
  }

  const data = validation.data as {
    title: string;
    slug: string;
    category: string | null;
    normalizedCategory: string | null;
    shortDescription: string | null;
    fullDescription: string | null;
    priceRub: number | null;
    priceUsd: number | null;
    priceLabel: string | null;
    currency: "RUB" | "USD";
    format: string | null;
    duration: string | null;
    executionTime: string | null;
    publicationStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    image: string | null;
    gallery: string[];
    tags: string[];
    seoTitle: string | null;
    seoDescription: string | null;
    sourceUrl: string | null;
  };
  const mainImageUpload = formData.get("mainImageUpload");
  const existing = await prisma.service.findFirst({
    where: {
      slug: String(data.slug),
      ...(id ? { id: { not: id } } : {})
    }
  });

  if (existing) {
    redirect(`/admin/services${id ? `/${id}` : "/new"}?error=${encodeNotice(dict.actions.services.slugInUse)}`);
  }

  let imagePath = data.image;
  if (mainImageUpload instanceof File && mainImageUpload.size > 0) {
    try {
      imagePath = await storeCatalogMainImage(mainImageUpload, data.title, dict.mediaErrors);
    } catch (error) {
      redirect(
        `/admin/services${id ? `/${id}` : "/new"}?error=${encodeNotice(formatMediaStorageError(error, dict.mediaErrors))}`
      );
    }
  }

  const payload = {
    ...data,
    image: imagePath,
    gallery: Array.isArray(data.gallery) ? data.gallery : [],
    tags: Array.isArray(data.tags) ? data.tags : [],
    priceLabel: data.priceLabel || (data.priceRub ? `${dict.common.fromPrice} ${data.priceRub} ₽` : null)
  };

  const service = id
    ? await prisma.service.update({
        where: { id },
        data: payload
      })
    : await prisma.service.create({
        data: {
          ...payload,
          sourceId: `admin-service-${randomUUID()}`
        }
      });

  await syncServiceMedia(
    service.id,
    [payload.image, ...(payload.gallery as string[])].filter((value): value is string => Boolean(value))
  );

  revalidatePath("/services");
  revalidatePath(`/services/${service.slug}`);
  revalidatePath("/");
  revalidatePath("/admin/services");
  revalidatePath("/admin/media");
  redirect(`/admin/services/${service.id}?success=${encodeNotice(dict.actions.services.saved)}`);
}

function requireEnumValue<T extends string>(value: string | null, allowed: readonly T[], message: string) {
  if (!value || !allowed.includes(value as T)) {
    throw new Error(message);
  }

  return value as T;
}

export async function updateOrderStatusAction(formData: FormData) {
  const locale = await getAdminLocaleFromForm(formData);
  const dict = getAdminDictionarySync(locale);
  await requireWritableManagerOrAdmin("/admin/orders");
  const id = toNullableString(formData.get("id"));
  const status = requireEnumValue(
    toNullableString(formData.get("status")),
    Object.keys(getOrderStatusLabels(dict)) as OrderStatus[],
    dict.validation.requiredField.replace("{field}", dict.common.status)
  );
  const paymentStatus = requireEnumValue(
    toNullableString(formData.get("paymentStatus")),
    Object.keys(getPaymentStatusLabels(dict)) as PaymentStatus[],
    dict.validation.requiredField.replace("{field}", dict.common.status)
  );
  const adminComment = toNullableString(formData.get("adminComment"));

  if (!id) {
    redirect(`/admin/orders?error=${encodeNotice(dict.actions.orders.notFound)}`);
  }

  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) {
    redirect(`/admin/orders?error=${encodeNotice(dict.actions.orders.notFound)}`);
  }

  await prisma.order.update({
    where: { id },
    data: {
      status,
      paymentStatus,
      adminComment
    }
  });

  if (existing.status !== status) {
    await prisma.statusHistory.create({
      data: {
        entityType: "ORDER",
        entityId: existing.id,
        orderId: existing.id,
        changedById: (await requireWritableManagerOrAdmin("/admin/orders")).user.id,
        oldStatus: existing.status,
        newStatus: status,
        comment: adminComment ?? "Статус обновлен из админ-панели."
      }
    });
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/account/orders");
  redirect(`/admin/orders/${id}?success=${encodeNotice(dict.actions.orders.updated)}`);
}

export async function updateRequestStatusAction(formData: FormData) {
  const locale = await getAdminLocaleFromForm(formData);
  const dict = getAdminDictionarySync(locale);
  await requireWritableManagerOrAdmin("/admin/requests");
  const id = toNullableString(formData.get("id"));
  const status = requireEnumValue(
    toNullableString(formData.get("status")),
    Object.keys(getRequestStatusLabels(dict)) as RequestStatus[],
    dict.validation.requiredField.replace("{field}", dict.common.status)
  );
  const adminComment = toNullableString(formData.get("adminComment"));

  if (!id) {
    redirect(`/admin/requests?error=${encodeNotice(dict.actions.requests.notFound)}`);
  }

  const session = await requireWritableManagerOrAdmin("/admin/requests");
  const existing = await prisma.request.findUnique({ where: { id } });
  if (!existing) {
    redirect(`/admin/requests?error=${encodeNotice(dict.actions.requests.notFound)}`);
  }

  await prisma.request.update({
    where: { id },
    data: {
      status,
      adminComment,
      responsibleUserId: session.user.id
    }
  });

  if (existing.status !== status) {
    await prisma.statusHistory.create({
      data: {
        entityType: "REQUEST",
        entityId: existing.id,
        requestId: existing.id,
        changedById: session.user.id,
        oldStatus: existing.status,
        newStatus: status,
        comment: adminComment ?? "Статус обновлен из админ-панели."
      }
    });
  }

  revalidatePath("/admin/requests");
  revalidatePath(`/admin/requests/${id}`);
  redirect(`/admin/requests/${id}?success=${encodeNotice(dict.actions.requests.updated)}`);
}

export async function updatePaymentStatusAction(formData: FormData) {
  const locale = await getAdminLocaleFromForm(formData);
  const dict = getAdminDictionarySync(locale);
  await requireWritableManagerOrAdmin("/admin/payments");
  const id = toNullableString(formData.get("id"));
  const status = requireEnumValue(
    toNullableString(formData.get("status")),
    Object.keys(getPaymentStatusLabels(dict)) as PaymentStatus[],
    dict.validation.requiredField.replace("{field}", dict.common.status)
  );
  const adminComment = toNullableString(formData.get("adminComment"));

  if (!id) {
    redirect(`/admin/payments?error=${encodeNotice(dict.actions.payments.notFound)}`);
  }

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { order: true }
  });

  if (!payment) {
    redirect(`/admin/payments?error=${encodeNotice(dict.actions.payments.notFound)}`);
  }

  await prisma.payment.update({
    where: { id },
    data: {
      status,
      adminComment,
      paymentDate: status === "PAID" ? new Date() : null
    }
  });

  if (payment.orderId) {
    const nextOrderStatus =
      status === "PAID" &&
      payment.order &&
      (payment.order.status === "AWAITING_PAYMENT" ||
        payment.order.status === "PENDING_CONFIRMATION")
        ? "PAID"
        : undefined;

    await prisma.order.update({
      where: { id: payment.orderId },
      data: {
        paymentStatus: status,
        ...(nextOrderStatus ? { status: nextOrderStatus } : {})
      }
    });

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${payment.orderId}`);
    revalidatePath("/account/orders");
    revalidatePath(`/account/orders/${payment.orderId}`);
  }

  revalidatePath("/admin/payments");
  redirect(`/admin/payments?success=${encodeNotice(dict.actions.payments.updated)}`);
}

export async function updateCustomerNotesAction(formData: FormData) {
  const locale = await getAdminLocaleFromForm(formData);
  const dict = getAdminDictionarySync(locale);
  await requireWritableManagerOrAdmin("/admin/customers");
  const userId = toNullableString(formData.get("userId"));
  const adminNotes = toNullableString(formData.get("adminNotes"));

  if (!userId) {
    redirect(`/admin/customers?error=${encodeNotice(dict.actions.customers.notFound)}`);
  }

  await prisma.customerProfile.upsert({
    where: { userId },
    update: { adminNotes },
    create: { userId, adminNotes }
  });

  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${userId}`);
  redirect(`/admin/customers/${userId}?success=${encodeNotice(dict.actions.customers.noteSaved)}`);
}

export async function deleteServiceAction(formData: FormData) {
  const locale = await getAdminLocaleFromForm(formData);
  const dict = getAdminDictionarySync(locale);
  await requireWritableManagerOrAdmin("/admin/services");
  const id = toNullableString(formData.get("id"));
  if (!id) {
    redirect(`/admin/services?error=${encodeNotice(dict.actions.services.notSelected)}`);
  }

  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) {
    redirect(`/admin/services?error=${encodeNotice(dict.actions.services.notFound)}`);
  }

  await prisma.media.updateMany({
    where: { serviceId: id },
    data: { serviceId: null }
  });
  await prisma.service.delete({ where: { id } });

  revalidatePath("/services");
  revalidatePath(`/services/${service.slug}`);
  revalidatePath("/");
  revalidatePath("/admin/services");
  redirect(`/admin/services?success=${encodeNotice(dict.actions.services.deleted)}`);
}

export async function bulkServicesAction(formData: FormData) {
  const locale = await getAdminLocaleFromForm(formData);
  const dict = getAdminDictionarySync(locale);
  await requireWritableManagerOrAdmin("/admin/services");
  const ids = formData.getAll("ids").filter((value): value is string => typeof value === "string");
  const action = toNullableString(formData.get("bulkAction"));

  if (ids.length === 0 || !action) {
    redirect(`/admin/services?error=${encodeNotice(dict.actions.services.selectItemsAndAction)}`);
  }

  const publicationStatus =
    action === "publish" ? "PUBLISHED" : action === "hide" ? "ARCHIVED" : "DRAFT";

  const services = await prisma.service.findMany({
    where: { id: { in: ids } },
    select: { slug: true }
  });

  await prisma.service.updateMany({
    where: { id: { in: ids } },
    data: { publicationStatus }
  });

  revalidatePath("/services");
  for (const service of services) {
    revalidatePath(`/services/${service.slug}`);
  }
  revalidatePath("/");
  revalidatePath("/admin/services");
  redirect(`/admin/services?success=${encodeNotice(dict.actions.services.bulkDone)}`);
}

export async function saveReviewAction(formData: FormData) {
  const locale = await getAdminLocaleFromForm(formData);
  const dict = getAdminDictionarySync(locale);
  await requireWritableManagerOrAdmin("/admin/reviews");
  const validation = validateReviewForm(formData);
  const id = toNullableString(formData.get("id"));

  if (!validation.success) {
    redirect(`/admin/reviews${id ? `/${id}` : "/new"}?error=${encodeNotice(validation.message)}`);
  }

  const data = validation.data as {
    authorName: string | null;
    title: string | null;
    text: string;
    image: string | null;
    publicationStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  };

  const review = id
    ? await prisma.review.update({ where: { id }, data })
    : await prisma.review.create({ data });

  revalidatePath("/reviews");
  revalidatePath("/");
  revalidatePath("/admin/reviews");
  redirect(`/admin/reviews/${review.id}?success=${encodeNotice(dict.actions.reviews.saved)}`);
}

export async function deleteReviewAction(formData: FormData) {
  const locale = await getAdminLocaleFromForm(formData);
  const dict = getAdminDictionarySync(locale);
  await requireWritableManagerOrAdmin("/admin/reviews");
  const id = toNullableString(formData.get("id"));
  if (!id) {
    redirect(`/admin/reviews?error=${encodeNotice(dict.actions.reviews.notSelected)}`);
  }

  await prisma.review.delete({ where: { id } });
  revalidatePath("/reviews");
  revalidatePath("/");
  revalidatePath("/admin/reviews");
  redirect(`/admin/reviews?success=${encodeNotice(dict.actions.reviews.deleted)}`);
}

export async function saveSettingsAction(formData: FormData) {
  const locale = await getAdminLocaleFromForm(formData);
  const dict = getAdminDictionarySync(locale);
  await requireWritableAdmin("/admin/settings");
  const current = await getSiteSettings();

  const next = {
    contacts: {
      telegram: toNullableString(formData.get("contacts.telegram")) ?? current.contacts.telegram,
      vk: toNullableString(formData.get("contacts.vk")) ?? current.contacts.vk,
      phone: toNullableString(formData.get("contacts.phone")) ?? current.contacts.phone,
      responseHours:
        toNullableString(formData.get("contacts.responseHours")) ?? current.contacts.responseHours,
      workFormat:
        toNullableString(formData.get("contacts.workFormat")) ?? current.contacts.workFormat,
      email: toNullableString(formData.get("contacts.email")) ?? current.contacts.email
    },
    seo: {
      defaultTitle:
        toNullableString(formData.get("seo.defaultTitle")) ?? current.seo.defaultTitle,
      defaultDescription:
        toNullableString(formData.get("seo.defaultDescription")) ??
        current.seo.defaultDescription,
      titleTemplate:
        toNullableString(formData.get("seo.titleTemplate")) ?? current.seo.titleTemplate,
      keywords: toNullableString(formData.get("seo.keywords")) ?? current.seo.keywords
    },
    homepage: {
      eyebrow: toNullableString(formData.get("homepage.eyebrow")) ?? current.homepage.eyebrow,
      title: toNullableString(formData.get("homepage.title")) ?? current.homepage.title,
      lead: toNullableString(formData.get("homepage.lead")) ?? current.homepage.lead,
      description:
        toNullableString(formData.get("homepage.description")) ?? current.homepage.description,
      primaryLabel:
        toNullableString(formData.get("homepage.primaryLabel")) ?? current.homepage.primaryLabel,
      secondaryLabel:
        toNullableString(formData.get("homepage.secondaryLabel")) ??
        current.homepage.secondaryLabel,
      telegramLabel:
        toNullableString(formData.get("homepage.telegramLabel")) ??
        current.homepage.telegramLabel
    },
    footer: {
      description:
        toNullableString(formData.get("footer.description")) ?? current.footer.description,
      disclaimer:
        toNullableString(formData.get("footer.disclaimer")) ?? current.footer.disclaimer,
      copyright: toNullableString(formData.get("footer.copyright")) ?? current.footer.copyright
    },
    socialLinks: {
      telegram:
        toNullableString(formData.get("socialLinks.telegram")) ?? current.socialLinks.telegram,
      vk: toNullableString(formData.get("socialLinks.vk")) ?? current.socialLinks.vk,
      instagram:
        toNullableString(formData.get("socialLinks.instagram")) ?? current.socialLinks.instagram,
      youtube:
        toNullableString(formData.get("socialLinks.youtube")) ?? current.socialLinks.youtube
    },
    legalPages: {
      privacyTitle:
        toNullableString(formData.get("legalPages.privacyTitle")) ??
        current.legalPages.privacyTitle,
      privacyText:
        toNullableString(formData.get("legalPages.privacyText")) ??
        current.legalPages.privacyText,
      offerTitle:
        toNullableString(formData.get("legalPages.offerTitle")) ??
        current.legalPages.offerTitle,
      offerText:
        toNullableString(formData.get("legalPages.offerText")) ?? current.legalPages.offerText,
      disclaimerTitle:
        toNullableString(formData.get("legalPages.disclaimerTitle")) ??
        current.legalPages.disclaimerTitle,
      disclaimerText:
        toNullableString(formData.get("legalPages.disclaimerText")) ??
        current.legalPages.disclaimerText
    },
    currencies: {
      primary: toNullableString(formData.get("currencies.primary")) ?? current.currencies.primary,
      secondary:
        toNullableString(formData.get("currencies.secondary")) ?? current.currencies.secondary
    },
    mediaSlots: current.mediaSlots
  };

  await prisma.siteSetting.upsert({
    where: { key: "site_settings" },
    update: { value: next },
    create: { key: "site_settings", value: next }
  });

  revalidatePath("/");
  revalidatePath("/contacts");
  revalidatePath("/legal");
  revalidatePath("/admin/settings");
  redirect(`/admin/settings?success=${encodeNotice(dict.actions.settings.saved)}`);
}

async function resolveMediaPathFromForm(
  formData: FormData,
  uploadField: string,
  selectField: string,
  currentValue: string | null,
  dict: AdminDictionary
) {
  const upload = formData.get(uploadField);
  if (upload instanceof File && upload.size > 0) {
    try {
      return await storeCatalogMainImage(upload, null, dict.mediaErrors);
    } catch (error) {
      throw new Error(formatMediaStorageError(error, dict.mediaErrors));
    }
  }

  const selected = toNullableString(formData.get(selectField));
  return selected ?? currentValue;
}

export async function saveSiteMediaSlotsAction(formData: FormData) {
  const locale = await getAdminLocaleFromForm(formData);
  const dict = getAdminDictionarySync(locale);
  await requireWritableManagerOrAdmin("/admin/media/site");

  try {
    const current = await getSiteSettings();
    const media = current.mediaSlots;

    const homeGallery = await Promise.all(
      media.homeGallery.map(async (slot, index) => ({
        label: slot.label,
        alt: toNullableString(formData.get(`gallery.${index}.alt`)) ?? slot.alt,
        src:
          (await resolveMediaPathFromForm(
            formData,
            `gallery.${index}.upload`,
            `gallery.${index}.image`,
            slot.src,
            dict
          )) ?? slot.src
      }))
    );

    const homeDirections = await Promise.all(
      media.homeDirections.map(async (slot) => ({
        id: slot.id,
        alt: toNullableString(formData.get(`direction.${slot.id}.alt`)) ?? slot.alt,
        image:
          (await resolveMediaPathFromForm(
            formData,
            `direction.${slot.id}.upload`,
            `direction.${slot.id}.image`,
            slot.image,
            dict
          )) ?? slot.image
      }))
    );

    const nextMediaSlots: SiteMediaSlotsShape = {
      logoImage: await resolveMediaPathFromForm(
        formData,
        "logo.upload",
        "logo.image",
        media.logoImage,
        dict
      ),
      logoAlt: toNullableString(formData.get("logo.alt")) ?? media.logoAlt,
      heroPortrait: await resolveMediaPathFromForm(
        formData,
        "hero.upload",
        "hero.image",
        media.heroPortrait,
        dict
      ),
      heroPortraitAlt: toNullableString(formData.get("hero.alt")) ?? media.heroPortraitAlt,
      homeGallery,
      homeDirections,
      footerBrandImage: await resolveMediaPathFromForm(
        formData,
        "footer.upload",
        "footer.image",
        media.footerBrandImage,
        dict
      ),
      aboutImage: await resolveMediaPathFromForm(
        formData,
        "about.upload",
        "about.image",
        media.aboutImage,
        dict
      )
    };

    const next = {
      ...current,
      mediaSlots: nextMediaSlots
    };

    await prisma.siteSetting.upsert({
      where: { key: "site_settings" },
      update: { value: next },
      create: { key: "site_settings", value: next }
    });

    revalidatePath("/");
    revalidatePath("/about");
    revalidatePath("/admin/media/site");
    redirect(`/admin/media/site?success=${encodeNotice(dict.actions.media.siteUpdated)}`);
  } catch (error) {
    redirect(
      `/admin/media/site?error=${encodeNotice(
        error instanceof Error ? error.message : dict.actions.media.siteSaveFailed
      )}`
    );
  }
}

export async function saveUserAction(formData: FormData) {
  const locale = await getAdminLocaleFromForm(formData);
  const dict = getAdminDictionarySync(locale);
  const session = await requireWritableAdmin("/admin/users");
  const validation = validateUserForm(formData);
  const id = toNullableString(formData.get("id"));

  if (!validation.success) {
    redirect(`/admin/users${id ? `/${id}` : "/new"}?error=${encodeNotice(validation.message)}`);
  }

  const data = validation.data as {
    email: string;
    name: string | null;
    role: Role;
    isActive: boolean;
    password: string | null;
  };

  const existing = await prisma.user.findFirst({
    where: {
      email: data.email,
      ...(id ? { id: { not: id } } : {})
    }
  });
  if (existing) {
    redirect(`/admin/users${id ? `/${id}` : "/new"}?error=${encodeNotice(dict.actions.users.emailInUse)}`);
  }

  const password = requirePasswordLength(data.password, dict, !id);
  const passwordHash = password ? hashPassword(password) : undefined;

  const user = id
    ? await prisma.user.update({
        where: { id },
        data: {
          email: data.email,
          name: data.name,
          role: data.role,
          isActive: data.isActive,
          ...(passwordHash ? { passwordHash } : {})
        }
      })
    : await prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          role: data.role,
          isActive: data.isActive,
          passwordHash: passwordHash ?? hashPassword(randomUUID())
        }
      });

  if (id && passwordHash) {
    await prisma.session.deleteMany({ where: { userId: id } });
    if (session.user.id === id) {
      await clearAdminSession();
      redirect(`/admin/login?success=${encodeNotice(dict.actions.auth.passwordUpdatedLoginAgain)}`);
    }
  }

  revalidatePath("/admin/users");
  redirect(`/admin/users/${user.id}?success=${encodeNotice(dict.actions.users.saved)}`);
}

export async function saveMediaUploadAction(formData: FormData) {
  const locale = await getAdminLocaleFromForm(formData);
  const dict = getAdminDictionarySync(locale);
  await requireWritableManagerOrAdmin("/admin/media");
  const file = formData.get("file");
  const alt = toNullableString(formData.get("alt"));

  if (!(file instanceof File) || file.size === 0) {
    redirect(`/admin/media?error=${encodeNotice(dict.actions.media.selectFile)}`);
  }

  try {
    const stored = await storeUploadedFile(file, dict.mediaErrors);
    await prisma.media.create({
      data: {
        path: stored.publicPath,
        filename: stored.filename,
        mimeType: stored.mimeType,
        size: stored.size,
        alt
      }
    });
  } catch (error) {
    redirect(
      `/admin/media?error=${encodeNotice(
        formatMediaStorageError(error, dict.mediaErrors)
      )}`
    );
  }

  revalidatePath("/admin/media");
  redirect(`/admin/media?success=${encodeNotice(dict.actions.media.uploaded)}`);
}

export async function updateMediaAction(formData: FormData) {
  const locale = await getAdminLocaleFromForm(formData);
  const dict = getAdminDictionarySync(locale);
  await requireWritableManagerOrAdmin("/admin/media");
  const id = toNullableString(formData.get("id"));
  if (!id) {
    redirect(`/admin/media?error=${encodeNotice(dict.actions.media.notSelected)}`);
  }

  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) {
    redirect(`/admin/media?error=${encodeNotice(dict.actions.media.notFound)}`);
  }

  const replacement = formData.get("replacement");
  let nextPath = media.path;
  let nextFilename = media.filename;
  let nextMimeType = media.mimeType;
  let nextSize = media.size;

  if (replacement instanceof File && replacement.size > 0) {
    try {
      const replaced = await replaceStoredFile(media.path, replacement, dict.mediaErrors);
      nextPath = replaced.path;
      nextFilename = replaced.filename;
      nextMimeType = replaced.mimeType;
      nextSize = replaced.size;
    } catch (error) {
      redirect(
        `/admin/media/${id}?error=${encodeNotice(formatMediaStorageError(error, dict.mediaErrors))}`
      );
    }
  }

  await prisma.media.update({
    where: { id },
    data: {
      path: nextPath,
      filename: nextFilename,
      mimeType: nextMimeType,
      size: nextSize,
      alt: toNullableString(formData.get("alt")),
      sourceUrl: toNullableString(formData.get("sourceUrl"))
    }
  });

  if (nextPath !== media.path) {
    await propagateMediaPathChange(media.path, nextPath);
    await revalidateMediaPathChange(media.path, nextPath);
  }

  revalidatePath("/admin/media");
  revalidatePath(`/admin/media/${id}`);
  redirect(`/admin/media/${id}?success=${encodeNotice(dict.actions.media.updated)}`);
}

export async function deleteMediaAction(formData: FormData) {
  const locale = await getAdminLocaleFromForm(formData);
  const dict = getAdminDictionarySync(locale);
  await requireWritableManagerOrAdmin("/admin/media");
  const id = toNullableString(formData.get("id"));
  if (!id) {
    redirect(`/admin/media?error=${encodeNotice(dict.actions.media.notSelected)}`);
  }

  try {
    await deleteMediaFileIfUnlinked(id, dict.mediaErrors);
  } catch (error) {
    redirect(
      `/admin/media/${id}?error=${encodeNotice(
        error instanceof Error
          ? formatMediaStorageError(error, dict.mediaErrors)
          : dict.actions.media.deleteFailed
      )}`
    );
  }
  revalidatePath("/admin/media");
  redirect(`/admin/media?success=${encodeNotice(dict.actions.media.deleted)}`);
}

export async function saveUserDeactivateAction(formData: FormData) {
  const locale = await getAdminLocaleFromForm(formData);
  const dict = getAdminDictionarySync(locale);
  await requireWritableAdmin("/admin/users");
  const id = toNullableString(formData.get("id"));

  if (!id) {
    redirect(`/admin/users?error=${encodeNotice(dict.actions.users.notSelected)}`);
  }

  await prisma.user.update({
    where: { id },
    data: { isActive: false }
  });
  await prisma.session.deleteMany({ where: { userId: id } });

  revalidatePath("/admin/users");
  redirect(`/admin/users?success=${encodeNotice(dict.actions.users.deactivated)}`);
}

export async function deleteUserAction(formData: FormData) {
  const locale = await getAdminLocaleFromForm(formData);
  const dict = getAdminDictionarySync(locale);
  const session = await requireWritableAdmin("/admin/users");
  const id = toNullableString(formData.get("id"));

  if (!id) {
    redirect(`/admin/users?error=${encodeNotice(dict.actions.users.notSelected)}`);
  }

  if (session.user.id === id) {
    redirect(`/admin/users/${id}?error=${encodeNotice(dict.actions.users.cannotDeleteSelf)}`);
  }

  await prisma.session.deleteMany({ where: { userId: id } });
  await prisma.user.delete({ where: { id } });

  revalidatePath("/admin/users");
  redirect(`/admin/users?success=${encodeNotice(dict.actions.users.deleted)}`);
}

export async function savePasswordResetAction(formData: FormData) {
  const locale = await getAdminLocaleFromForm(formData);
  const dict = getAdminDictionarySync(locale);
  await requireWritableAdmin("/admin/users");
  const id = toNullableString(formData.get("id"));
  const password = requirePasswordLength(toNullableString(formData.get("password")), dict, true);

  if (!id) {
    redirect(`/admin/users?error=${encodeNotice(dict.actions.users.notSelected)}`);
  }
  if (!password) {
    redirect(`/admin/users/${id}?error=${encodeNotice(dict.actions.users.passwordRequired)}`);
  }

  await prisma.user.update({
    where: { id },
    data: { passwordHash: hashPassword(password) }
  });
  await prisma.session.deleteMany({ where: { userId: id } });

  revalidatePath("/admin/users");
  redirect(`/admin/users/${id}?success=${encodeNotice(dict.actions.users.passwordUpdated)}`);
}

export async function seedSettingsAction() {
  const locale = await getAdminLocaleFromCookies();
  const dict = getAdminDictionarySync(locale);
  await requireWritableAdmin("/admin/settings");
  const settings = await getSiteSettings();

  await prisma.siteSetting.upsert({
    where: { key: "site_settings" },
    update: { value: settings },
    create: { key: "site_settings", value: settings }
  });

  redirect(`/admin/settings?success=${encodeNotice(dict.actions.settings.seeded)}`);
}
