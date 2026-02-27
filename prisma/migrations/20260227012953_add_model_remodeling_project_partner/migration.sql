-- CreateEnum
CREATE TYPE "ProjectPartnerRole" AS ENUM ('CLIENT', 'CONTRACTOR', 'ARCHITECT', 'ENGINEER', 'SUPPLIER', 'STAFF');

-- CreateTable
CREATE TABLE "RemodelingProjectPartner" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "role" "ProjectPartnerRole" NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RemodelingProjectPartner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RemodelingProjectPartner_tenantId_projectId_role_idx" ON "RemodelingProjectPartner"("tenantId", "projectId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "RemodelingProjectPartner_tenantId_projectId_partnerId_role_key" ON "RemodelingProjectPartner"("tenantId", "projectId", "partnerId", "role");

-- AddForeignKey
ALTER TABLE "RemodelingProjectPartner" ADD CONSTRAINT "RemodelingProjectPartner_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemodelingProjectPartner" ADD CONSTRAINT "RemodelingProjectPartner_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "RemodelingProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemodelingProjectPartner" ADD CONSTRAINT "RemodelingProjectPartner_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "BusinessPartner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
