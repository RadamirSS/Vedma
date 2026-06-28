"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { clearCurrentSession, createUserSession, authenticateUser, requireCustomerSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

function encodeNotice(message: string) {
  return encodeURIComponent(message);
}

function toNullableString(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function customerLoginAction(formData: FormData) {
  const email = toNullableString(formData.get("email"))?.toLowerCase();
  const password = toNullableString(formData.get("password"));
  const next = toNullableString(formData.get("next")) ?? "/account/orders";

  if (!email || !password) {
    redirect(`/account/login?error=${encodeNotice("Введите email и пароль.")}`);
  }

  const user = await authenticateUser(email, password);
  if (!user) {
    redirect(`/account/login?error=${encodeNotice("Неверные учетные данные.")}`);
  }

  await createUserSession(user.id);
  redirect(next);
}

export async function customerLogoutAction() {
  await clearCurrentSession();
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
