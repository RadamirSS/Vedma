import { ContactMethod, Currency, PaymentProvider, PaymentStatus, RequestStatus, Role } from "@prisma/client";

import { hashPassword } from "@/lib/auth/password";
import { createUserSession } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { resolveCartEntries, getCartTotals, type CartEntry } from "@/lib/commerce/cart";
import { storePrivatePdf } from "@/lib/commerce/files";
import { prisma } from "@/lib/db/prisma";

export type CheckoutPayload = {
  cartEntries: CartEntry[];
  email: string;
  password: string;
  name: string | null;
  phone: string | null;
  telegram: string | null;
  contactMethod: ContactMethod | null;
  city: string | null;
  country: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  postalCode: string | null;
  birthDate: Date | null;
  comment: string | null;
  uploadedFileIds: string[];
  uploadedFiles?: File[];
  currentSessionUserId?: string | null;
};

function nextNumber(prefix: string) {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${stamp}-${suffix}`;
}

function requireDeliveryDetails(payload: CheckoutPayload, deliveryRequired: boolean) {
  if (!deliveryRequired) {
    return;
  }

  const missing: string[] = [];

  if (!payload.country) {
    missing.push("страну");
  }
  if (!payload.city) {
    missing.push("город");
  }
  if (!payload.addressLine1) {
    missing.push("адрес доставки");
  }
  if (!payload.phone && !payload.telegram) {
    missing.push("телефон или Telegram");
  }

  if (missing.length > 0) {
    throw new Error(`Для доставки физических товаров укажите ${missing.join(", ")}.`);
  }
}

export async function createCheckoutOrder(payload: CheckoutPayload) {
  const items = await resolveCartEntries(payload.cartEntries);
  if (items.length === 0) {
    throw new Error("Корзина пуста или товары больше недоступны.");
  }

  const totals = getCartTotals(items);
  requireDeliveryDetails(payload, totals.deliveryRequired);

  if (!payload.email) {
    throw new Error("Email обязателен для оформления заказа.");
  }

  const existing = await prisma.user.findUnique({
    where: { email: payload.email },
    include: { customerProfile: true }
  });

  if (existing && existing.role !== Role.CUSTOMER) {
    throw new Error("Этот email уже используется внутренним пользователем.");
  }

  if (payload.currentSessionUserId && existing && payload.currentSessionUserId !== existing.id) {
    throw new Error("Активная сессия не совпадает с email заказа.");
  }

  if (payload.password.length < 8) {
    throw new Error("Пароль должен содержать минимум 8 символов.");
  }

  if (existing && !verifyPassword(payload.password, existing.passwordHash)) {
    throw new Error("Неверный пароль для существующего аккаунта.");
  }

  const user =
    existing ??
    (await prisma.user.create({
      data: {
        email: payload.email,
        passwordHash: hashPassword(payload.password),
        name: payload.name,
        phone: payload.phone,
        telegram: payload.telegram,
        role: Role.CUSTOMER
      }
    }));

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        name: payload.name ?? existing.name,
        phone: payload.phone ?? existing.phone,
        telegram: payload.telegram ?? existing.telegram
      }
    });
  }

  await prisma.customerProfile.upsert({
    where: { userId: user.id },
    update: {
      city: payload.city,
      country: payload.country,
      addressLine1: payload.addressLine1,
      addressLine2: payload.addressLine2,
      postalCode: payload.postalCode,
      birthDate: payload.birthDate
    },
    create: {
      userId: user.id,
      city: payload.city,
      country: payload.country,
      addressLine1: payload.addressLine1,
      addressLine2: payload.addressLine2,
      postalCode: payload.postalCode,
      birthDate: payload.birthDate
    }
  });

  const uploadedFiles = payload.uploadedFiles?.length
    ? await Promise.all(payload.uploadedFiles.map((file) => storePrivatePdf(file, user.id)))
    : [];

  const order = await prisma.order.create({
    data: {
      orderNumber: nextNumber("ORD"),
      customerId: user.id,
      status: "NEW",
      paymentStatus: "NOT_ISSUED",
      currency: items[0]?.currency ?? Currency.RUB,
      totalAmount: totals.totalAmount,
      totalAmountRub: totals.totalAmountRub || null,
      totalAmountUsd: totals.totalAmountUsd || null,
      customerName: payload.name,
      customerEmail: payload.email,
      customerPhone: payload.phone,
      customerTelegram: payload.telegram,
      customerComment: payload.comment,
      contactMethod: payload.contactMethod,
      deliveryRequired: totals.deliveryRequired,
      deliveryCity: totals.deliveryRequired ? payload.city : null,
      deliveryCountry: totals.deliveryRequired ? payload.country : null,
      deliveryAddress1: totals.deliveryRequired ? payload.addressLine1 : null,
      deliveryAddress2: totals.deliveryRequired ? payload.addressLine2 : null,
      deliveryPostalCode: totals.deliveryRequired ? payload.postalCode : null,
      items: {
        create: items.map((item) => ({
          itemType: item.type === "product" ? "PRODUCT" : "SERVICE",
          titleSnapshot: item.title,
          priceSnapshot: item.unitAmount,
          priceSnapshotRub: item.priceRub,
          priceSnapshotUsd: item.priceUsd,
          quantity: item.quantity,
          imageSnapshot: item.image,
          productId: item.type === "product" ? item.catalogId : null,
          serviceId: item.type === "service" ? item.catalogId : null
        }))
      },
      payments: {
        create: {
          provider: PaymentProvider.MANUAL,
          status: PaymentStatus.NOT_ISSUED,
          amount: totals.totalAmount,
          currency: items[0]?.currency ?? Currency.RUB
        }
      }
    }
  });

  await prisma.request.create({
    data: {
      requestNumber: nextNumber("REQ"),
      source: "checkout",
      customerId: user.id,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      telegram: payload.telegram,
      selectedProductId: items.find((item) => item.type === "product")?.catalogId ?? null,
      selectedServiceId: items.find((item) => item.type === "service")?.catalogId ?? null,
      comment: payload.comment,
      status: RequestStatus.NEW
    }
  });

  await prisma.statusHistory.create({
    data: {
      entityType: "ORDER",
      entityId: order.id,
      orderId: order.id,
      changedById: user.id,
      newStatus: "NEW",
      comment: "Заказ создан через checkout."
    }
  });

  if (payload.uploadedFileIds.length > 0) {
    await prisma.customerFile.updateMany({
      where: {
        id: { in: payload.uploadedFileIds },
        customerId: user.id,
        orderId: null
      },
      data: { orderId: order.id }
    });
  }

  if (uploadedFiles.length > 0) {
    await prisma.customerFile.updateMany({
      where: {
        id: { in: uploadedFiles.map((file) => file.id) },
        customerId: user.id
      },
      data: { orderId: order.id }
    });
  }

  await createUserSession(user.id);

  return {
    orderId: order.id,
    orderNumber: order.orderNumber
  };
}
