"use server";

import { prisma } from "@/lib/prisma";
import { requireTenantId } from "@/lib/auth/session";
import { BPRoleType } from "../../../generated/prisma/enums";

type ActionResult =
    | { ok: true }
    | { ok: false; message: string };

// function mapProjectRoleToBpRole(role: string): BPRoleType | null {
//     switch (role) {
//         case "CLIENT": return BPRoleType.CLIENT;
//         case "CONTRACTOR": return BPRoleType.CONTRACTOR;
//         case "ARCHITECT": return BPRoleType.ARCHITECT;
//         case "ENGINEER": return BPRoleType.ENGINEER;
//         case "SUPPLIER": return BPRoleType.SUPPLIER;
//         case "STAFF": return BPRoleType.STAFF;
//         default: return null;
//     }
// }

export async function listProjectPartnersAction(projectId: string) {
    const tenantId = await requireTenantId();

    return prisma.remodelingProjectPartner.findMany({
        where: { tenantId, projectId },
        orderBy: [{ role: "asc" }, { isPrimary: "desc" }, { createdAt: "asc" }],
        select: {
            id: true,
            role: true,
            isPrimary: true,
            createdAt: true,
            partner: {
                select: {
                    id: true,
                    code: true,
                    type: true,
                    organizationName: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                },
            },
        },
    });
}

export async function addProjectPartnerAction(projectId: string, formData: FormData): Promise<ActionResult> {
    const tenantId = await requireTenantId();

    const role = String(formData.get("role") ?? "").trim();
    const partnerId = String(formData.get("partnerId") ?? "").trim();

    // ✅ lo que el usuario pidió explícitamente
    const wantsPrimary =
        formData.get("isPrimary") === "on" || formData.get("isPrimary") === "true";

    if (!role) return { ok: false, message: "Falta el rol." };
    if (!partnerId) return { ok: false, message: "Selecciona un Business Partner." };

    const project = await prisma.remodelingProject.findFirst({
        where: { id: projectId, tenantId },
        select: { id: true },
    });
    if (!project) return { ok: false, message: "Proyecto no encontrado o sin acceso." };

    const partner = await prisma.businessPartner.findFirst({
        where: { id: partnerId, tenantId, isActive: true },
        select: { id: true },
    });
    if (!partner) return { ok: false, message: "Business Partner no válido para este tenant." };

    try {
        await prisma.$transaction(async (tx) => {
            // ✅ 1) ¿ya existe primary para este rol?
            const existingPrimary = await tx.remodelingProjectPartner.findFirst({
                where: { tenantId, projectId, role: role as any, isPrimary: true },
                select: { id: true },
            });

            // ✅ 2) primary final:
            // - si user marcó primary => true
            // - si NO marcó y NO existe primary => true (auto)
            // - si NO marcó y SÍ existe primary => false
            const finalIsPrimary = wantsPrimary || !existingPrimary;

            // ✅ 3) si finalIsPrimary, desmarcamos otros primary del rol
            if (finalIsPrimary) {
                await tx.remodelingProjectPartner.updateMany({
                    where: { tenantId, projectId, role: role as any, isPrimary: true },
                    data: { isPrimary: false },
                });
            }

            // ✅ 4) upsert (no duplicados)
            await tx.remodelingProjectPartner.upsert({
                where: {
                    tenantId_projectId_partnerId_role: {
                        tenantId,
                        projectId,
                        partnerId,
                        role: role as any,
                    },
                },
                create: {
                    tenantId,
                    projectId,
                    partnerId,
                    role: role as any,
                    isPrimary: finalIsPrimary,
                },
                update: {
                    isPrimary: finalIsPrimary,
                },
            });
        });

        return { ok: true };
    } catch (e: any) {
        return { ok: false, message: e?.message ?? "No se pudo guardar." };
    }
}

export async function removeProjectPartnerAction(projectPartnerId: string): Promise<ActionResult> {
    const tenantId = await requireTenantId();

    // opcional: podrías impedir borrar el primary si es el único, pero por ahora simple
    const row = await prisma.remodelingProjectPartner.findFirst({
        where: { id: projectPartnerId, tenantId },
        select: { id: true },
    });
    if (!row) return { ok: false, message: "Registro no encontrado." };

    await prisma.remodelingProjectPartner.delete({
        where: { id: projectPartnerId },
    });

    return { ok: true };
}

export async function setProjectPartnerPrimaryAction(
    projectPartnerId: string,
    makePrimary: boolean
): Promise<ActionResult> {
    const tenantId = await requireTenantId();

    const row = await prisma.remodelingProjectPartner.findFirst({
        where: { id: projectPartnerId, tenantId },
        select: { id: true, projectId: true, role: true },
    });

    if (!row) return { ok: false, message: "Registro no encontrado." };

    try {
        await prisma.$transaction(async (tx) => {
            if (makePrimary) {
                // ✅ 1 primary por rol en el proyecto
                await tx.remodelingProjectPartner.updateMany({
                    where: {
                        tenantId,
                        projectId: row.projectId,
                        role: row.role,
                        isPrimary: true,
                    },
                    data: { isPrimary: false },
                });
            }

            await tx.remodelingProjectPartner.update({
                where: { id: row.id },
                data: { isPrimary: makePrimary },
            });
        });

        return { ok: true };
    } catch (e: any) {
        return { ok: false, message: e?.message ?? "No se pudo actualizar primary." };
    }
}