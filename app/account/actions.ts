"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import {
  clearCustomerSession,
  createCustomerSession,
  authenticateUser,
  requireCustomerSession
} from "@/lib/auth/session";
import { createCustomerAccount } from "@/lib/auth/customer-account";
import { getSafeCustomerRedirectPath } from "@/lib/auth/safe-redirect";
import { prisma } from "@/lib/db/prisma";
import { Role } from "@prisma/client";

function encodeNotice(message: string) {
  return encodeURIComponent(message);
}

function toNullableString(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function customerLoginAction(formData: FormData) {
  const email = toNullableString(formData.get("email"))?.toLowerCase();
  const password = toNullableString(formData.get("password"));
  const next = getSafeCustomerRedirectPath(toNullableString(formData.get("next")));

  if (!email || !password) {
    redirect(`/account/login?error=${encodeNotice("Введите email и пароль.")}`);
  }

  const user = await authenticateUser(email, password);
  if (!user) {
    redirect(`/account/login?error=${encodeNotice("Неверные учетные данные.")}`);
  }

  if (user.role !== Role.CUSTOMER) {
    redirect(`/account/login?error=${encodeNotice("Для входа в кабинет клиента используйте учетную запись клиента.")}`);
  }

  await createCustomerSession(user.id);
  redirect(next);
}

export async function customerRegisterAction(formData: FormData) {
  const name = toNullableString(formData.get("name"));
  const email = toNullableString(formData.get("email"))?.toLowerCase();
  const password = toNullableString(formData.get("password")) ?? "";
  const phone = toNullableString(formData.get("phone"));
  const telegram = toNullableString(formData.get("telegram"));

  if (formData.get("legalAccepted") !== "yes") {
    redirect(`/account/register?error=${encodeNotice("Нужно согласие с политикой конфиденциальности и офертой.")}`);
  }

  if (!name || !email) {
    redirect(`/account/register?error=${encodeNotice("Укажите имя и email.")}`);
  }

  try {
    const user = await createCustomerAccount({ email, password, name, phone, telegram });
    await createCustomerSession(user.id);
    redirect("/account?success=" + encodeNotice("Регистрация завершена. Добро пожаловать в кабинет."));
  } catch (error) {
    redirect(
      `/account/register?error=${encodeNotice(error instanceof Error ? error.message : "Не удалось зарегистрироваться.")}`
    );
  }
}

export async function customerLogoutAction() {
  await clearCustomerSession();
  redirect("/account/login?success=" + encodeNotice("Вы вышли из кабинета."));
}

export async function updateCustomerProfileAction(formData: FormData) {
  const session = await requireCustomerSession("/account/profile");

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
  redirect("/account/profile?success=" + encodeNotice("Профиль обновлен."));
}
