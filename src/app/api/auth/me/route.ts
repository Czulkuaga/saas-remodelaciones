import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET() {
    const ctx = await getAuthContext();
    if (!ctx) return NextResponse.json({ ok: true, authenticated: false });

    return NextResponse.json({
        ok: true,
        authenticated: true,
        userId: ctx.userId,
        tenantId: ctx.tenantId,
        membershipId: ctx.membershipId,
        category: ctx.category,
        permissions: Array.from(ctx.permissions),
    });
}