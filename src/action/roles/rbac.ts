"use server";

import { prisma } from "@/lib/prisma";
import { requireTenantId } from "@/lib/auth/session";
import { requireUserId } from "@/lib/auth/session";
import { MembershipCategory } from "../../../generated/prisma/enums";

export type GateOk = {
    ok: true;
    tenantId: string;
    userId: string;
    membershipId: string;
    category: MembershipCategory;
    isSuperAdmin: boolean; // SUPERADMIN global
    isAdminAllowAll: boolean; // ADMIN allow-all dentro del tenant actual
};
export type GateFail = { ok: false; message: string };
export type Gate = GateOk | GateFail;

/** SUPERADMIN global = tiene al menos una membership SUPERADMIN activa en cualquier tenant */
async function isSuperAdminGlobal(userId: string) {
    const m = await prisma.tenantMembership.findFirst({
        where: { userId, category: "SUPERADMIN", isActive: true },
        select: { id: true },
    });
    return !!m;
}

/** Garantiza membership SUPERADMIN en tenant actual para poder auditar y operar consistente */
async function ensureSuperAdminMembership(tenantId: string, userId: string) {
    const existing = await prisma.tenantMembership.findFirst({
        where: { tenantId, userId },
        select: { id: true },
    });
    if (existing) return existing.id;

    const created = await prisma.tenantMembership.create({
        data: { tenantId, userId, category: "SUPERADMIN", isActive: true },
        select: { id: true },
    });

    return created.id;
}

export async function getActorContext(): Promise<Gate> {
    const tenantId = await requireTenantId();
    const userId = await requireUserId();

    const superGlobal = await isSuperAdminGlobal(userId);

    if (superGlobal) {
        const membershipId = await ensureSuperAdminMembership(tenantId, userId);
        return {
            ok: true,
            tenantId,
            userId,
            membershipId,
            category: "SUPERADMIN",
            isSuperAdmin: true,
            isAdminAllowAll: true, // superadmin también allow-all
        };
    }

    const m = await prisma.tenantMembership.findFirst({
        where: { tenantId, userId, isActive: true },
        select: { id: true, category: true },
    });

    if (!m) return { ok: false, message: "Membresía no encontrada o inactiva en este tenant." };

    const isAdminAllowAll = m.category === "ADMIN";
    return {
        ok: true,
        tenantId,
        userId,
        membershipId: m.id,
        category: m.category as GateOk["category"],
        isSuperAdmin: false,
        isAdminAllowAll,
    };
}

// Validaciones, Roles/Permisos

export async function hasPermission(permissionKey: string): Promise<boolean> {
  const gate = await requirePermission(permissionKey);
  return gate.ok;
}

/**
 * Retorna set de permisos efectivos (union) para el membership en el tenant actual.
 * Si ADMIN => ["*"]
 */
export async function listEffectivePermissionsForActor(): Promise<
    | { ok: true; tenantId: string; membershipId: string; permissions: string[] }
    | GateFail
> {
    const actor = await getActorContext();
    if (!actor.ok) return actor;

    // ✅ allow-all
    if (actor.isSuperAdmin || actor.isAdminAllowAll) {
        return { ok: true, tenantId: actor.tenantId, membershipId: actor.membershipId, permissions: ["*"] };
    }

    // membership -> roles -> permissions
    const rows = await prisma.membershipRole.findMany({
        where: { membershipId: actor.membershipId },
        select: {
            role: {
                select: {
                    permissions: {
                        select: { permission: { select: { key: true } } },
                    },
                },
            },
        },
    });

    const set = new Set<string>();
    for (const mr of rows) {
        for (const rp of mr.role.permissions) set.add(rp.permission.key);
    }

    return { ok: true, tenantId: actor.tenantId, membershipId: actor.membershipId, permissions: [...set] };
}

export async function getActorMembershipId() {
    const tenantId = await requireTenantId();
    const userId = await requireUserId();

    const m = await prisma.tenantMembership.findFirst({
        where: { tenantId, userId, isActive: true },
        select: { id: true, category: true },
    });

    if (!m) return { ok: false as const, message: "Membresía no encontrada o inactiva." };
    return { ok: true as const, membershipId: m.id, category: m.category, tenantId };
}

/** ✅ La función que tú necesitas */
export async function requirePermission(permissionKey: string): Promise<GateFail | GateOk> {
    const actor = await getActorContext();
    if (!actor.ok) return actor;

    // SUPERADMIN global => allow-all (todos los tenants)
    if (actor.isSuperAdmin) return actor;

    // ADMIN => allow-all (solo tenant actual)
    if (actor.isAdminAllowAll) return actor;

    const eff = await listEffectivePermissionsForActor();
    if (!eff.ok) return eff;

    if (eff.permissions[0] === "*") return actor;

    if (!eff.permissions.includes(permissionKey)) {
        return { ok: false, message: `No tienes permiso: ${permissionKey}` };
    }

    return actor;
}

export async function auditLog(params: {
    action: string;
    resourceType: string;
    resourceId?: string | null;
    method?: string | null;
    path?: string | null;
    success?: boolean;
    message?: string | null;
    metadata?: any;
}) {
    const actor = await getActorMembershipId();
    if (!actor.ok) return; // no audit if no actor

    await prisma.auditLog.create({
        data: {
            tenantId: actor.tenantId,
            actorMembershipId: actor.membershipId,
            action: params.action,
            resourceType: params.resourceType,
            resourceId: params.resourceId ?? null,
            method: params.method ?? null,
            path: params.path ?? null,
            success: params.success ?? true,
            message: params.message ?? null,
            metadata: params.metadata ?? undefined,
        },
    });
}

/**
 * Wrapper: ejecuta una action, y audita si el path NO empieza por /projects
 */
export async function withAudit<T>(
    info: { action: string; resourceType: string; resourceId?: string | null; path?: string | null; method?: string | null },
    fn: () => Promise<T>
): Promise<T> {
    const shouldAudit = !(info.path?.startsWith("/projects") ?? false);

    try {
        const res = await fn();
        if (shouldAudit) await auditLog({ ...info, success: true });
        return res;
    } catch (e: any) {
        if (shouldAudit) await auditLog({ ...info, success: false, message: e?.message ?? "Error", metadata: { stack: e?.stack } });
        throw e;
    }
}