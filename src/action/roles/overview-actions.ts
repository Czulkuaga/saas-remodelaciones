"use server";

import { prisma } from "@/lib/prisma";
import { requireTenantId } from "@/lib/auth/session";
import { requirePermission } from "./rbac";

export async function getRbacTenantOverviewAction() {
    const gate = await requirePermission("roles.read");
    if (!gate.ok) return gate;

    const tenantId = await requireTenantId();

    const [
        roleCounts,
        permsTotal,
        membersActive,
        usersNoRoles,
        permsUnused,
        tenantRolesNoPerms,
    ] = await Promise.all([
        prisma.role.groupBy({
            by: ["isSystem"],
            where: { OR: [{ tenantId }, { tenantId: null }] },
            _count: { _all: true },
        }),
        prisma.permission.count(),
        prisma.tenantMembership.count({ where: { tenantId, isActive: true } }),

        // memberships activas (no ADMIN) sin roles asignados
        prisma.tenantMembership.count({
            where: {
                tenantId,
                isActive: true,
                NOT: { category: "ADMIN" },
                roles: { none: {} },
            },
        }),

        // permisos del catálogo que no están asignados a ningún rol (global)
        prisma.permission.count({
            where: { roles: { none: {} } },
        }),

        // roles TENANT sin permisos asignados
        prisma.role.count({
            where: {
                tenantId,
                isSystem: false,
                permissions: { none: {} },
            },
        }),
    ]);

    const systemRoles = roleCounts.find((x) => x.isSystem)?._count._all ?? 0;
    const tenantRoles = roleCounts.find((x) => !x.isSystem)?._count._all ?? 0;

    return {
        ok: true as const,
        overview: {
            roles: {
                totalVisible: systemRoles + tenantRoles,
                systemRoles,
                tenantRoles,
                tenantRolesNoPerms,
            },
            permissions: {
                total: permsTotal,
                unused: permsUnused,
            },
            users: {
                membershipsActive: membersActive,
                withoutRolesNonAdmin: usersNoRoles,
            },
        },
    };
}