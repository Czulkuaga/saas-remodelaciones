"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireTenantId } from "@/lib/auth/session";
import { requirePermission } from "./rbac";

export async function listMembershipsForRoleAssignAction() {
    await requirePermission("roles.read");
    const tenantId = await requireTenantId();

    const memberships = await prisma.tenantMembership.findMany({
        where: { tenantId },
        orderBy: [{ createdAt: "desc" }],
        select: {
            id: true,
            category: true,
            isActive: true,
            user: { select: { id: true, name: true, email: true, phoneNormalized: true } },
            roles: { select: { roleId: true, role: { select: { name: true, key: true, isSystem: true } } } },
        },
    });

    return { ok: true as const, memberships };
}

const SetMembershipRolesSchema = z.object({
    membershipId: z.string().uuid(),
    roleIds: z.array(z.string().uuid()),
});

export async function setMembershipRolesAction(input: unknown) {
    const gate = await requirePermission("roles.write");
    if (!gate.ok) return gate;

    const tenantId = await requireTenantId();
    const parsed = SetMembershipRolesSchema.safeParse(input);
    if (!parsed.success) return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Datos inválidos" };

    const { membershipId, roleIds } = parsed.data;

    const m = await prisma.tenantMembership.findFirst({ where: { id: membershipId, tenantId }, select: { id: true } });
    if (!m) return { ok: false as const, message: "Membresía no encontrada en este tenant." };

    // roles válidos: tenant actual o system (tenantId null)
    const valid = await prisma.role.findMany({
        where: { id: { in: roleIds }, OR: [{ tenantId }, { tenantId: null }] },
        select: { id: true },
    });
    if (valid.length !== roleIds.length) return { ok: false as const, message: "Uno o más roles no pertenecen a este tenant." };

    await prisma.$transaction(async (tx) => {
        await tx.membershipRole.deleteMany({ where: { membershipId } });
        if (roleIds.length) {
            await tx.membershipRole.createMany({
                data: roleIds.map((roleId) => ({ membershipId, roleId })),
                skipDuplicates: true,
            });
        }
    });

    revalidatePath("/roles/assign");
    return { ok: true as const };
}