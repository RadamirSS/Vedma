import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const KNOWN_ORDER_NUMBERS = ["ORD-20260629-042AGC", "ORD-20260629-UKELYU"];

async function main() {
  const orders = await prisma.order.updateMany({
    where: {
      OR: [
        { customerEmail: { contains: "test+pkg33", mode: "insensitive" } },
        { orderNumber: { in: KNOWN_ORDER_NUMBERS } }
      ],
      isTest: false
    },
    data: {
      isTest: true,
      testLabel: "pkg33-smoke"
    }
  });

  const payments = await prisma.payment.updateMany({
    where: {
      order: { isTest: true },
      isTest: false
    },
    data: { isTest: true }
  });

  const testOrders = await prisma.order.findMany({
    where: { isTest: true },
    select: { id: true, customerId: true, createdAt: true }
  });

  let requestsUpdated = 0;
  for (const order of testOrders) {
    const result = await prisma.request.updateMany({
      where: {
        customerId: order.customerId,
        source: "checkout",
        isTest: false,
        createdAt: {
          gte: new Date(order.createdAt.getTime() - 5 * 60 * 1000),
          lte: new Date(order.createdAt.getTime() + 5 * 60 * 1000)
        }
      },
      data: {
        isTest: true,
        testLabel: "pkg33-smoke"
      }
    });
    requestsUpdated += result.count;
  }

  const demoOrderCount = await prisma.order.count({ where: { isTest: true } });

  console.log(
    JSON.stringify(
      {
        ordersMarked: orders.count,
        paymentsMarked: payments.count,
        requestsMarked: requestsUpdated,
        totalTestOrders: demoOrderCount
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "mark-test-orders failed");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
