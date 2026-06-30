"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { PaymentStatus, Role } from "@prisma/client";

import {
  clearCustomerSession,
  createCustomerSession,
  authenticateUser,
  requireCustomerSession
} from "@/lib/auth/session";
import { createCustomerAccount } from "@/lib/auth/customer-account";
import { getSafeCustomerRedirectPath } from "@/lib/auth/safe-redirect";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";
import { localizeHref } from "@/lib/i18n/routing";
import { prisma } from "@/lib/db/prisma";

function encodeNotice(message: string) {
  return encodeURIComponent(message);
}

function toNullableString(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getLocaleFromForm(formData: FormData): Locale {
  const locale = toNullableString(formData.get("locale"));
  return locale && isLocale(locale) ? locale : defaultLocale;
}

function localePath(locale: Locale, path: string) {
  return localizeHref(locale, path);
}

const MARKABLE_PAYMENT_STATUSES: PaymentStatus[] = ["NOT_ISSUED", "INVOICE_SENT"];

export async function customerLoginAction(formData: FormData) {
  const locale = getLocaleFromForm(formData);
  const email = toNullableString(formData.get("email"))?.toLowerCase();
  const password = toNullableString(formData.get("password"));
  const nextRaw = getSafeCustomerRedirectPath(toNullableString(formData.get("next")));
  const next = nextRaw.startsWith(`/${locale}`) ? nextRaw : localePath(locale, nextRaw);

  if (!email || !password) {
    redirect(`${localePath(locale, "/account/login")}?error=${encodeNotice("Введите email и пароль.")}`);
  }

  const user = await authenticateUser(email, password);
  if (!user) {
    redirect(`${localePath(locale, "/account/login")}?error=${encodeNotice("Неверные учетные данные.")}`);
  }

  if (user.role !== Role.CUSTOMER) {
    redirect(
      `${localePath(locale, "/account/login")}?error=${encodeNotice("Для входа в кабинет клиента используйте учетную запись клиента.")}`
    );
  }

  await createCustomerSession(user.id);
  redirect(next);
}

export async function customerRegisterAction(formData: FormData) {
  const locale = getLocaleFromForm(formData);
  const name = toNullableString(formData.get("name"));
  const email = toNullableString(formData.get("email"))?.toLowerCase();
  const password = toNullableString(formData.get("password")) ?? "";
  const phone = toNullableString(formData.get("phone"));
  const telegram = toNullableString(formData.get("telegram"));

  const emailConfirm = toNullableString(formData.get("emailConfirm"))?.toLowerCase();
  const passwordConfirm = toNullableString(formData.get("passwordConfirm"));

  if (formData.get("legalAccepted") !== "yes") {
    redirect(
      `${localePath(locale, "/account/register")}?error=${encodeNotice("Нужно согласие с политикой конфиденциальности и офертой.")}`
    );
  }

  if (!name || !email) {
    redirect(`${localePath(locale, "/account/register")}?error=${encodeNotice("Укажите имя и email.")}`);
  }

  if (!emailConfirm) {
    redirect(`${localePath(locale, "/account/register")}?error=${encodeNotice("Повторите email.")}`);
  }

  if (email !== emailConfirm) {
    redirect(`${localePath(locale, "/account/register")}?error=${encodeNotice("Email и повтор не совпадают.")}`);
  }

  if (!passwordConfirm) {
    redirect(`${localePath(locale, "/account/register")}?error=${encodeNotice("Повторите пароль.")}`);
  }

  if (password !== passwordConfirm) {
    redirect(`${localePath(locale, "/account/register")}?error=${encodeNotice("Пароли не совпадают.")}`);
  }

  let userId: string;
  try {
    const user = await createCustomerAccount({ email, password, name, phone, telegram });
    userId = user.id;
  } catch (error) {
    redirect(
      `${localePath(locale, "/account/register")}?error=${encodeNotice(error instanceof Error ? error.message : "Не удалось зарегистрироваться.")}`
    );
  }

  await createCustomerSession(userId);
  redirect(
    `${localePath(locale, "/account")}?success=${encodeNotice("Регистрация завершена. Добро пожаловать в кабинет.")}`
  );
}

export async function customerLogoutAction(formData: FormData) {
  const locale = getLocaleFromForm(formData);
  await clearCustomerSession();
  redirect(`${localePath(locale, "/account/login")}?success=${encodeNotice("Вы вышли из кабинета.")}`);
}

export type CustomerMarkPaidState = {
  success: boolean;
  message: string | null;
};

async function markOrderPaidCore(formData: FormData, sessionUserId: string) {
  const orderId = toNullableString(formData.get("orderId"));

  if (!orderId) {
    return { success: false, message: "Не указан заказ." };
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, customerId: sessionUserId },
    include: { payments: true }
  });

  if (!order) {
    return { success: false, message: "Заказ не найден." };
  }

  if (!MARKABLE_PAYMENT_STATUSES.includes(order.paymentStatus)) {
    return {
      success: true,
      message: "Отметка об оплате уже отправлена. Администратор проверит и обновит статус."
    };
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: PaymentStatus.PENDING }
    }),
    prisma.payment.updateMany({
      where: { orderId: order.id },
      data: { status: PaymentStatus.PENDING }
    }),
    prisma.statusHistory.create({
      data: {
        entityType: "ORDER",
        entityId: order.id,
        orderId: order.id,
        changedById: sessionUserId,
        newStatus: order.status,
        comment: "Клиент отметил оплату через временную заглушку."
      }
    })
  ]);

  revalidatePath("/account");
  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${order.id}`);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${order.id}`);
  revalidatePath("/admin/payments");
  revalidatePath("/checkout");

  return {
    success: true,
    message: "Отметка об оплате отправлена. Администратор проверит и обновит статус."
  };
}

