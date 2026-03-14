-- CreateEnum
CREATE TYPE "ProvisioningStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "ProvisioningRequest" (
    "id" TEXT NOT NULL,
    "requestKey" TEXT NOT NULL,
    "status" "ProvisioningStatus" NOT NULL DEFAULT 'PENDING',
    "tenantId" TEXT,
    "tenantSlug" TEXT,
    "payloadHash" TEXT,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "resultJson" JSONB,
    "createdByEmail" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProvisioningRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProvisioningRequest_requestKey_key" ON "ProvisioningRequest"("requestKey");

-- CreateIndex
CREATE INDEX "ProvisioningRequest_status_idx" ON "ProvisioningRequest"("status");

-- CreateIndex
CREATE INDEX "ProvisioningRequest_tenantSlug_idx" ON "ProvisioningRequest"("tenantSlug");
