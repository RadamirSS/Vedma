"use server";

import { redirect } from "next/navigation";
import { ContactMethod, Role } from "@prisma/client";

import { createCheckoutOrder } from "@/lib/commerce/checkout";
import { authenticateUser, createCustomerSession, getCurrentCustomerSession } from "@/lib/auth/session";
import { getSafeCustomerRedirectPath } from "@/lib/auth/safe-redirect";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionarySync } from "@/lib/i18n/get-dictionary";
import { mapCheckoutServerError } from "@/lib/i18n/map-checkout-error";
import { localizeHref } from "@/lib/i18n/routing";

export type CheckoutActionState = {
  success: boolean;
  message: string | null;
  redirectTo: string | null;
  orderId: string | null;
  orderNumber: string | null;
  fieldErrors?: Record<string, string>;
};

function getLocaleFromForm(formData: FormData): Locale {
  const raw = typeof formData.get("locale") === "string" ? (formData.get("locale") as string).trim() : "";
  return raw && isLocale(raw) ? raw : defaultLocale;
}

function localePath(locale: Locale, path: string) {
  return localizeHref(locale, path);
}

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
  const locale = getLocaleFromForm(formData);
  const dict = getDictionarySync(locale);
  const v = dict.checkout.validation;
  const email = toNullableString(formData.get("email"))?.toLowerCase();
  const password = toNullableString(formData.get("password"));

  if (!email || !password) {
    redirect(`${localePath(locale, "/checkout")}?error=${encodeURIComponent(v.enterEmailPassword)}`);
  }

  const user = await authenticateUser(email, password);
  if (!user || user.role !== Role.CUSTOMER) {
    redirect(`${localePath(locale, "/checkout")}?error=${encodeURIComponent(v.invalidCustomerLogin)}`);
  }

  await createCustomerSession(user.id);
  redirect(getSafeCustomerRedirectPath(localePath(locale, "/checkout")));
}

export async function submitCheckoutAction(
  _prevState: CheckoutActionState,
  formData: FormData
): Promise<CheckoutActionState> {
  const locale = getLocaleFromForm(formData);
  const dict = getDictionarySync(locale);
  const v = dict.checkout.validation;
  const fieldErrors: Record<string, string> = {};

  try {
    const cartEntries = parseCartEntries(toNullableString(formData.get("cartEntries")));
    if (cartEntries.length === 0) {
      return emptyErrorState(v.cartEmpty, { cart: v.addItems });
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
        fieldErrors.name = v.nameRequired;
      }
      if (!email) {
        fieldErrors.email = v.emailRequired;
      }
      if (!emailConfirm) {
        fieldErrors.emailConfirm = v.emailConfirmRequired;
      } else if (email && email !== emailConfirm) {
        fieldErrors.emailConfirm = v.emailMismatch;
      }
      if (!password) {
        fieldErrors.password = v.passwordRequired;
      } else if (password.length < 8) {
        fieldErrors.password = v.passwordTooShort;
      }
      if (!passwordConfirm) {
        fieldErrors.passwordConfirm = v.passwordConfirmRequired;
      } else if (password && password !== passwordConfirm) {
        fieldErrors.passwordConfirm = v.passwordMismatch;
      }
    } else if (!isLoggedIn && accountMode === "existing") {
      if (!email) {
        fieldErrors.email = v.emailRequired;
      }
      if (!password) {
        fieldErrors.password = v.passwordRequired;
      }
    } else if (isLoggedIn) {
      if (!name) {
        fieldErrors.name = v.nameRequired;
      }
    }

    if (hasProducts && !phone) {
      fieldErrors.phone = v.phoneRequiredForDelivery;
    }

    if (hasServices && !hasProducts && !phone && !telegram) {
      fieldErrors.phone = v.phoneOrTelegramRequired;
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
        fieldErrors.addressFull = v.addressRequired;
      }
      if (!country) {
        fieldErrors.country = v.countryRequired;
      }
      if (!city) {
        fieldErrors.city = v.cityRequired;
      }
    }

    if (formData.get("ageConfirmed") !== "yes") {
      fieldErrors.ageConfirmed = v.ageRequired;
    }
    if (formData.get("legalAccepted") !== "yes") {
      fieldErrors.legalAccepted = v.legalRequired;
    }

    if (Object.keys(fieldErrors).length > 0) {
      return emptyErrorState(v.checkHighlightedFields, fieldErrors);
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
      redirectTo: localePath(locale, `/account/orders/${order.orderId}`),
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      fieldErrors: undefined
    };
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : v.checkoutFailed;
    const mapped = mapCheckoutServerError(rawMessage, dict);
    const fieldErrorsFromError = mapped.field ? { [mapped.field]: mapped.message } : {};
    return emptyErrorState(mapped.message, fieldErrorsFromError);
  }
}
