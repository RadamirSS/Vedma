"use server";

import { randomUUID } from "node:crypto";

import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { deleteMediaFileIfUnlinked, replaceStoredFile, storeUploadedFile } from "@/lib/admin/media";
import { getSiteSettings } from "@/lib/admin/settings";
import {
  validateProductForm,
  validateReviewForm,
  validateServiceForm,
  validateUserForm
} from "@/lib/admin/validation";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  clearCurrentSession,
  createUserSession,
  requireAdmin,
  requireManagerOrAdmin
} from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

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

function requirePasswordLength(password: string | null, required = false) {
  if (!password && !required) {
    return null;
  }
  if (!password || password.length < 8) {
    throw new Error("Пароль должен содержать минимум 8 символов.");
  }
  return password;
}

export async function loginAction(formData: FormData) {
  const email = toNullableString(formData.get("email"))?.toLowerCase();
  const password = toNullableString(formData.get("password"));
  const next = toNullableString(formData.get("next")) ?? "/admin/dashboard";

  if (!email || !password) {
    redirect(`/admin/login?error=${encodeNotice("Введите email и пароль.")}`);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive || !verifyPassword(password, user.passwordHash)) {
    redirect(`/admin/login?error=${encodeNotice("Неверные учетные данные.")}`);
  }

  if (user.role !== Role.ADMIN && user.role !== Role.MANAGER) {
    redirect(`/admin/login?error=${encodeNotice("Доступ запрещен.")}`);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  await createUserSession(user.id);
  redirect(next);
}

export async function logoutAction() {
  await clearCurrentSession();
  redirect("/admin/login?success=" + encodeNotice("Вы вышли из системы."));
}

export async function saveProductAction(formData: FormData) {
  await requireManagerOrAdmin("/admin/products");
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
  const existing = await prisma.product.findFirst({
    where: {
      slug: String(data.slug),
      ...(id ? { id: { not: id } } : {})
    }
  });

  if (existing) {
    redirect(`/admin/products${id ? `/${id}` : "/new"}?error=${encodeNotice("Slug уже используется.")}`);
  }

  const payload = {
    ...data,
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
  redirect(`/admin/products/${product.id}?success=${encodeNotice("Товар сохранен.")}`);
}

export async function deleteProductAction(formData: FormData) {
  await requireManagerOrAdmin("/admin/products");
  const id = toNullableString(formData.get("id"));
  if (!id) {
    redirect(`/admin/products?error=${encodeNotice("Не выбран товар.")}`);
  }

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    redirect(`/admin/products?error=${encodeNotice("Товар не найден.")}`);
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
  redirect(`/admin/products?success=${encodeNotice("Товар удален.")}`);
}

export async function bulkProductsAction(formData: FormData) {
  await requireManagerOrAdmin("/admin/products");
  const ids = formData.getAll("ids").filter((value): value is string => typeof value === "string");
  const action = toNullableString(formData.get("bulkAction"));

  if (ids.length === 0 || !action) {
    redirect(`/admin/products?error=${encodeNotice("Выберите элементы и действие.")}`);
  }

  const publicationStatus =
    action === "publish" ? "PUBLISHED" : action === "hide" ? "ARCHIVED" : "DRAFT";

  await prisma.product.updateMany({
    where: { id: { in: ids } },
    data: { publicationStatus }
  });

  revalidatePath("/products");
  revalidatePath("/");
  revalidatePath("/admin/products");
  redirect(`/admin/products?success=${encodeNotice("Массовое действие выполнено.")}`);
}

export async function saveServiceAction(formData: FormData) {
  await requireManagerOrAdmin("/admin/services");
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
  const existing = await prisma.service.findFirst({
    where: {
      slug: String(data.slug),
      ...(id ? { id: { not: id } } : {})
    }
  });

  if (existing) {
    redirect(`/admin/services${id ? `/${id}` : "/new"}?error=${encodeNotice("Slug уже используется.")}`);
  }

  const payload = {
    ...data,
    gallery: Array.isArray(data.gallery) ? data.gallery : [],
    tags: Array.isArray(data.tags) ? data.tags : [],
    priceLabel: data.priceLabel || (data.priceRub ? `от ${data.priceRub} ₽` : null)
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
  redirect(`/admin/services/${service.id}?success=${encodeNotice("Услуга сохранена.")}`);
}

export async function deleteServiceAction(formData: FormData) {
  await requireManagerOrAdmin("/admin/services");
  const id = toNullableString(formData.get("id"));
  if (!id) {
    redirect(`/admin/services?error=${encodeNotice("Не выбрана услуга.")}`);
  }

  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) {
    redirect(`/admin/services?error=${encodeNotice("Услуга не найдена.")}`);
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
  redirect(`/admin/services?success=${encodeNotice("Услуга удалена.")}`);
}

export async function bulkServicesAction(formData: FormData) {
  await requireManagerOrAdmin("/admin/services");
  const ids = formData.getAll("ids").filter((value): value is string => typeof value === "string");
  const action = toNullableString(formData.get("bulkAction"));

  if (ids.length === 0 || !action) {
    redirect(`/admin/services?error=${encodeNotice("Выберите элементы и действие.")}`);
  }

  const publicationStatus =
    action === "publish" ? "PUBLISHED" : action === "hide" ? "ARCHIVED" : "DRAFT";

  await prisma.service.updateMany({
    where: { id: { in: ids } },
    data: { publicationStatus }
  });

  revalidatePath("/services");
  revalidatePath("/");
  revalidatePath("/admin/services");
  redirect(`/admin/services?success=${encodeNotice("Массовое действие выполнено.")}`);
}

export async function saveReviewAction(formData: FormData) {
  await requireManagerOrAdmin("/admin/reviews");
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
  redirect(`/admin/reviews/${review.id}?success=${encodeNotice("Отзыв сохранен.")}`);
}

export async function deleteReviewAction(formData: FormData) {
  await requireManagerOrAdmin("/admin/reviews");
  const id = toNullableString(formData.get("id"));
  if (!id) {
    redirect(`/admin/reviews?error=${encodeNotice("Не выбран отзыв.")}`);
  }

  await prisma.review.delete({ where: { id } });
  revalidatePath("/reviews");
  revalidatePath("/");
  revalidatePath("/admin/reviews");
  redirect(`/admin/reviews?success=${encodeNotice("Отзыв удален.")}`);
}

export async function saveSettingsAction(formData: FormData) {
  await requireAdmin("/admin/settings");
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
    }
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
  redirect(`/admin/settings?success=${encodeNotice("Настройки сохранены.")}`);
}

export async function saveUserAction(formData: FormData) {
  const session = await requireAdmin("/admin/users");
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
    redirect(`/admin/users${id ? `/${id}` : "/new"}?error=${encodeNotice("Email уже используется.")}`);
  }

  const password = requirePasswordLength(data.password, !id);
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
      await clearCurrentSession();
      redirect(`/admin/login?success=${encodeNotice("Пароль обновлен. Войдите снова.")}`);
    }
  }

  revalidatePath("/admin/users");
  redirect(`/admin/users/${user.id}?success=${encodeNotice("Пользователь сохранен.")}`);
}

