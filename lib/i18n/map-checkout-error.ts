import type { Dictionary } from "@/lib/i18n/dictionaries/ru";

export function mapCheckoutServerError(message: string, dict: Dictionary) {
  const lower = message.toLowerCase();
  const v = dict.checkout.validation;

  if (lower.includes("зарегистрирован")) {
    return { message: v.existingEmailError, field: "email" as const };
  }
  if (lower.includes("не найден") && lower.includes("аккаунт")) {
    return { message: v.accountNotFoundError, field: "email" as const };
  }
  if (lower.includes("неверный пароль") || (lower.includes("парол") && lower.includes("провер"))) {
    return { message: v.wrongPasswordError, field: "password" as const };
  }
  if (lower.includes("адрес") || lower.includes("доставк")) {
    return { message: v.addressRequired, field: "addressFull" as const };
  }
  if (lower.includes("телефон")) {
    return { message: v.phoneOrTelegramRequired, field: "phone" as const };
  }
  if (lower.includes("корзина") || lower.includes("недоступн")) {
    return { message: v.cartUnavailable, field: "cart" as const };
  }

  return { message: v.checkoutFailed, field: undefined };
}

export function mapRegisterServerError(message: string, dict: Dictionary) {
  const lower = message.toLowerCase();
  const m = dict.account.messages;

  if (lower.includes("уже существует")) {
    return m.emailAlreadyExists;
  }
  if (lower.includes("зарезервирован")) {
    return m.emailReserved;
  }
  if (lower.includes("парол")) {
    return m.passwordTooShort;
  }
  if (lower.includes("email") && lower.includes("обязател")) {
    return m.nameEmailRequired;
  }
  if (lower.includes("имя")) {
    return m.nameEmailRequired;
  }

  return m.registerFailed;
}
