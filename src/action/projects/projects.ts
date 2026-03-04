"use server";

import { prisma } from "@/lib/prisma";
import { requireTenantId } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { nextNumberRangeCode } from "@/lib/number-range";
import { NumberRangeObject } from "../../../generated/prisma/enums";



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

    const code = await nextNumberRangeCode({
        tenantId,
        object: NumberRangeObject.REMODELING_PROJECT,
        defaultPrefix: "PR-",
        defaultPadding: 6,
        defaultNextNo: 1,
    });

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

import { CostKind } from "../../../generated/prisma/enums";

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

            clientPartner: {
                select: { id: true, code: true, type: true, organizationName: true, firstName: true, lastName: true },
            },
            projectPartners: {
                orderBy: [{ role: "asc" }, { isPrimary: "desc" }], // opcional
                select: {
                    id: true,
                    role: true,        // o roleKey / roleId según tu schema
                    isPrimary: true,
                    partner: {
                        select: {
                            id: true,
                            code: true,
                            type: true,
                            organizationName: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
            },

            // ✅ Presupuesto activo (última versión)
            projectBudgets: {
                orderBy: [{ version: "desc" }],
                take: 1,
                select: {
                    id: true,
                    version: true,
                    status: true,
                    name: true,
                    updatedAt: true,
                    lines: {
                        select: { plannedAmount: true },
                    },
                },
            },

            // ✅ Totales financieros simples (para pintar)
            projectCosts: {
                select: { kind: true, amount: true },
            },
            projectCommitments: {
                select: { amount: true },
            },
            projectRevenues: {
                select: { amount: true },
            },

            _count: {
                select: {
                    tasks: true,
                    projectPartners: true,
                    projectBudgets: true,
                    projectCosts: true,
                    projectCommitments: true,
                    projectRevenues: true,
                },
            },

            updatedAt: true,
        },
    });

    if (!p) throw new Error("Project not found");

    // --- Normalización SAP-like (resumen simple)
    const activeBudget = p.projectBudgets[0] ?? null;
    const plannedTotal = activeBudget
        ? activeBudget.lines.reduce((acc, x) => acc + Number(x.plannedAmount ?? 0), 0)
        : 0;

    const actualTotal = p.projectCosts
        .filter((x) => x.kind === CostKind.ACTUAL)
        .reduce((acc, x) => acc + Number(x.amount ?? 0), 0);

    const budgetLinesTotal = p.projectCosts
        .filter((x) => x.kind === CostKind.BUDGET)
        .reduce((acc, x) => acc + Number(x.amount ?? 0), 0);

    const committedTotal = p.projectCommitments.reduce((acc, x) => acc + Number(x.amount ?? 0), 0);
    const revenueTotal = p.projectRevenues.reduce((acc, x) => acc + Number(x.amount ?? 0), 0);

    // Ojo: si estás usando ProjectCost(kind=BUDGET) como "plan", puedes decidir:
    // - planned = sum(lines) (recomendado)
    // - planned = sum(ProjectCost(kind=BUDGET)) (si lo llegas a usar)
    // Por ahora dejo plannedTotal basado en líneas.

    const teamPartners = p.projectPartners.map((pp) => {
        const bp = pp.partner;
        const name =
            bp.organizationName ??
            [bp.firstName, bp.lastName].filter(Boolean).join(" ") ??
            bp.code;

        return {
            id: bp.id,
            label: `${bp.code} • ${name}`,
            roleLabel: String(pp.role ?? ""),   // si existe
            isPrimary: !!pp.isPrimary,
        };
    });

    return {
        ...p,
        // limpia payloads pesados si quieres (optional)
        projectBudgets: undefined,
        projectCosts: undefined,
        projectCommitments: undefined,
        projectRevenues: undefined,
        teamPartners,
        budget: {
            active: activeBudget
                ? { id: activeBudget.id, version: activeBudget.version, status: activeBudget.status, name: activeBudget.name, updatedAt: activeBudget.updatedAt }
                : null,
            totals: {
                plannedTotal,
                committedTotal,
                actualTotal,
                revenueTotal,
                // si lo quieres exponer para auditoría:
                budgetLinesTotal,
            },
        },
    };
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