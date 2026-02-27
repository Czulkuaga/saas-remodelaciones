"use server";

import { prisma } from "@/lib/prisma";
import { requireTenantId } from "@/lib/auth/session";

export async function listProjectTimelineAction(projectId: string, take = 25) {
    const tenantId = await requireTenantId();

    return prisma.timelineEvent.findMany({
        where: { tenantId, projectId },
        orderBy: [{ createdAt: "desc" }],
        take,
        select: {
            id: true,
            type: true,
            title: true,
            description: true,
            createdAt: true,
            senderKind: true,
            metadata: true,
            taskId: true,
            changeOrderId: true,
            quoteId: true,
            invoiceId: true,
            paymentId: true,
        },
    });
}