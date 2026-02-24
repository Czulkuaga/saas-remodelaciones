-- CreateEnum
CREATE TYPE "ProjectDocumentCategory" AS ENUM ('INVOICE', 'RECEIPT', 'QUOTE', 'CONTRACT', 'PHOTO', 'REPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ProgressMethod" AS ENUM ('TASKS_SIMPLE', 'TASKS_WEIGHTED', 'MANUAL');

-- DropIndex
DROP INDEX "ChannelAccount_provider_phoneNumberId_key";

-- DropIndex
DROP INDEX "Message_tenantId_providerMessageId_key";

-- CreateTable
CREATE TABLE "ProjectDocument" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "category" "ProjectDocumentCategory" NOT NULL,
    "fileName" TEXT,
    "mimeType" TEXT,
    "size" INTEGER,
    "sha256" TEXT,
    "url" TEXT,
    "storageKey" TEXT,
    "sourceMessageId" TEXT,
    "sourceAttachmentId" TEXT,
    "createdByUserId" TEXT,
    "createdByPartnerId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'DRAFT',
    "amount" DECIMAL(65,30) NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "concept" TEXT,
    "notes" TEXT,
    "vendorPartnerId" TEXT,
    "incurredAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "documentId" TEXT,
    "createdByUserId" TEXT,
    "createdByPartnerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT,
    "status" "MeetingStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "provider" TEXT,
    "providerEventId" TEXT,
    "calendarLink" TEXT,
    "meetLink" TEXT,
    "attendees" JSONB,
    "createdByUserId" TEXT,
    "createdByPartnerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectProgressSnapshot" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "method" "ProgressMethod" NOT NULL DEFAULT 'TASKS_SIMPLE',
    "percent" INTEGER NOT NULL,
    "etaEndDate" TIMESTAMP(3),
    "basis" JSONB,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectProgressSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectDocument_tenantId_projectId_category_idx" ON "ProjectDocument"("tenantId", "projectId", "category");

-- CreateIndex
CREATE INDEX "ProjectDocument_tenantId_createdAt_idx" ON "ProjectDocument"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "ProjectDocument_projectId_createdAt_idx" ON "ProjectDocument"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "Expense_tenantId_projectId_createdAt_idx" ON "Expense"("tenantId", "projectId", "createdAt");

-- CreateIndex
CREATE INDEX "Expense_tenantId_projectId_status_idx" ON "Expense"("tenantId", "projectId", "status");

-- CreateIndex
CREATE INDEX "Expense_tenantId_paidAt_idx" ON "Expense"("tenantId", "paidAt");

-- CreateIndex
CREATE INDEX "Meeting_tenantId_startAt_idx" ON "Meeting"("tenantId", "startAt");

-- CreateIndex
CREATE INDEX "Meeting_tenantId_projectId_startAt_idx" ON "Meeting"("tenantId", "projectId", "startAt");

-- CreateIndex
CREATE INDEX "Meeting_providerEventId_idx" ON "Meeting"("providerEventId");

-- CreateIndex
CREATE INDEX "ProjectProgressSnapshot_tenantId_projectId_computedAt_idx" ON "ProjectProgressSnapshot"("tenantId", "projectId", "computedAt");

-- CreateIndex
CREATE INDEX "ProjectProgressSnapshot_projectId_computedAt_idx" ON "ProjectProgressSnapshot"("projectId", "computedAt");

-- CreateIndex
CREATE INDEX "ChannelAccount_provider_providerAccountId_idx" ON "ChannelAccount"("provider", "providerAccountId");

-- AddForeignKey
ALTER TABLE "ProjectDocument" ADD CONSTRAINT "ProjectDocument_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDocument" ADD CONSTRAINT "ProjectDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "RemodelingProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDocument" ADD CONSTRAINT "ProjectDocument_sourceMessageId_fkey" FOREIGN KEY ("sourceMessageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDocument" ADD CONSTRAINT "ProjectDocument_sourceAttachmentId_fkey" FOREIGN KEY ("sourceAttachmentId") REFERENCES "MessageAttachment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDocument" ADD CONSTRAINT "ProjectDocument_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDocument" ADD CONSTRAINT "ProjectDocument_createdByPartnerId_fkey" FOREIGN KEY ("createdByPartnerId") REFERENCES "BusinessPartner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "RemodelingProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_currencyCode_fkey" FOREIGN KEY ("currencyCode") REFERENCES "Currency"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_vendorPartnerId_fkey" FOREIGN KEY ("vendorPartnerId") REFERENCES "BusinessPartner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "ProjectDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_createdByPartnerId_fkey" FOREIGN KEY ("createdByPartnerId") REFERENCES "BusinessPartner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "RemodelingProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_createdByPartnerId_fkey" FOREIGN KEY ("createdByPartnerId") REFERENCES "BusinessPartner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectProgressSnapshot" ADD CONSTRAINT "ProjectProgressSnapshot_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectProgressSnapshot" ADD CONSTRAINT "ProjectProgressSnapshot_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "RemodelingProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
