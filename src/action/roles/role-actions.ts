"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireTenantId } from "@/lib/auth/session";
import { getActorContext, requirePermission } from "./rbac";

const RoleCreateSchema = z.object({
    name: z.string().trim().min(2).max(80),
    key: z
        .string()
        .trim()
        .toLowerCase()
        .regex(/^[a-z0-9_]+$/, "Key: solo a-z 0-9 _")
        .max(50),
});

const SetRolePermissionsSchema = z.object({
    roleId: z.string().uuid(),
    permissionIds: z.array(z.string().uuid()),
});

// ✅ Guard SAP-like: system role solo SUPERADMIN; tenant role solo del tenant actual
async function assertCanEditRole(roleId: string) {
    const actor = await getActorContext();
    if (!actor.ok) return actor;

    const role = await prisma.role.findUnique({
        where: { id: roleId },
        select: { id: true, isSystem: true, tenantId: true },
    });
    if (!role) return { ok: false as const, message: "Rol no encontrado." };

    if (role.isSystem && !actor.isSuperAdmin) {
        return { ok: false as const, message: "Solo SUPERADMIN puede editar roles del sistema." };
    }

    if (!role.isSystem && role.tenantId !== actor.tenantId) {
        return { ok: false as const, message: "No puedes editar roles de otro tenant." };
    }

    return { ok: true as const, role };
}

// ✅ Catálogo SAP-like: system + tenant + contadores
export async function listRolesCatalogAction() {
    const gate = await requirePermission("roles.read");
    if (!gate.ok) return gate;

    const tenantId = await requireTenantId();

    const roles = await prisma.role.findMany({
        where: { OR: [{ tenantId }, { tenantId: null }] },
        orderBy: [{ isSystem: "desc" }, { name: "asc" }],
        select: {
            id: true,
            tenantId: true,
            name: true,
            key: true,
            isSystem: true,
            createdAt: true,
            _count: { select: { permissions: true, members: true } },
        },
    });

    return { ok: true as const, roles };
}

// ✅ Crear rol TENANT
export async function createTenantRoleAction(input: unknown) {
    const gate = await requirePermission("roles.write");
    if (!gate.ok) return gate;

    const tenantId = await requireTenantId();
    const parsed = RoleCreateSchema.safeParse(input);
    if (!parsed.success) return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Datos inválidos" };

    const { name, key } = parsed.data;

    const exists = await prisma.role.findFirst({
        where: { tenantId, key },
        select: { id: true },
    });
    if (exists) return { ok: false as const, message: "Ya existe un rol con ese key en este tenant." };

    const role = await prisma.role.create({
        data: { tenantId, name, key, isSystem: false },
        select: { id: true, tenantId: true, name: true, key: true, isSystem: true, createdAt: true },
    });

    revalidatePath("/roles");
    return { ok: true as const, role };
}

// ✅ Eliminar rol TENANT (system: nunca)
export async function deleteTenantRoleAction(roleId: string) {
    const gate = await requirePermission("roles.write");
    if (!gate.ok) return gate;

    const can = await assertCanEditRole(roleId);
    if (!can.ok) return can;

    if (can.role.isSystem) return { ok: false as const, message: "No se eliminan roles del sistema." };

    await prisma.role.delete({ where: { id: roleId } });
    revalidatePath("/roles");
    return { ok: true as const };
}

// ✅ Catálogo global de permisos
export async function listPermissionsCatalogAction() {
    const gate = await requirePermission("roles.read");
    if (!gate.ok) return gate;

    const permissions = await prisma.permission.findMany({
        orderBy: [{ key: "asc" }],
        select: { id: true, key: true, description: true },
    });
    return { ok: true as const, permissions };
}

// ✅ Detalle de rol (incluye system roles) + ids para precargar checkboxes
export async function getRolePermissionsIdsAction(roleId: string) {
    const gate = await requirePermission("roles.read");
    if (!gate.ok) return gate;

    const tenantId = await requireTenantId();

    const role = await prisma.role.findFirst({
        where: { id: roleId, OR: [{ tenantId }, { tenantId: null }] },
        select: {
            id: true,
            tenantId: true,
            name: true,
            key: true,
            isSystem: true,
            permissions: { select: { permissionId: true } },
            _count: { select: { members: true } },
        },
    });
    if (!role) return { ok: false as const, message: "Rol no encontrado." };

    return { ok: true as const, role, permissionIds: role.permissions.map((x) => x.permissionId) };
}

// ✅ Guardar permisos del rol (SYSTEM solo SUPERADMIN)
export async function setRolePermissionsAction(input: unknown) {
    const gate = await requirePermission("roles.write");
    if (!gate.ok) return gate;

    const parsed = SetRolePermissionsSchema.safeParse(input);
    if (!parsed.success) return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Datos inválidos" };

    const can = await assertCanEditRole(parsed.data.roleId);
    if (!can.ok) return can;

    await prisma.$transaction(async (tx) => {
        await tx.rolePermission.deleteMany({ where: { roleId: parsed.data.roleId } });
        if (parsed.data.permissionIds.length) {
            await tx.rolePermission.createMany({
                data: parsed.data.permissionIds.map((pid) => ({ roleId: parsed.data.roleId, permissionId: pid })),
                skipDuplicates: true,
            });
        }
    });

    revalidatePath("/roles");
    revalidatePath(`/roles/${parsed.data.roleId}`);
    return { ok: true as const };
}