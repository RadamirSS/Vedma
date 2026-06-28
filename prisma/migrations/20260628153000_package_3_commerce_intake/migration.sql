-- CreateEnum
CREATE TYPE "ContactMethod" AS ENUM ('TELEGRAM', 'PHONE', 'EMAIL', 'VK', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "OrderItemType" AS ENUM ('PRODUCT', 'SERVICE');

-- CreateEnum
CREATE TYPE "StatusHistoryEntityType" AS ENUM ('ORDER', 'REQUEST');

-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('NEW', 'PENDING_CONFIRMATION', 'AWAITING_PAYMENT', 'PAID', 'IN_PROGRESS', 'READY_TO_SHIP', 'SHIPPED', 'COMPLETED', 'CANCELLED', 'REFUNDED');
ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "OrderStatus_old";
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'NEW';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentStatus_new" AS ENUM ('NOT_ISSUED', 'INVOICE_SENT', 'PENDING', 'PAID', 'PARTIAL', 'FAILED', 'EXPIRED', 'REFUNDED', 'CANCELLED');
ALTER TABLE "Order" ALTER COLUMN "paymentStatus" DROP DEFAULT;
ALTER TABLE "Payment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "paymentStatus" TYPE "PaymentStatus_new" USING ("paymentStatus"::text::"PaymentStatus_new");
ALTER TABLE "Payment" ALTER COLUMN "status" TYPE "PaymentStatus_new" USING ("status"::text::"PaymentStatus_new");
ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old";
ALTER TYPE "PaymentStatus_new" RENAME TO "PaymentStatus";
DROP TYPE "PaymentStatus_old";
ALTER TABLE "Order" ALTER COLUMN "paymentStatus" SET DEFAULT 'NOT_ISSUED';
ALTER TABLE "Payment" ALTER COLUMN "status" SET DEFAULT 'NOT_ISSUED';
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RequestStatus" ADD VALUE 'WAITING_FOR_CLIENT';
ALTER TYPE "RequestStatus" ADD VALUE 'AWAITING_PAYMENT';
ALTER TYPE "RequestStatus" ADD VALUE 'PAID';
ALTER TYPE "RequestStatus" ADD VALUE 'SPAM';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phone" TEXT,
ADD COLUMN     "telegram" TEXT,
ALTER COLUMN "role" SET DEFAULT 'CUSTOMER';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "adminComment" TEXT,
ADD COLUMN     "contactMethod" "ContactMethod",
ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'RUB',
ADD COLUMN     "customerComment" TEXT,
ADD COLUMN     "customerId" TEXT NOT NULL,
ADD COLUMN     "deliveryAddress1" TEXT,
ADD COLUMN     "deliveryAddress2" TEXT,
ADD COLUMN     "deliveryCity" TEXT,
ADD COLUMN     "deliveryCountry" TEXT,
ADD COLUMN     "deliveryPostalCode" TEXT,
ADD COLUMN     "deliveryRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requestSource" TEXT,
ADD COLUMN     "totalAmount" INTEGER NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'NEW',
ALTER COLUMN "paymentStatus" SET DEFAULT 'NOT_ISSUED';

-- AlterTable
ALTER TABLE "Request" DROP COLUMN "clientName",
ADD COLUMN     "adminComment" TEXT,
ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "responsibleUserId" TEXT,
ADD COLUMN     "selectedProductId" TEXT,
ADD COLUMN     "selectedServiceId" TEXT;

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "amountRub",
DROP COLUMN "amountUsd",
ADD COLUMN     "adminComment" TEXT,
ADD COLUMN     "amount" INTEGER NOT NULL,
ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'RUB',
ADD COLUMN     "paymentDate" TIMESTAMP(3),
ALTER COLUMN "status" SET DEFAULT 'NOT_ISSUED';

-- CreateTable
CREATE TABLE "CustomerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "city" TEXT,
    "country" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "postalCode" TEXT,
    "birthDate" TIMESTAMP(3),
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "itemType" "OrderItemType" NOT NULL,
    "productId" TEXT,
    "serviceId" TEXT,
    "titleSnapshot" TEXT NOT NULL,
    "priceSnapshot" INTEGER NOT NULL,
    "priceSnapshotRub" INTEGER,
    "priceSnapshotUsd" INTEGER,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "imageSnapshot" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerFile" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "orderId" TEXT,
    "originalName" TEXT NOT NULL,
    "storedPath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "adminOnly" BOOLEAN NOT NULL DEFAULT true,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusHistory" (
    "id" TEXT NOT NULL,
    "entityType" "StatusHistoryEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "orderId" TEXT,
    "requestId" TEXT,
    "changedById" TEXT,
    "oldStatus" TEXT,
    "newStatus" TEXT NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomerProfile_userId_key" ON "CustomerProfile"("userId");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerFile_storedPath_key" ON "CustomerFile"("storedPath");

-- CreateIndex
CREATE INDEX "CustomerFile_customerId_idx" ON "CustomerFile"("customerId");

-- CreateIndex
CREATE INDEX "CustomerFile_orderId_idx" ON "CustomerFile"("orderId");

-- CreateIndex
CREATE INDEX "StatusHistory_entityType_entityId_idx" ON "StatusHistory"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "StatusHistory_changedById_idx" ON "StatusHistory"("changedById");

-- CreateIndex
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_paymentStatus_idx" ON "Order"("paymentStatus");

-- CreateIndex
CREATE INDEX "Request_customerId_idx" ON "Request"("customerId");

-- CreateIndex
CREATE INDEX "Request_status_idx" ON "Request"("status");

-- CreateIndex
CREATE INDEX "Request_responsibleUserId_idx" ON "Request"("responsibleUserId");

-- CreateIndex
CREATE INDEX "Payment_orderId_idx" ON "Payment"("orderId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_selectedProductId_fkey" FOREIGN KEY ("selectedProductId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_selectedServiceId_fkey" FOREIGN KEY ("selectedServiceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_responsibleUserId_fkey" FOREIGN KEY ("responsibleUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerProfile" ADD CONSTRAINT "CustomerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerFile" ADD CONSTRAINT "CustomerFile_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerFile" ADD CONSTRAINT "CustomerFile_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusHistory" ADD CONSTRAINT "StatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusHistory" ADD CONSTRAINT "StatusHistory_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusHistory" ADD CONSTRAINT "StatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

