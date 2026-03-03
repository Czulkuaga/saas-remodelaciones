/*
  Warnings:

  - You are about to drop the `ChangeOrder` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Expense` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Invoice` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Payment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Quote` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `QuoteLine` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "BudgetStatus" AS ENUM ('DRAFT', 'APPROVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "CostKind" AS ENUM ('BUDGET', 'COMMITMENT', 'ACTUAL', 'REVENUE');

-- CreateEnum
CREATE TYPE "CostCategory" AS ENUM ('ACQUISITION', 'CONSTRUCTION', 'MATERIALS', 'LABOR', 'PROFESSIONALS', 'PERMITS', 'LOGISTICS', 'ADMIN', 'TAXES', 'OTHER');

-- CreateEnum
CREATE TYPE "CommitmentType" AS ENUM ('QUOTE', 'PURCHASE_ORDER', 'CONTRACT');

-- CreateEnum
CREATE TYPE "CostDocType" AS ENUM ('INVOICE', 'RECEIPT', 'PAYROLL', 'OTHER');

-- CreateEnum
CREATE TYPE "RevenueType" AS ENUM ('SALE', 'RENT', 'OTHER');

-- DropForeignKey
ALTER TABLE "ChangeOrder" DROP CONSTRAINT "ChangeOrder_approvedByUserId_fkey";

-- DropForeignKey
ALTER TABLE "ChangeOrder" DROP CONSTRAINT "ChangeOrder_currencyCode_fkey";

-- DropForeignKey
ALTER TABLE "ChangeOrder" DROP CONSTRAINT "ChangeOrder_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ChangeOrder" DROP CONSTRAINT "ChangeOrder_requestedByPartnerId_fkey";

-- DropForeignKey
ALTER TABLE "ChangeOrder" DROP CONSTRAINT "ChangeOrder_requestedByUserId_fkey";

-- DropForeignKey
ALTER TABLE "ChangeOrder" DROP CONSTRAINT "ChangeOrder_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Expense" DROP CONSTRAINT "Expense_createdByPartnerId_fkey";

-- DropForeignKey
ALTER TABLE "Expense" DROP CONSTRAINT "Expense_createdByUserId_fkey";

-- DropForeignKey
ALTER TABLE "Expense" DROP CONSTRAINT "Expense_currencyCode_fkey";

-- DropForeignKey
ALTER TABLE "Expense" DROP CONSTRAINT "Expense_documentId_fkey";

-- DropForeignKey
ALTER TABLE "Expense" DROP CONSTRAINT "Expense_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Expense" DROP CONSTRAINT "Expense_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Expense" DROP CONSTRAINT "Expense_vendorPartnerId_fkey";

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_currencyCode_fkey";

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_currencyCode_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Quote" DROP CONSTRAINT "Quote_currencyCode_fkey";

-- DropForeignKey
ALTER TABLE "Quote" DROP CONSTRAINT "Quote_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Quote" DROP CONSTRAINT "Quote_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "QuoteLine" DROP CONSTRAINT "QuoteLine_quoteId_fkey";

-- DropForeignKey
ALTER TABLE "QuoteLine" DROP CONSTRAINT "QuoteLine_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "TimelineEvent" DROP CONSTRAINT "TimelineEvent_changeOrderId_fkey";

-- DropForeignKey
ALTER TABLE "TimelineEvent" DROP CONSTRAINT "TimelineEvent_invoiceId_fkey";

-- DropForeignKey
ALTER TABLE "TimelineEvent" DROP CONSTRAINT "TimelineEvent_paymentId_fkey";

-- DropForeignKey
ALTER TABLE "TimelineEvent" DROP CONSTRAINT "TimelineEvent_quoteId_fkey";

-- DropTable
DROP TABLE "ChangeOrder";

-- DropTable
DROP TABLE "Expense";

-- DropTable
DROP TABLE "Invoice";

-- DropTable
DROP TABLE "Payment";

-- DropTable
DROP TABLE "Quote";

-- DropTable
DROP TABLE "QuoteLine";

-- CreateTable
CREATE TABLE "ProjectBudget" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "BudgetStatus" NOT NULL DEFAULT 'DRAFT',
    "name" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectBudget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectBudgetLine" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "CostCategory" NOT NULL,
    "plannedAmount" DECIMAL(18,2) NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectBudgetLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectCost" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "kind" "CostKind" NOT NULL,
    "category" "CostCategory" NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "budgetLineId" TEXT,
    "partnerId" TEXT,
    "userId" TEXT,
    "docType" "CostDocType",
    "docNo" TEXT,
    "docDate" TIMESTAMP(3),
    "notes" TEXT,
    "occurredAt" TIMESTAMP(3),
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectCost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectCommitment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" "CommitmentType" NOT NULL,
    "category" "CostCategory" NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "partnerId" TEXT,
    "budgetLineId" TEXT,
    "reference" TEXT,
    "notes" TEXT,
    "occurredAt" TIMESTAMP(3),
    "currencyCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectCommitment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectRevenue" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" "RevenueType" NOT NULL DEFAULT 'SALE',
    "amount" DECIMAL(18,2) NOT NULL,
    "expectedAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "notes" TEXT,
    "currencyCode" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectRevenue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectBudget_tenantId_projectId_idx" ON "ProjectBudget"("tenantId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectBudget_tenantId_projectId_version_key" ON "ProjectBudget"("tenantId", "projectId", "version");

-- CreateIndex
CREATE INDEX "ProjectBudgetLine_tenantId_budgetId_idx" ON "ProjectBudgetLine"("tenantId", "budgetId");

-- CreateIndex
CREATE INDEX "ProjectBudgetLine_tenantId_category_idx" ON "ProjectBudgetLine"("tenantId", "category");

-- CreateIndex
CREATE INDEX "ProjectBudgetLine_currencyCode_idx" ON "ProjectBudgetLine"("currencyCode");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectBudgetLine_tenantId_budgetId_code_key" ON "ProjectBudgetLine"("tenantId", "budgetId", "code");

-- CreateIndex
CREATE INDEX "ProjectCost_tenantId_projectId_idx" ON "ProjectCost"("tenantId", "projectId");

-- CreateIndex
CREATE INDEX "ProjectCost_tenantId_projectId_kind_idx" ON "ProjectCost"("tenantId", "projectId", "kind");

-- CreateIndex
CREATE INDEX "ProjectCost_tenantId_category_idx" ON "ProjectCost"("tenantId", "category");

-- CreateIndex
CREATE INDEX "ProjectCost_tenantId_partnerId_idx" ON "ProjectCost"("tenantId", "partnerId");

-- CreateIndex
CREATE INDEX "ProjectCost_currencyCode_idx" ON "ProjectCost"("currencyCode");

-- CreateIndex
CREATE INDEX "ProjectCommitment_tenantId_projectId_idx" ON "ProjectCommitment"("tenantId", "projectId");

-- CreateIndex
CREATE INDEX "ProjectCommitment_tenantId_projectId_category_idx" ON "ProjectCommitment"("tenantId", "projectId", "category");

-- CreateIndex
CREATE INDEX "ProjectCommitment_currencyCode_idx" ON "ProjectCommitment"("currencyCode");

-- CreateIndex
CREATE INDEX "ProjectRevenue_tenantId_projectId_idx" ON "ProjectRevenue"("tenantId", "projectId");

-- CreateIndex
CREATE INDEX "ProjectRevenue_currencyCode_idx" ON "ProjectRevenue"("currencyCode");

-- CreateIndex
CREATE INDEX "Tenant_defaultCurrencyCode_idx" ON "Tenant"("defaultCurrencyCode");

-- AddForeignKey
ALTER TABLE "ProjectBudget" ADD CONSTRAINT "ProjectBudget_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "RemodelingProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectBudgetLine" ADD CONSTRAINT "ProjectBudgetLine_currencyCode_fkey" FOREIGN KEY ("currencyCode") REFERENCES "Currency"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectBudgetLine" ADD CONSTRAINT "ProjectBudgetLine_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ProjectBudgetLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectBudgetLine" ADD CONSTRAINT "ProjectBudgetLine_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "ProjectBudget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectCost" ADD CONSTRAINT "ProjectCost_currencyCode_fkey" FOREIGN KEY ("currencyCode") REFERENCES "Currency"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectCost" ADD CONSTRAINT "ProjectCost_budgetLineId_fkey" FOREIGN KEY ("budgetLineId") REFERENCES "ProjectBudgetLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectCost" ADD CONSTRAINT "ProjectCost_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "BusinessPartner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectCost" ADD CONSTRAINT "ProjectCost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectCost" ADD CONSTRAINT "ProjectCost_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "RemodelingProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectCommitment" ADD CONSTRAINT "ProjectCommitment_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "BusinessPartner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectCommitment" ADD CONSTRAINT "ProjectCommitment_budgetLineId_fkey" FOREIGN KEY ("budgetLineId") REFERENCES "ProjectBudgetLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectCommitment" ADD CONSTRAINT "ProjectCommitment_currencyCode_fkey" FOREIGN KEY ("currencyCode") REFERENCES "Currency"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectCommitment" ADD CONSTRAINT "ProjectCommitment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "RemodelingProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectRevenue" ADD CONSTRAINT "ProjectRevenue_currencyCode_fkey" FOREIGN KEY ("currencyCode") REFERENCES "Currency"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectRevenue" ADD CONSTRAINT "ProjectRevenue_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "RemodelingProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
