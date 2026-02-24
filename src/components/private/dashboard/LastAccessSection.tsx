import { prisma } from "@/lib/prisma";
import { LastAccessTable } from "./LastAccessTable";

export async function LastAccessSection({
  userId,
  tenantId,
}: {
  userId: string;
  tenantId: string;
}) {
  const sessions = await prisma.session.findMany({
    where: { userId, tenantId },
    orderBy: { createdAt: "desc" },
    take: 25,
    select: {
      id: true,
      createdAt: true,
      lastSeenAt: true,
      expiresAt: true,
      revokedAt: true,
      ip: true,
      userAgent: true,
    },
  });

  return <LastAccessTable sessions={sessions} />;
}