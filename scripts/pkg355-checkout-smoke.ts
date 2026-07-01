import {
  ContactMethod,
  Currency,
  PaymentProvider,
  PaymentStatus,
  RequestStatus,
  Role
} from "@prisma/client";

import { resolveCheckoutTestFlags } from "@/lib/admin/commerce-filters";
import { hashPassword } from "@/lib/auth/password";
import { getCartTotals, resolveCartEntries } from "@/lib/commerce/cart";
import { prisma } from "@/lib/db/prisma";

function nextNumber(prefix: string) {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${stamp}-${suffix}`;
}

async function smoke(label: string, email: string) {
  const cartEntries = [{ type: "service" as const, slug: "obryad-svaroga-kovanaya-sudba", qty: 1 }];
  const items = await resolveCartEntries(cartEntries);
  const totals = getCartTotals(items);
  const testFlags = resolveCheckoutTestFlags(email);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: `Pkg355 ${label}`,
      phone: "+79990000000",
      telegram: "@pkg355smoke"
    },
    create: {
      email,
      passwordHash: hashPassword("TestPkg355!Smoke"),
      name: `Pkg355 ${label}`,
      phone: "+79990000000",
      telegram: "@pkg355smoke",
      role: Role.CUSTOMER
    }
  });

  const order = await prisma.order.create({
    data: {
      orderNumber: nextNumber("ORD"),
      customerId: user.id,
      status: "NEW",
      paymentStatus: PaymentStatus.NOT_ISSUED,
      currency: items[0]?.currency ?? Currency.RUB,
      totalAmount: totals.totalAmount,
      totalAmountRub: totals.totalAmountRub || null,
      totalAmountUsd: totals.totalAmountUsd || null,
      customerName: user.name,
      customerEmail: email,
      customerPhone: user.phone,
      customerTelegram: user.telegram,
      customerComment: `pkg355 smoke ${label}`,
      contactMethod: ContactMethod.TELEGRAM,
      deliveryRequired: false,
      isTest: testFlags.isTest,
      testLabel: testFlags.testLabel,
      items: {
        create: items.map((item) => ({
          itemType: "SERVICE",
          titleSnapshot: item.title,
          priceSnapshot: item.unitAmount,
          priceSnapshotRub: item.priceRub,
          priceSnapshotUsd: item.priceUsd,
          quantity: item.quantity,
          imageSnapshot: item.image,
          serviceId: item.catalogId
        }))
      },
      payments: {
        create: {
          provider: PaymentProvider.MANUAL,
          status: PaymentStatus.NOT_ISSUED,
          amount: totals.totalAmount,
          currency: items[0]?.currency ?? Currency.RUB,
          isTest: testFlags.isTest
        }
      }
    }
  });

  await prisma.request.create({
    data: {
      requestNumber: nextNumber("REQ"),
      source: "checkout",
      customerId: user.id,
      name: user.name,
      email,
      phone: user.phone,
      telegram: user.telegram,
      selectedServiceId: items[0]?.catalogId ?? null,
      comment: `pkg355 smoke ${label}`,
      status: RequestStatus.NEW,
      isTest: testFlags.isTest,
      testLabel: testFlags.testLabel
    }
  });

  await prisma.statusHistory.create({
    data: {
      entityType: "ORDER",
      entityId: order.id,
      orderId: order.id,
      changedById: user.id,
      newStatus: "NEW",
      comment: "Заказ создан через pkg355 smoke script."
    }
  });

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: PaymentStatus.PENDING }
    }),
    prisma.payment.updateMany({
      where: { orderId: order.id },
      data: { status: PaymentStatus.PENDING }
    }),
    prisma.statusHistory.create({
      data: {
        entityType: "ORDER",
        entityId: order.id,
        orderId: order.id,
        changedById: user.id,
        newStatus: order.status,
        comment: "Клиент отметил оплату через временную заглушку."
      }
    })
  ]);

  const after = await prisma.order.findUnique({ where: { id: order.id } });

  console.log(
    JSON.stringify({
      label,
      orderNumber: order.orderNumber,
      paymentStatus: after?.paymentStatus,
      totalRub: order.totalAmountRub
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
