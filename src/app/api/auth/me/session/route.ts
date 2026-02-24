import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";

export const runtime = "nodejs";

export async function GET() {
    const ctx = await requireAuth();

    const sessions = await prisma.session.findMany({
        where: { userId: ctx.userId, tenantId: ctx.tenantId },
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

    return NextResponse.json({ ok: true, sessions });
}
