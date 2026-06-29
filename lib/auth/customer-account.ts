import { Role } from "@prisma/client";

import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db/prisma";

export type CreateCustomerAccountInput = {
  email: string;
  password: string;
  name: string;
  phone?: string | null;
  telegram?: string | null;
};

export async function assertCustomerEmailAvailable(email: string) {
  const existing = await prisma.user.findUnique({ where: { email } });

  if (!existing) {
    return null;
  }

  if (existing.role === Role.CUSTOMER) {
    throw new Error("Аккаунт с таким email уже существует. Войдите или восстановите доступ через вход.");
  }

  throw new Error("Этот email зарезервирован. Используйте другой адрес или обратитесь к администратору.");
}

export async function createCustomerAccount(input: CreateCustomerAccountInput) {
  const email = input.email.trim().toLowerCase();

  if (!email) {
    throw new Error("Email обязателен.");
  }

  if (!input.name.trim()) {
    throw new Error("Укажите имя.");
  }

  if (input.password.length < 8) {
    throw new Error("Пароль должен содержать минимум 8 символов.");
  }

  await assertCustomerEmailAvailable(email);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: hashPassword(input.password),
      name: input.name.trim(),
      phone: input.phone?.trim() || null,
      telegram: input.telegram?.trim() || null,
      role: Role.CUSTOMER
    }
  });

  await prisma.customerProfile.create({
    data: { userId: user.id }
  });

  return user;
}
