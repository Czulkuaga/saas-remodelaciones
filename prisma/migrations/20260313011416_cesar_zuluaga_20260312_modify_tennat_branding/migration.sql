/*
  Warnings:

  - You are about to drop the column `logoUrl` on the `TenantBranding` table. All the data in the column will be lost.
  - Added the required column `brandName` to the `TenantBranding` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TenantBranding" DROP COLUMN "logoUrl",
ADD COLUMN     "brandName" TEXT NOT NULL,
ADD COLUMN     "logoDarkUrl" TEXT,
ADD COLUMN     "logoIconUrl" TEXT,
ADD COLUMN     "logoLightUrl" TEXT;
