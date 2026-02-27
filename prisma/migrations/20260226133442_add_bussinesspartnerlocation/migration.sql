/*
  Warnings:

  - A unique constraint covering the columns `[tenantId,partnerId,type,value]` on the table `PartnerIdentifier` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[orgBusinessPartnerId]` on the table `Tenant` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `PartnerIdentifier` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `PartnerIdentifier` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "PartnerIdentifierType" AS ENUM ('NATIONAL_ID', 'PASSPORT', 'FOREIGN_ID', 'DRIVER_LICENSE', 'TAX_ID', 'VAT_ID', 'CO_CC', 'CO_CE', 'CO_NIT', 'CO_RUT', 'OTHER');

-- CreateEnum
CREATE TYPE "LocationUsageType" AS ENUM ('BILLING', 'SHIPPING', 'OFFICE', 'WAREHOUSE', 'PROJECT_SITE', 'OTHER');

-- DropForeignKey
ALTER TABLE "PartnerIdentifier" DROP CONSTRAINT "PartnerIdentifier_countryCode_fkey";

-- DropForeignKey
ALTER TABLE "PartnerIdentifier" DROP CONSTRAINT "PartnerIdentifier_partnerId_fkey";

-- DropIndex
DROP INDEX "PartnerIdentifier_countryCode_idx";

-- DropIndex
DROP INDEX "PartnerIdentifier_partnerId_idx";

-- DropIndex
DROP INDEX "PartnerIdentifier_tenantId_type_value_idx";

-- DropIndex
DROP INDEX "PartnerIdentifier_tenantId_type_value_key";

-- DropIndex
DROP INDEX "PartnerIdentifier_tenantId_value_idx";

-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "addressLine2" TEXT,
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactName" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "district" TEXT,
ADD COLUMN     "latitude" DECIMAL(10,7),
ADD COLUMN     "longitude" DECIMAL(10,7),
ADD COLUMN     "state" TEXT;

-- AlterTable
ALTER TABLE "PartnerIdentifier" ADD COLUMN     "isPrimary" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "issuedBy" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "validFrom" TIMESTAMP(3),
ADD COLUMN     "validTo" TIMESTAMP(3),
ADD COLUMN     "valueNorm" TEXT,
DROP COLUMN "type",
ADD COLUMN     "type" "PartnerIdentifierType" NOT NULL;

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "orgBusinessPartnerId" TEXT;

-- CreateTable
CREATE TABLE "BusinessPartnerLocation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "usage" "LocationUsageType" NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "BusinessPartnerLocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BusinessPartnerLocation_tenantId_partnerId_idx" ON "BusinessPartnerLocation"("tenantId", "partnerId");

-- CreateIndex
CREATE INDEX "BusinessPartnerLocation_tenantId_usage_idx" ON "BusinessPartnerLocation"("tenantId", "usage");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessPartnerLocation_tenantId_partnerId_locationId_usage_key" ON "BusinessPartnerLocation"("tenantId", "partnerId", "locationId", "usage");

-- CreateIndex
CREATE INDEX "PartnerIdentifier_tenantId_partnerId_idx" ON "PartnerIdentifier"("tenantId", "partnerId");

-- CreateIndex
CREATE INDEX "PartnerIdentifier_tenantId_type_idx" ON "PartnerIdentifier"("tenantId", "type");

-- CreateIndex
CREATE INDEX "PartnerIdentifier_tenantId_valueNorm_idx" ON "PartnerIdentifier"("tenantId", "valueNorm");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerIdentifier_tenantId_partnerId_type_value_key" ON "PartnerIdentifier"("tenantId", "partnerId", "type", "value");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_orgBusinessPartnerId_key" ON "Tenant"("orgBusinessPartnerId");

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_orgBusinessPartnerId_fkey" FOREIGN KEY ("orgBusinessPartnerId") REFERENCES "BusinessPartner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessPartnerLocation" ADD CONSTRAINT "BusinessPartnerLocation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessPartnerLocation" ADD CONSTRAINT "BusinessPartnerLocation_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "BusinessPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessPartnerLocation" ADD CONSTRAINT "BusinessPartnerLocation_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerIdentifier" ADD CONSTRAINT "PartnerIdentifier_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerIdentifier" ADD CONSTRAINT "PartnerIdentifier_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "BusinessPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerIdentifier" ADD CONSTRAINT "PartnerIdentifier_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "Country"("code") ON DELETE SET NULL ON UPDATE CASCADE;
