"use server";

import { prisma } from "@/lib/prisma";
import { requireTenantId, requireUserId } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { nextNumberRangeCode } from "@/lib/number-range";
import { NumberRangeObject, CostKind } from "../../../generated/prisma/enums";

export type ProjectsListMode = "active" | "archived" | "deleted" | "all";

async function getProjectGate(tenantId: string, projectId: string) {
    const p = await prisma.remodelingProject.findFirst({
        where: { id: projectId, tenantId },
        select: {
            id: true,
            code: true,
            name: true,
            status: true,
            archivedAt: true,
            deletedAt: true,
        },
    });
    if (!p) return { ok: false as const, message: "Proyecto no encontrado." };
    if (p.deletedAt) return { ok: false as const, message: "Proyecto eliminado (soft delete). Acción no permitida." };
    return { ok: true as const, project: p };
}

function now() {
    return new Date();
}

export async function listProjectsAction(mode: ProjectsListMode = "active") {
    const tenantId = await requireTenantId();

    const whereBase: any = { tenantId };

    if (mode === "active") {
        whereBase.deletedAt = null;
        whereBase.archivedAt = null;
    }
    if (mode === "archived") {
        whereBase.deletedAt = null;
        whereBase.archivedAt = { not: null };
    }
    if (mode === "deleted") {
        whereBase.deletedAt = { not: null };
    }
    // mode === "all" => no filtros extra

    return prisma.remodelingProject.findMany({
        where: whereBase,
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

            archivedAt: true,
            deletedAt: true,

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

            archivedAt: true,
            archivedByUserId: true,
            deletedAt: true,
            deletedByUserId: true,
            deleteReason: true,

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

export async function archiveProjectAction(projectId: string) {
    const tenantId = await requireTenantId();
    const userId = await requireUserId();

    const gate = await getProjectGate(tenantId, projectId);
    if (!gate.ok) return gate;

    if (gate.project.archivedAt) {
        return { ok: false as const, message: "El proyecto ya está archivado." };
    }

    await prisma.$transaction(async (tx) => {
        await tx.remodelingProject.update({
            where: { id: projectId },
            data: { archivedAt: now(), archivedByUserId: userId },
        });

        await tx.timelineEvent.create({
            data: {
                tenantId,
                projectId,
                type: "PROJECT_ARCHIVED",
                title: "Proyecto archivado",
                description: `Se archivó el proyecto ${gate.project.code}`,
                actorUserId: userId,
                senderKind: "SYSTEM",
            },
        });
    });

    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
    return { ok: true as const };
}

export async function unarchiveProjectAction(projectId: string) {
    const tenantId = await requireTenantId();
    const userId = await requireUserId();

    const gate = await getProjectGate(tenantId, projectId);
    if (!gate.ok) return gate;

    if (!gate.project.archivedAt) {
        return { ok: false as const, message: "El proyecto no está archivado." };
    }

    await prisma.$transaction(async (tx) => {
        await tx.remodelingProject.update({
            where: { id: projectId },
            data: { archivedAt: null, archivedByUserId: null },
        });

        await tx.timelineEvent.create({
            data: {
                tenantId,
                projectId,
                type: "PROJECT_UNARCHIVED",
                title: "Proyecto desarchivado",
                description: `Se desarchivó el proyecto ${gate.project.code}`,
                actorUserId: userId,
                senderKind: "SYSTEM",
            },
        });
    });

    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
    return { ok: true as const };
}

export async function setProjectStatusAction(projectId: string, nextStatus: string) {
    const tenantId = await requireTenantId();
    const userId = await requireUserId();

    const gate = await getProjectGate(tenantId, projectId);
    if (!gate.ok) return gate;

    // Regla SAP-like: si está archivado, no dejar cambiar status (opcional)
    if (gate.project.archivedAt) {
        return { ok: false as const, message: "Proyecto archivado. Desarchiva para modificar." };
    }

    // (Opcional) Valida allowed transitions aquí si quieres.

    await prisma.$transaction(async (tx) => {
        await tx.remodelingProject.update({
            where: { id: projectId },
            data: { status: nextStatus as any },
        });

        await tx.timelineEvent.create({
            data: {
                tenantId,
                projectId,
                type: "PROJECT_STATUS_CHANGED",
                title: "Estado del proyecto actualizado",
                description: `Estado: ${gate.project.status} → ${nextStatus}`,
                actorUserId: userId,
                senderKind: "SYSTEM",
                metadata: { from: gate.project.status, to: nextStatus },
            },
        });
    });

    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
    return { ok: true as const };
}

export async function softDeleteProjectAction(projectId: string, reason?: string) {
    const tenantId = await requireTenantId();
    const userId = await requireUserId();

    const gate = await getProjectGate(tenantId, projectId);
    if (!gate.ok) return gate;

    // Protección: si ya tiene vida contable, NO permitir delete (recomendado)
    const [budgetsCount, costsCount, commitmentsCount, revenuesCount, tasksCount] = await Promise.all([
        prisma.projectBudget.count({ where: { tenantId, projectId } }),
        prisma.projectCost.count({ where: { tenantId, projectId } }),
        prisma.projectCommitment.count({ where: { tenantId, projectId } }),
        prisma.projectRevenue.count({ where: { tenantId, projectId } }),
        prisma.remodelingTask.count({ where: { tenantId, projectId } }),
    ]);

    const hasOperationalData = budgetsCount + costsCount + commitmentsCount + revenuesCount + tasksCount > 0;

    if (hasOperationalData) {
        return {
            ok: false as const,
            message: "No se puede eliminar: el proyecto tiene información relacionada (tareas/presupuestos/movimientos). Usa ARCHIVAR o CANCELAR.",
        };
    }

    await prisma.$transaction(async (tx) => {
        await tx.remodelingProject.update({
            where: { id: projectId },
            data: {
                deletedAt: now(),
                deletedByUserId: userId,
                deleteReason: (reason ?? "").trim() || null,
            },
        });

        await tx.timelineEvent.create({
            data: {
                tenantId,
                projectId,
                type: "PROJECT_SOFT_DELETED",
                title: "Proyecto eliminado (soft delete)",
                description: `Se eliminó el proyecto ${gate.project.code}`,
                actorUserId: userId,
                senderKind: "SYSTEM",
                metadata: { reason: (reason ?? "").trim() || null },
            },
        });
    });

    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
    return { ok: true as const };
}