import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/permissions";

export const runtime = "nodejs";

export async function GET(req: Request) {
    const ctx = await requireSuperAdmin();

    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    const sessions = await prisma.session.findMany({
        where: {
            tenantId: ctx.tenantId,
            ...(userId ? { userId } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
            id: true,
            userId: true,
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
