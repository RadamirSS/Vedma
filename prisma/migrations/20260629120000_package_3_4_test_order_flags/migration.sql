-- Package 3.4: test order flags and delivery address fields

ALTER TABLE "Order" ADD COLUMN "deliveryRegion" TEXT;
ALTER TABLE "Order" ADD COLUMN "deliveryStreet" TEXT;
ALTER TABLE "Order" ADD COLUMN "deliveryHouse" TEXT;
ALTER TABLE "Order" ADD COLUMN "deliveryFlat" TEXT;
ALTER TABLE "Order" ADD COLUMN "deliveryAddressFull" TEXT;
ALTER TABLE "Order" ADD COLUMN "deliveryAddressProvider" TEXT;
ALTER TABLE "Order" ADD COLUMN "deliveryAddressMeta" JSONB;
ALTER TABLE "Order" ADD COLUMN "preferredContactAt" TEXT;
ALTER TABLE "Order" ADD COLUMN "isTest" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Order" ADD COLUMN "testLabel" TEXT;

ALTER TABLE "Request" ADD COLUMN "isTest" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Request" ADD COLUMN "testLabel" TEXT;

ALTER TABLE "Payment" ADD COLUMN "isTest" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "Order_isTest_idx" ON "Order"("isTest");
CREATE INDEX "Request_isTest_idx" ON "Request"("isTest");
CREATE INDEX "Payment_isTest_idx" ON "Payment"("isTest");

-- Backfill known smoke-test orders
UPDATE "Order"
SET "isTest" = true, "testLabel" = 'pkg33-smoke'
WHERE "customerEmail" ILIKE 'test+pkg33%@bajena.it'
   OR "orderNumber" IN ('ORD-20260629-042AGC', 'ORD-20260629-UKELYU');

UPDATE "Payment" p
SET "isTest" = true
FROM "Order" o
WHERE p."orderId" = o.id AND o."isTest" = true;

UPDATE "Request" r
SET "isTest" = true, "testLabel" = 'pkg33-smoke'
FROM "Order" o
WHERE r."customerId" = o."customerId"
  AND r."source" = 'checkout'
  AND o."isTest" = true
  AND r."createdAt" BETWEEN o."createdAt" - INTERVAL '5 minutes' AND o."createdAt" + INTERVAL '5 minutes';
