"use server";

import { ContactMethod } from "@prisma/client";

import { createCheckoutOrder } from "@/lib/commerce/checkout";
import { getCurrentCustomerSession } from "@/lib/auth/session";

export type CheckoutActionState = {
  success: boolean;
  message: string | null;
  redirectTo: string | null;
  orderId: string | null;
  orderNumber: string | null;
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

export async function submitCheckoutAction(
  _prevState: CheckoutActionState,
  formData: FormData
): Promise<CheckoutActionState> {
  try {
    const cartEntries = parseCartEntries(toNullableString(formData.get("cartEntries")));
    if (cartEntries.length === 0) {
      throw new Error("Корзина пуста.");
    }

    if (formData.get("ageConfirmed") !== "yes" || formData.get("legalAccepted") !== "yes") {
      throw new Error("Нужно подтвердить возраст и согласие с правилами.");
    }

    const session = await getCurrentCustomerSession();

    const order = await createCheckoutOrder({
      cartEntries,
      email: toNullableString(formData.get("email"))?.toLowerCase() ?? "",
      password: toNullableString(formData.get("password")) ?? "",
      name: toNullableString(formData.get("name")),
      phone: toNullableString(formData.get("phone")),
      telegram: toNullableString(formData.get("telegram")),
      contactMethod: (toNullableString(formData.get("contactMethod")) as ContactMethod | null) ?? ContactMethod.TELEGRAM,
      city: toNullableString(formData.get("city")),
      country: toNullableString(formData.get("country")),
      region: toNullableString(formData.get("region")),
      street: toNullableString(formData.get("street")),
      house: toNullableString(formData.get("house")),
      flat: toNullableString(formData.get("flat")),
      addressLine1: toNullableString(formData.get("addressLine1")),
      addressLine2: toNullableString(formData.get("addressLine2")),
      postalCode: toNullableString(formData.get("postalCode")),
      addressFull: toNullableString(formData.get("addressFull")),
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
      orderNumber: order.orderNumber
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Не удалось оформить заказ.",
      redirectTo: null,
      orderId: null,
      orderNumber: null
    };
  }
}
