-- CreateEnum
CREATE TYPE "SessionChannel" AS ENUM ('WEB', 'WHATSAPP_FLOW');

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "channel" "SessionChannel" NOT NULL DEFAULT 'WEB',
ADD COLUMN     "host" TEXT,
ADD COLUMN     "waId" TEXT;

-- CreateIndex
CREATE INDEX "Session_tenantId_userId_channel_revokedAt_idx" ON "Session"("tenantId", "userId", "channel", "revokedAt");
