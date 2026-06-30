"use server";

import { redirect } from "next/navigation";
import { ContactMethod, Role } from "@prisma/client";

import { createCheckoutOrder } from "@/lib/commerce/checkout";
import { authenticateUser, createCustomerSession, getCurrentCustomerSession } from "@/lib/auth/session";
import { getSafeCustomerRedirectPath } from "@/lib/auth/safe-redirect";

export type CheckoutActionState = {
  success: boolean;
  message: string | null;
  redirectTo: string | null;
  orderId: string | null;
  orderNumber: string | null;
  fieldErrors?: Record<string, string>;
};

function toNullableString(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function parseCartEntries(value: string | null) {
  if (!value) {
    return [];
  }

  const parsed = JSON.parse(value) as Array<{ type: "product" | "service"; slug: string; qty: number }>;
  return parsed.filter(
    (item) =>
      (item.type === "product" || item.type === "service") &&
      typeof item.slug === "string" &&
      typeof item.qty === "number"
  );
}

function parseAddressMeta(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function emptyErrorState(message: string | null, fieldErrors: Record<string, string>): CheckoutActionState {
  return {
    success: false,
    message,
    redirectTo: null,
    orderId: null,
    orderNumber: null,
    fieldErrors
  };
}

async function resolveCartFlags(cartEntries: ReturnType<typeof parseCartEntries>) {
  const { resolveCartEntries, getCartTotals } = await import("@/lib/commerce/cart");
  const items = await resolveCartEntries(cartEntries);
  const totals = getCartTotals(items);
  return { items, totals };
}

export async function checkoutCustomerLoginAction(formData: FormData) {
  const email = toNullableString(formData.get("email"))?.toLowerCase();
  const password = toNullableString(formData.get("password"));

  if (!email || !password) {
    redirect("/checkout?error=" + encodeURIComponent("Введите email и пароль для входа."));
  }

  const user = await authenticateUser(email, password);
  if (!user || user.role !== Role.CUSTOMER) {
    redirect(
      "/checkout?error=" + encodeURIComponent("Неверные учетные данные или это не аккаунт клиента.")
    );
  }

  await createCustomerSession(user.id);
  redirect(getSafeCustomerRedirectPath("/checkout"));
}

export async function submitCheckoutAction(
  _prevState: CheckoutActionState,
  formData: FormData
): Promise<CheckoutActionState> {
  const fieldErrors: Record<string, string> = {};

  try {
    const cartEntries = parseCartEntries(toNullableString(formData.get("cartEntries")));
    if (cartEntries.length === 0) {
      return emptyErrorState("Корзина пуста.", { cart: "Добавьте товары или услуги из каталога." });
    }

    const { totals } = await resolveCartFlags(cartEntries);
    const hasProducts = totals.deliveryRequired;
    const hasServices = totals.hasServices;

    const session = await getCurrentCustomerSession();
    const isLoggedIn = Boolean(session);
    const accountMode = isLoggedIn
      ? "existing"
      : (toNullableString(formData.get("accountMode")) as "new" | "existing" | null) ?? "new";

    const name = toNullableString(formData.get("name")) ?? session?.user.name ?? null;
    const email = toNullableString(formData.get("email"))?.toLowerCase() ?? "";
    const emailConfirm = toNullableString(formData.get("emailConfirm"))?.toLowerCase() ?? "";
    const password = toNullableString(formData.get("password")) ?? "";
    const passwordConfirm = toNullableString(formData.get("passwordConfirm")) ?? "";
    const phone = toNullableString(formData.get("phone"));
    const telegram = toNullableString(formData.get("telegram"));

    if (!isLoggedIn && accountMode === "new") {
      if (!name) {
        fieldErrors.name = "Укажите имя.";
      }
      if (!email) {
        fieldErrors.email = "Укажите email.";
      }
      if (!emailConfirm) {
        fieldErrors.emailConfirm = "Повторите email.";
      } else if (email && email !== emailConfirm) {
        fieldErrors.emailConfirm = "Email и повтор не совпадают.";
      }
      if (!password) {
        fieldErrors.password = "Укажите пароль.";
      } else if (password.length < 8) {
        fieldErrors.password = "Пароль должен содержать минимум 8 символов.";
      }
      if (!passwordConfirm) {
        fieldErrors.passwordConfirm = "Повторите пароль.";
      } else if (password && password !== passwordConfirm) {
        fieldErrors.passwordConfirm = "Пароли не совпадают.";
      }
    } else if (!isLoggedIn && accountMode === "existing") {
      if (!email) {
        fieldErrors.email = "Укажите email.";
      }
      if (!password) {
        fieldErrors.password = "Укажите пароль.";
      }
    } else if (isLoggedIn) {
      if (!name) {
        fieldErrors.name = "Укажите имя.";
      }
    }

    if (hasProducts && !phone) {
      fieldErrors.phone = "Для доставки товара укажите телефон.";
    }

    if (hasServices && !hasProducts && !phone && !telegram) {
      fieldErrors.phone = "Укажите телефон или Telegram для связи.";
    }

    const country = toNullableString(formData.get("country"));
    const city = toNullableString(formData.get("city"));
    const street = toNullableString(formData.get("street"));
    const house = toNullableString(formData.get("house"));
    const addressLine1 = toNullableString(formData.get("addressLine1"));
    const addressFull = toNullableString(formData.get("addressFull"));

    if (hasProducts) {
      const hasAddress =
        Boolean(addressFull?.trim()) ||
        Boolean(addressLine1?.trim()) ||
        Boolean(street?.trim() && house?.trim());

      if (!hasAddress) {
        fieldErrors.addressFull = "Укажите адрес доставки или выберите подсказку.";
      }
      if (!country) {
        fieldErrors.country = "Укажите страну.";
      }
      if (!city) {
        fieldErrors.city = "Укажите город.";
      }
    }

    if (formData.get("ageConfirmed") !== "yes") {
      fieldErrors.ageConfirmed = "Подтвердите, что вам исполнилось 18 лет.";
    }
    if (formData.get("legalAccepted") !== "yes") {
      fieldErrors.legalAccepted = "Нужно согласие с политикой конфиденциальности и офертой.";
    }

    if (Object.keys(fieldErrors).length > 0) {
      return emptyErrorState("Проверьте выделенные поля.", fieldErrors);
    }

    const order = await createCheckoutOrder({
      cartEntries,
      accountMode: isLoggedIn ? "existing" : accountMode,
      email: isLoggedIn ? session!.user.email : email,
      password: isLoggedIn ? "" : password,
      name: name ?? session?.user.name ?? null,
      phone: phone ?? session?.user.phone ?? null,
      telegram: telegram ?? session?.user.telegram ?? null,
      contactMethod: (toNullableString(formData.get("contactMethod")) as ContactMethod | null) ?? ContactMethod.TELEGRAM,
      city,
      country,
      region: toNullableString(formData.get("region")),
      street,
      house,
      flat: toNullableString(formData.get("flat")),
      addressLine1,
      addressLine2: toNullableString(formData.get("addressLine2")),
      postalCode: toNullableString(formData.get("postalCode")),
      addressFull,
      addressProvider: toNullableString(formData.get("addressProvider")),
      addressMeta: parseAddressMeta(toNullableString(formData.get("addressMeta"))),
      preferredContactAt: toNullableString(formData.get("preferredContactAt")),
      serviceComment: toNullableString(formData.get("serviceComment")),
      birthDate: null,
      comment: toNullableString(formData.get("comment")),
      currentSessionUserId: session?.user.id ?? null
    });

    return {
      success: true,
      message: null,
      redirectTo: `/account/orders/${order.orderId}`,
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      fieldErrors: undefined
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось оформить заказ.";
    const lower = message.toLowerCase();

    if (lower.includes("email") && lower.includes("зарегистрирован")) {
      return emptyErrorState(message, { email: message });
    }
    if (lower.includes("аккаунт") && lower.includes("не найден")) {
      return emptyErrorState(message, { email: message });
    }
    if (lower.includes("парол")) {
      return emptyErrorState(message, { password: message });
    }
    if (lower.includes("адрес") || lower.includes("доставк")) {
      return emptyErrorState(message, { addressFull: message });
    }
    if (lower.includes("телефон")) {
      return emptyErrorState(message, { phone: message });
    }

    return emptyErrorState(message, {});
  }
}
