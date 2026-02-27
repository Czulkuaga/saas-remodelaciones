"use server";

import { prisma } from "@/lib/prisma";
import { requireTenantId } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { NumberRangeObject } from "../../../generated/prisma/enums";

async function nextCodeFor(object: NumberRangeObject) {
    const tenantId = await requireTenantId();

    const nr = await prisma.numberRange.findUnique({
        where: { tenantId_object: { tenantId, object } },
        select: { id: true, nextNo: true, padding: true, prefix: true },
    });
    if (!nr) throw new Error(`NumberRange missing for ${object}`);

    const seq = String(nr.nextNo).padStart(nr.padding, "0");
    const prefix = nr.prefix ? `${nr.prefix}-` : "";
    const code = `${prefix}${seq}`;

    await prisma.numberRange.update({ where: { id: nr.id }, data: { nextNo: nr.nextNo + 1 } });
    return code;
}

export async function listProjectsAction() {
    const tenantId = await requireTenantId();

    return prisma.remodelingProject.findMany({
        where: { tenantId },
        orderBy: [{ updatedAt: "desc" }],
        select: {
            id: true,
            code: true,
            name: true,
            status: true,
            city: true,
            countryCode: true,
            targetEndDate: true,
            updatedAt: true,
            _count: { select: { tasks: true, projectPartners: true } },
            clientPartner: { select: { id: true, organizationName: true, firstName: true, lastName: true } },
        },
    });
}

export async function createProjectAction(formData: FormData) {
    const tenantId = await requireTenantId();

    const name = String(formData.get("name") ?? "").trim();
    const scopeSummary = String(formData.get("scopeSummary") ?? "").trim() || null;

    const clientPartnerId = String(formData.get("clientPartnerId") ?? "") || null;

    const addressLine1 = String(formData.get("addressLine1") ?? "").trim() || null;
    const city = String(formData.get("city") ?? "").trim() || null;
    const postalCode = String(formData.get("postalCode") ?? "").trim() || null;
    const countryCode = String(formData.get("countryCode") ?? "").trim() || null;

    const locationId = String(formData.get("locationId") ?? "") || null;
    const orgUnitId = String(formData.get("orgUnitId") ?? "") || null;

    const startDateStr = String(formData.get("startDate") ?? "");
    const targetEndDateStr = String(formData.get("targetEndDate") ?? "");

    const startDate = startDateStr ? new Date(startDateStr) : null;
    const targetEndDate = targetEndDateStr ? new Date(targetEndDateStr) : null;

    if (!name) return { ok: false as const, message: "Nombre del proyecto requerido." };

    const code = await nextCodeFor(NumberRangeObject.REMODELING_PROJECT);

    const project = await prisma.remodelingProject.create({
        data: {
            tenantId,
            code,
            name,
            status: "PLANNING",
            clientPartnerId,
            addressLine1,
            city,
            postalCode,
            countryCode,
            locationId,
            orgUnitId,
            startDate,
            targetEndDate,
            scopeSummary,
        },
        select: { id: true },
    });

    // Timeline (opcional, pero recomendado)
    await prisma.timelineEvent.create({
        data: {
            tenantId,
            projectId: project.id,
            type: "PROJECT_CREATED",
            title: "Proyecto creado",
            description: `Se creó el proyecto ${code}`,
            senderKind: "SYSTEM",
        },
    });

    revalidatePath("/projects");
    revalidatePath(`/projects/${project.id}`);
    return { ok: true as const, id: project.id };
}

export async function getProjectAction(projectId: string) {
    const tenantId = await requireTenantId();

    const p = await prisma.remodelingProject.findFirst({
        where: { id: projectId, tenantId },
        select: {
            id: true,
            code: true,
            name: true,
            status: true,
            scopeSummary: true,
            startDate: true,
            targetEndDate: true,

            addressLine1: true,
            city: true,
            postalCode: true,
            countryCode: true,
            country: { select: { code: true, name: true } },

            orgUnit: { select: { id: true, code: true, name: true } },
            location: { select: { id: true, code: true, name: true, city: true, addressLine1: true } },

            clientPartner: { select: { id: true, code: true, type: true, organizationName: true, firstName: true, lastName: true } },

            _count: { select: { tasks: true, projectPartners: true, quotes: true, changeOrders: true, expenses: true } },

            updatedAt: true,
        },
    });

    if (!p) throw new Error("Project not found");
    return p;
}

export async function updateProjectAction(projectId: string, formData: FormData) {
    const tenantId = await requireTenantId();

    const name = String(formData.get("name") ?? "").trim();
    const status = String(formData.get("status") ?? "").trim();
    const scopeSummary = String(formData.get("scopeSummary") ?? "").trim() || null;

    const clientPartnerId = String(formData.get("clientPartnerId") ?? "") || null;

    const addressLine1 = String(formData.get("addressLine1") ?? "").trim() || null;
    const city = String(formData.get("city") ?? "").trim() || null;
    const postalCode = String(formData.get("postalCode") ?? "").trim() || null;
    const countryCode = String(formData.get("countryCode") ?? "").trim() || null;

    const startDateStr = String(formData.get("startDate") ?? "");
    const targetEndDateStr = String(formData.get("targetEndDate") ?? "");
    const startDate = startDateStr ? new Date(startDateStr) : null;
    const targetEndDate = targetEndDateStr ? new Date(targetEndDateStr) : null;

    if (!name) return { ok: false as const, message: "Nombre requerido." };

    const exists = await prisma.remodelingProject.findFirst({ where: { id: projectId, tenantId }, select: { id: true } });
    if (!exists) return { ok: false as const, message: "Proyecto no encontrado." };

    await prisma.remodelingProject.update({
        where: { id: projectId },
        data: {
            name,
            status: status ? (status as any) : undefined,
            scopeSummary,
            clientPartnerId,
            addressLine1,
            city,
            postalCode,
            countryCode,
            startDate,
            targetEndDate,
        },
    });

    await prisma.timelineEvent.create({
        data: {
            tenantId,
            projectId,
            type: "PROJECT_UPDATED",
            title: "Proyecto actualizado",
            senderKind: "SYSTEM",
        },
    });

    revalidatePath(`/projects/${projectId}`);
    return { ok: true as const };
}