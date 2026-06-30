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
import { getDictionarySync } from "@/lib/i18n/get-dictionary";
import { mapRegisterServerError } from "@/lib/i18n/map-checkout-error";
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
  const m = getDictionarySync(locale).account.messages;
  const email = toNullableString(formData.get("email"))?.toLowerCase();
  const password = toNullableString(formData.get("password"));
  const nextRaw = getSafeCustomerRedirectPath(toNullableString(formData.get("next")));
  const next = nextRaw.startsWith(`/${locale}`) ? nextRaw : localePath(locale, nextRaw);

  if (!email || !password) {
    redirect(`${localePath(locale, "/account/login")}?error=${encodeNotice(m.enterEmailPassword)}`);
  }

  const user = await authenticateUser(email, password);
  if (!user) {
    redirect(`${localePath(locale, "/account/login")}?error=${encodeNotice(m.invalidCredentials)}`);
  }

  if (user.role !== Role.CUSTOMER) {
    redirect(
      `${localePath(locale, "/account/login")}?error=${encodeNotice(m.customerAccountRequired)}`
    );
  }

  await createCustomerSession(user.id);
  redirect(next);
}

export async function customerRegisterAction(formData: FormData) {
  const locale = getLocaleFromForm(formData);
  const m = getDictionarySync(locale).account.messages;
  const name = toNullableString(formData.get("name"));
  const email = toNullableString(formData.get("email"))?.toLowerCase();
  const password = toNullableString(formData.get("password")) ?? "";
  const phone = toNullableString(formData.get("phone"));
  const telegram = toNullableString(formData.get("telegram"));

  const emailConfirm = toNullableString(formData.get("emailConfirm"))?.toLowerCase();
  const passwordConfirm = toNullableString(formData.get("passwordConfirm"));

  if (formData.get("legalAccepted") !== "yes") {
    redirect(`${localePath(locale, "/account/register")}?error=${encodeNotice(m.legalRequired)}`);
  }

  if (!name || !email) {
    redirect(`${localePath(locale, "/account/register")}?error=${encodeNotice(m.nameEmailRequired)}`);
  }

  if (!emailConfirm) {
    redirect(`${localePath(locale, "/account/register")}?error=${encodeNotice(m.emailConfirmRequired)}`);
  }

  if (email !== emailConfirm) {
    redirect(`${localePath(locale, "/account/register")}?error=${encodeNotice(m.emailMismatch)}`);
  }

  if (!passwordConfirm) {
    redirect(`${localePath(locale, "/account/register")}?error=${encodeNotice(m.passwordConfirmRequired)}`);
  }

  if (password !== passwordConfirm) {
    redirect(`${localePath(locale, "/account/register")}?error=${encodeNotice(m.passwordMismatch)}`);
  }

  let userId: string;
  try {
    const user = await createCustomerAccount({ email, password, name, phone, telegram });
    userId = user.id;
  } catch (error) {
    const raw = error instanceof Error ? error.message : "";
    const message = raw ? mapRegisterServerError(raw, getDictionarySync(locale)) : m.registerFailed;
    redirect(`${localePath(locale, "/account/register")}?error=${encodeNotice(message)}`);
  }

  await createCustomerSession(userId);
  redirect(`${localePath(locale, "/account")}?success=${encodeNotice(m.registerSuccess)}`);
}

export async function customerLogoutAction(formData: FormData) {
  const locale = getLocaleFromForm(formData);
  const m = getDictionarySync(locale).account.messages;
  await clearCustomerSession();
  redirect(`${localePath(locale, "/account/login")}?success=${encodeNotice(m.signedOut)}`);
}

export type CustomerMarkPaidState = {
  success: boolean;
  message: string | null;
};

async function markOrderPaidCore(formData: FormData, sessionUserId: string, locale: Locale) {
  const m = getDictionarySync(locale).account.messages;
  const orderId = toNullableString(formData.get("orderId"));

  if (!orderId) {
    return { success: false, message: m.orderMissing };
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, customerId: sessionUserId },
    include: { payments: true }
  });

  if (!order) {
    return { success: false, message: m.orderNotFound };
  }

  if (!MARKABLE_PAYMENT_STATUSES.includes(order.paymentStatus)) {
    return {
      success: true,
      message: m.paymentMarkAlreadySubmitted
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
    message: m.paymentMarkSubmitted
  };
}

export async function customerMarkOrderPaidFormAction(formData: FormData) {
  const locale = getLocaleFromForm(formData);
  const m = getDictionarySync(locale).account.messages;
  const loginPath = localePath(locale, "/account/login");
  const session = await requireCustomerSession(loginPath);
  const returnToRaw = getSafeCustomerRedirectPath(toNullableString(formData.get("returnTo")));
  const returnTo = returnToRaw.startsWith(`/${locale}`) ? returnToRaw : localePath(locale, returnToRaw);
  const result = await markOrderPaidCore(formData, session.user.id, locale);

  if (!result.success) {
    redirect(`${returnTo}?error=${encodeNotice(result.message ?? m.paymentMarkFailed)}`);
  }

  redirect(`${returnTo}?success=${encodeNotice(result.message ?? m.paymentMarkSent)}`);
}

export async function customerMarkOrderPaidAction(
  _prevState: CustomerMarkPaidState,
  formData: FormData
): Promise<CustomerMarkPaidState> {
  const locale = getLocaleFromForm(formData);
  const session = await requireCustomerSession(localePath(locale, "/account/login"));
  return markOrderPaidCore(formData, session.user.id, locale);
}

export async function updateCustomerProfileAction(formData: FormData) {
  const locale = getLocaleFromForm(formData);
  const m = getDictionarySync(locale).account.messages;
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
  redirect(`${localePath(locale, "/account/profile")}?success=${encodeNotice(m.profileUpdated)}`);
}
