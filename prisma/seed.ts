import { PrismaClient, Role } from "@prisma/client";

import { hashPassword } from "../lib/auth/password";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD?.trim();

  if (!email) {
    console.warn("ADMIN_EMAIL is not set. Skipping admin seed.");
    return;
  }

  await prisma.user.upsert({
    where: { email },
    update: {
      role: Role.ADMIN,
      isActive: true,
      passwordHash: password ? hashPassword(password) : null
    },
    create: {
      email,
      role: Role.ADMIN,
      isActive: true,
      passwordHash: password ? hashPassword(password) : null
    }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