export async function customerMarkOrderPaidFormAction(formData: FormData) {
  const locale = getLocaleFromForm(formData);
  const loginPath = localePath(locale, "/account/login");
  const session = await requireCustomerSession(loginPath);
  const returnToRaw = getSafeCustomerRedirectPath(toNullableString(formData.get("returnTo")));
  const returnTo = returnToRaw.startsWith(`/${locale}`) ? returnToRaw : localePath(locale, returnToRaw);
  const result = await markOrderPaidCore(formData, session.user.id);

  if (!result.success) {
    redirect(`${returnTo}?error=${encodeNotice(result.message ?? "Не удалось отметить оплату.")}`);
  }

  redirect(`${returnTo}?success=${encodeNotice(result.message ?? "Отметка отправлена.")}`);
}

export async function customerMarkOrderPaidAction(
  _prevState: CustomerMarkPaidState,
  formData: FormData
): Promise<CustomerMarkPaidState> {
  const locale = getLocaleFromForm(formData);
  const session = await requireCustomerSession(localePath(locale, "/account/login"));
  return markOrderPaidCore(formData, session.user.id);
}

export async function updateCustomerProfileAction(formData: FormData) {
  const locale = getLocaleFromForm(formData);
  const session = await requireCustomerSession(localePath(locale, "/account/profile"));

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: toNullableString(formData.get("name")),
      phone: toNullableString(formData.get("phone")),
      telegram: toNullableString(formData.get("telegram"))
    }
  });

  await prisma.customerProfile.upsert({
    where: { userId: session.user.id },
    update: {
      city: toNullableString(formData.get("city")),
      country: toNullableString(formData.get("country")),
      addressLine1: toNullableString(formData.get("addressLine1")),
      addressLine2: toNullableString(formData.get("addressLine2")),
      postalCode: toNullableString(formData.get("postalCode"))
    },
    create: {
      userId: session.user.id,
      city: toNullableString(formData.get("city")),
      country: toNullableString(formData.get("country")),
      addressLine1: toNullableString(formData.get("addressLine1")),
      addressLine2: toNullableString(formData.get("addressLine2")),
      postalCode: toNullableString(formData.get("postalCode"))
    }
  });

  revalidatePath("/account/profile");
  redirect(`${localePath(locale, "/account/profile")}?success=${encodeNotice("Профиль обновлен.")}`);
}
