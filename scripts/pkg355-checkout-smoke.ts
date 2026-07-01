import { PaymentStatus } from "@prisma/client";

import { createCheckoutOrder } from "@/lib/commerce/checkout";
import { prisma } from "@/lib/db/prisma";

async function smoke(label: string, email: string) {
  const result = await createCheckoutOrder({
    cartEntries: [{ type: "service", slug: "obryad-svaroga-kovanaya-sudba", qty: 1 }],
    accountMode: "new",
    email,
    password: "TestPkg355!Smoke",
    name: `Pkg355 ${label}`,
    phone: "+79990000000",
    telegram: "@pkg355smoke",
    contactMethod: "TELEGRAM",
    city: null,
    country: null,
    region: null,
    street: null,
    house: null,
    flat: null,
    addressLine1: null,
    addressLine2: null,
    postalCode: null,
    addressFull: null,
    addressProvider: null,
    addressMeta: null,
    preferredContactAt: null,
    serviceComment: `pkg355 smoke ${label}`,
    birthDate: null,
    comment: null,
    currentSessionUserId: null
  });

  const order = await prisma.order.findUnique({
    where: { id: result.orderId },
    include: { payments: true }
  });

  await prisma.$transaction([
    prisma.order.update({
      where: { id: result.orderId },
      data: { paymentStatus: PaymentStatus.PENDING }
    }),
    prisma.payment.updateMany({
      where: { orderId: result.orderId },
      data: { status: PaymentStatus.PENDING }
    })
  ]);

  const after = await prisma.order.findUnique({ where: { id: result.orderId } });

  console.log(
    JSON.stringify({
      label,
      orderNumber: result.orderNumber,
      paymentStatus: after?.paymentStatus,
      totalRub: order?.totalAmountRub
    })
  );
}

async function main() {
  const ts = process.env.TS ?? String(Date.now());
  await smoke("EN", `test+pkg355-en-${ts}@bajena.it`);
  await smoke("RU", `test+pkg355-ru-${ts}@bajena.it`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
