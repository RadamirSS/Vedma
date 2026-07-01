import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const slugs = [
    "pkg33-upload-product-1782759721600",
    "pkg33-upload-service-1782759768353"
  ];
  const [products, services] = await Promise.all([
    prisma.product.deleteMany({ where: { slug: { in: slugs } } }),
    prisma.service.deleteMany({ where: { slug: { in: slugs } } })
  ]);
  console.log(`Deleted products: ${products.count}, services: ${services.count}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
