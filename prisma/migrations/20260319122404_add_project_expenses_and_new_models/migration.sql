-- CreateEnum
CREATE TYPE "ProjectExpenseStatus" AS ENUM ('DRAFT', 'REVIEW_PENDING', 'POSTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OcrStatus" AS ENUM ('PENDING', 'PROCESSING', 'EXTRACTED', 'REVIEWED', 'FAILED');

-- CreateTable
CREATE TABLE "ProjectExpense" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" "ProjectExpenseStatus" NOT NULL DEFAULT 'DRAFT',
    "partnerId" TEXT,
    "userId" TEXT,
    "docType" "CostDocType",
    "docNo" TEXT,
    "docDate" TIMESTAMP(3),
    "occurredAt" TIMESTAMP(3),
    "notes" TEXT,
    "sourceFileUrl" TEXT,
    "sourceFileName" TEXT,
    "ocrStatus" "OcrStatus",
    "ocrRawText" TEXT,
    "ocrStructuredJson" JSONB,
    "currencyCode" TEXT NOT NULL,
    "subtotalAmount" DECIMAL(18,2),
    "taxAmount" DECIMAL(18,2),
    "totalAmount" DECIMAL(18,2) NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectExpenseItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "lineNo" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(18,3),
    "unitPrice" DECIMAL(18,2),
    "lineAmount" DECIMAL(18,2) NOT NULL,
    "category" "CostCategory",
    "detectedCode" TEXT,
    "confidenceScore" DECIMAL(5,4),
    "rawExtractedText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectExpenseItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectExpenseAllocation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "expenseItemId" TEXT,
    "budgetLineId" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectExpenseAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectExpense_tenantId_projectId_idx" ON "ProjectExpense"("tenantId", "projectId");

-- CreateIndex
CREATE INDEX "ProjectExpense_tenantId_projectId_status_idx" ON "ProjectExpense"("tenantId", "projectId", "status");

-- CreateIndex
CREATE INDEX "ProjectExpense_tenantId_projectId_docDate_idx" ON "ProjectExpense"("tenantId", "projectId", "docDate");

-- CreateIndex
CREATE INDEX "ProjectExpense_tenantId_partnerId_idx" ON "ProjectExpense"("tenantId", "partnerId");

-- CreateIndex
CREATE INDEX "ProjectExpense_currencyCode_idx" ON "ProjectExpense"("currencyCode");

-- CreateIndex
CREATE INDEX "ProjectExpenseItem_tenantId_expenseId_idx" ON "ProjectExpenseItem"("tenantId", "expenseId");

-- CreateIndex
CREATE INDEX "ProjectExpenseItem_tenantId_category_idx" ON "ProjectExpenseItem"("tenantId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectExpenseItem_expenseId_lineNo_key" ON "ProjectExpenseItem"("expenseId", "lineNo");

-- CreateIndex
CREATE INDEX "ProjectExpenseAllocation_tenantId_projectId_idx" ON "ProjectExpenseAllocation"("tenantId", "projectId");

-- CreateIndex
CREATE INDEX "ProjectExpenseAllocation_tenantId_expenseId_idx" ON "ProjectExpenseAllocation"("tenantId", "expenseId");

-- CreateIndex
CREATE INDEX "ProjectExpenseAllocation_tenantId_expenseItemId_idx" ON "ProjectExpenseAllocation"("tenantId", "expenseItemId");

-- CreateIndex
CREATE INDEX "ProjectExpenseAllocation_tenantId_budgetLineId_idx" ON "ProjectExpenseAllocation"("tenantId", "budgetLineId");

-- AddForeignKey
ALTER TABLE "ProjectExpense" ADD CONSTRAINT "ProjectExpense_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "BusinessPartner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectExpense" ADD CONSTRAINT "ProjectExpense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectExpense" ADD CONSTRAINT "ProjectExpense_currencyCode_fkey" FOREIGN KEY ("currencyCode") REFERENCES "Currency"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectExpense" ADD CONSTRAINT "ProjectExpense_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "RemodelingProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectExpenseItem" ADD CONSTRAINT "ProjectExpenseItem_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "ProjectExpense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectExpenseAllocation" ADD CONSTRAINT "ProjectExpenseAllocation_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "ProjectExpense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectExpenseAllocation" ADD CONSTRAINT "ProjectExpenseAllocation_expenseItemId_fkey" FOREIGN KEY ("expenseItemId") REFERENCES "ProjectExpenseItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectExpenseAllocation" ADD CONSTRAINT "ProjectExpenseAllocation_budgetLineId_fkey" FOREIGN KEY ("budgetLineId") REFERENCES "ProjectBudgetLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectExpenseAllocation" ADD CONSTRAINT "ProjectExpenseAllocation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "RemodelingProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
