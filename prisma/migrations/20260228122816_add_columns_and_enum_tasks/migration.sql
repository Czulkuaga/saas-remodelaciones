-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TaskCategory" AS ENUM ('GENERAL', 'PROCUREMENT', 'CONSTRUCTION', 'ELECTRICAL', 'PLUMBING', 'FINISHING', 'ADMIN');

-- AlterTable
ALTER TABLE "RemodelingTask" ADD COLUMN     "category" "TaskCategory" NOT NULL DEFAULT 'GENERAL',
ADD COLUMN     "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM';
