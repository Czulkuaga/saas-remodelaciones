import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { audit } from "@/lib/auth/audit";

export const runtime = "nodejs";

export async function GET(req: Request) {
    const ctx = await requirePermission("patients.read");

    await audit({
        tenantId: ctx.tenantId,
        action: "patients.list",
        resourceType: "Patient",
        success: true,
        method: "GET",
        path: "/api/patients",
    });

    return NextResponse.json({ ok: true, items: [] });
}