export async function saveMediaUploadAction(formData: FormData) {
  await requireManagerOrAdmin("/admin/media");
  const file = formData.get("file");
  const alt = toNullableString(formData.get("alt"));

  if (!(file instanceof File) || file.size === 0) {
    redirect(`/admin/media?error=${encodeNotice("Выберите файл для загрузки.")}`);
  }

  const stored = await storeUploadedFile(file);
  await prisma.media.create({
    data: {
      path: stored.publicPath,
      filename: stored.filename,
      mimeType: stored.mimeType,
      size: stored.size,
      alt
    }
  });

  revalidatePath("/admin/media");
  redirect(`/admin/media?success=${encodeNotice("Изображение загружено.")}`);
}

export async function updateMediaAction(formData: FormData) {
  await requireManagerOrAdmin("/admin/media");
  const id = toNullableString(formData.get("id"));
  if (!id) {
    redirect(`/admin/media?error=${encodeNotice("Не выбран медиафайл.")}`);
  }

  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) {
    redirect(`/admin/media?error=${encodeNotice("Файл не найден.")}`);
  }

  const replacement = formData.get("replacement");
  let nextPath = media.path;
  let nextFilename = media.filename;
  let nextMimeType = media.mimeType;
  let nextSize = media.size;

  if (replacement instanceof File && replacement.size > 0) {
    const replaced = await replaceStoredFile(media.path, replacement);
    nextPath = replaced.path;
    nextFilename = replaced.filename;
    nextMimeType = replaced.mimeType;
    nextSize = replaced.size;
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

  revalidatePath("/admin/media");
  redirect(`/admin/media/${id}?success=${encodeNotice("Файл обновлен.")}`);
}

export async function deleteMediaAction(formData: FormData) {
  await requireManagerOrAdmin("/admin/media");
  const id = toNullableString(formData.get("id"));
  if (!id) {
    redirect(`/admin/media?error=${encodeNotice("Не выбран медиафайл.")}`);
  }

  await deleteMediaFileIfUnlinked(id);
  revalidatePath("/admin/media");
  redirect(`/admin/media?success=${encodeNotice("Файл удален.")}`);
}

export async function saveUserDeactivateAction(formData: FormData) {
  await requireAdmin("/admin/users");
  const id = toNullableString(formData.get("id"));

  if (!id) {
    redirect(`/admin/users?error=${encodeNotice("Не выбран пользователь.")}`);
  }

  await prisma.user.update({
    where: { id },
    data: { isActive: false }
  });
  await prisma.session.deleteMany({ where: { userId: id } });

  revalidatePath("/admin/users");
  redirect(`/admin/users?success=${encodeNotice("Пользователь деактивирован.")}`);
}

export async function savePasswordResetAction(formData: FormData) {
  await requireAdmin("/admin/users");
  const id = toNullableString(formData.get("id"));
  const password = requirePasswordLength(toNullableString(formData.get("password")), true);

  if (!id) {
    redirect(`/admin/users?error=${encodeNotice("Не выбран пользователь.")}`);
  }
  if (!password) {
    redirect(`/admin/users/${id}?error=${encodeNotice("Новый пароль обязателен.")}`);
  }

  await prisma.user.update({
    where: { id },
    data: { passwordHash: hashPassword(password) }
  });
  await prisma.session.deleteMany({ where: { userId: id } });

  revalidatePath("/admin/users");
  redirect(`/admin/users/${id}?success=${encodeNotice("Пароль обновлен.")}`);
}

export async function seedSettingsAction() {
  await requireAdmin("/admin/settings");
  const settings = await getSiteSettings();

  await prisma.siteSetting.upsert({
    where: { key: "site_settings" },
    update: { value: settings },
    create: { key: "site_settings", value: settings }
  });

  redirect(`/admin/settings?success=${encodeNotice("Базовые настройки инициализированы.")}`);
}
