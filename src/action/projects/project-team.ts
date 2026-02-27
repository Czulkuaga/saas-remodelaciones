"use server";

import { prisma } from "@/lib/prisma";
import { requireTenantId } from "@/lib/auth/session";

type ActionResult =
    | { ok: true }
    | { ok: false; message: string };

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
    const isPrimary = formData.get("isPrimary") === "on" || formData.get("isPrimary") === "true";

    if (!role) return { ok: false, message: "Falta el rol." };
    if (!partnerId) return { ok: false, message: "Selecciona un Business Partner." };

    // (Opcional) valida que exista el project dentro del tenant
    const project = await prisma.remodelingProject.findFirst({
        where: { id: projectId, tenantId },
        select: { id: true },
    });
    if (!project) return { ok: false, message: "Proyecto no encontrado o sin acceso." };

    // (Opcional) valida partner dentro del tenant
    const partner = await prisma.businessPartner.findFirst({
        where: { id: partnerId, tenantId },
        select: { id: true },
    });
    if (!partner) return { ok: false, message: "Business Partner no válido para este tenant." };

    try {
        await prisma.$transaction(async (tx) => {
            if (isPrimary) {
                // ✅ SAP rule: 1 primary por rol en el proyecto
                await tx.remodelingProjectPartner.updateMany({
                    where: { tenantId, projectId, role: role as any, isPrimary: true },
                    data: { isPrimary: false },
                });
            }

            // ✅ upsert por unique compuesta (tenantId, projectId, partnerId, role)
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
                    isPrimary,
                },
                update: {
                    isPrimary, // si ya existía, solo actualiza esto (por ahora)
                },
            });
        });

        return { ok: true };
    } catch (e: any) {
        // Si cae por unique (raro con upsert), o cualquier cosa:
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