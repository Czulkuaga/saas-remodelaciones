// src/lib/auth/audit.ts
import "server-only";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "./session";

type AuditParams = {
    // Si lo pasas, se valida contra el tenant del contexto.
    // Si no lo pasas, se usa el tenant del contexto.
    tenantId?: string;

    action: string;
    resourceType: string;
    resourceId?: string | null;

    success: boolean;
    message?: string | null;

    method?: string | null;
    path?: string | null;
    ip?: string | null;
    userAgent?: string | null;

    metadata?: unknown;
};

function pickHeaderIp(h: Headers) {
    // Best-effort: en prod normalmente viene de tu reverse proxy
    return (
        h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        h.get("x-real-ip") ||
        null
    );
}

export async function audit(params: AuditParams) {
    const ctx = await getAuthContext();

    // 🔒 Si no hay contexto, no podemos escribir AuditLog porque actorMembershipId es required.
    // (Si luego quieres auditar anónimo, creamos un "SYSTEM membership" por tenant.)
    if (!ctx?.membershipId) return;

    // 🔒 Anti-spoof multi-tenant: no permitas que te auditen en otro tenant
    const tenantId = params.tenantId ?? ctx.tenantId;
    if (tenantId !== ctx.tenantId) {
        // Intento de escribir audit cross-tenant: lo ignoramos o puedes lanzar error.
        return;
    }

    const h = await headers();

    await prisma.auditLog.create({
        data: {
            tenantId,
            actorMembershipId: ctx.membershipId,

            action: params.action,
            resourceType: params.resourceType,
            resourceId: params.resourceId ?? null,

            success: params.success,
            message: params.message ?? null,

            method: params.method ?? h.get("x-http-method-override") ?? null,
            path: params.path ?? h.get("x-pathname") ?? null, // opcional (si tu proxy lo manda)
            ip: params.ip ?? pickHeaderIp(h),
            userAgent: params.userAgent ?? h.get("user-agent"),

            metadata: (params.metadata ?? null) as any,
        },
        select: { id: true },
    });
}