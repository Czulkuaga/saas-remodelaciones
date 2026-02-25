-- CreateTable
CREATE TABLE "AgentIdentity" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "waId" TEXT NOT NULL,
    "sessionId" TEXT,
    "lastAuthAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgentIdentity_tenantId_userId_idx" ON "AgentIdentity"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "AgentIdentity_waId_idx" ON "AgentIdentity"("waId");

-- CreateIndex
CREATE INDEX "AgentIdentity_sessionId_idx" ON "AgentIdentity"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "AgentIdentity_tenantId_waId_key" ON "AgentIdentity"("tenantId", "waId");

-- AddForeignKey
ALTER TABLE "AgentIdentity" ADD CONSTRAINT "AgentIdentity_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentIdentity" ADD CONSTRAINT "AgentIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
