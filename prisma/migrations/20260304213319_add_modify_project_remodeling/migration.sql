-- AlterTable
ALTER TABLE "RemodelingProject" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "archivedByUserId" TEXT,
ADD COLUMN     "deleteReason" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedByUserId" TEXT;

-- CreateIndex
CREATE INDEX "RemodelingProject_tenantId_archivedAt_idx" ON "RemodelingProject"("tenantId", "archivedAt");

-- CreateIndex
CREATE INDEX "RemodelingProject_tenantId_deletedAt_idx" ON "RemodelingProject"("tenantId", "deletedAt");
