import { PrismaClient, Role } from "@prisma/client";

import { hashPassword } from "../lib/auth/password";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.DEMO_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.DEMO_ADMIN_PASSWORD?.trim();
  const name = process.env.DEMO_ADMIN_NAME?.trim() || "Vedma Demo";

  if (!email || !password) {
    throw new Error(
      "DEMO_ADMIN_EMAIL and DEMO_ADMIN_PASSWORD are required for db:seed:demo."
    );
  }

  if (password.length < 8) {
    throw new Error("DEMO_ADMIN_PASSWORD must contain at least 8 characters.");
  }

  await prisma.user.upsert({
    where: { email },
    update: {
      role: Role.DEMO,
      name,
      isActive: true,
      passwordHash: hashPassword(password)
    },
    create: {
      email,
      role: Role.DEMO,
      name,
      isActive: true,
      passwordHash: hashPassword(password)
    }
  });

  console.log(`Demo admin ready: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
