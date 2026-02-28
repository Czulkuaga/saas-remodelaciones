-- AlterTable
ALTER TABLE "TenantMembership" ADD COLUMN     "partnerId" TEXT;

-- AddForeignKey
ALTER TABLE "TenantMembership" ADD CONSTRAINT "TenantMembership_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "BusinessPartner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
