/*
  Warnings:

  - A unique constraint covering the columns `[provider,phoneNumberId]` on the table `ChannelAccount` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,channelAccountId,identifierNormalized]` on the table `ExternalIdentity` will be added. If there are existing duplicate values, this will fail.
  - Made the column `identifierNormalized` on table `ExternalIdentity` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "ChannelAccount_provider_providerAccountId_key";

-- DropIndex
DROP INDEX "ExternalIdentity_channelAccountId_identifier_idx";

-- DropIndex
DROP INDEX "ExternalIdentity_tenantId_channelAccountId_identifier_key";

-- DropIndex
DROP INDEX "ExternalIdentity_tenantId_identifier_idx";

-- AlterTable
ALTER TABLE "ExternalIdentity" ALTER COLUMN "identifierNormalized" SET NOT NULL;

-- AlterTable
ALTER TABLE "RemodelingTask" ADD COLUMN     "weight" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE UNIQUE INDEX "ChannelAccount_provider_phoneNumberId_key" ON "ChannelAccount"("provider", "phoneNumberId");

-- CreateIndex
CREATE INDEX "ExternalIdentity_tenantId_identifierNormalized_idx" ON "ExternalIdentity"("tenantId", "identifierNormalized");

-- CreateIndex
CREATE INDEX "ExternalIdentity_channelAccountId_identifierNormalized_idx" ON "ExternalIdentity"("channelAccountId", "identifierNormalized");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalIdentity_tenantId_channelAccountId_identifierNormal_key" ON "ExternalIdentity"("tenantId", "channelAccountId", "identifierNormalized");
