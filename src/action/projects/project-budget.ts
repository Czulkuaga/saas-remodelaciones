"use server";

import { prisma } from "@/lib/prisma";
import { requireTenantId, requireUserId } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { BudgetStatus, CostKind, CostCategory } from "../../../generated/prisma/enums";
import { Prisma } from "../../../generated/prisma/client";

type BudgetHeaderPick = { id: string; version: number; status: BudgetStatus; name: string | null; updatedAt: Date };

export type ProjectBudgetSummary = {
    currencyCode: string | null;
    activeBudget: BudgetHeaderPick | null;
    draftBudget: BudgetHeaderPick | null;

    plannedTotal: number;
    committedTotal: number;
    actualTotal: number;
    revenueTotal: number;

    availableVsActual: number;
    availableVsCommitted: number;

    lines: BudgetLineSummary[];
};

export type BudgetLineSummary = {
    id: string;
    code: string;
    title: string;
    category: CostCategory;
    parentId: string | null;

    plannedAmount: number;
    committedAmount: number;
    actualAmount: number;
};

// Gestion de presupuesto

export async function createInitialBudgetAction(projectId: string) {
    const tenantId = await requireTenantId();
    const userId = await requireUserId();

    const project = await prisma.remodelingProject.findFirst({
        where: { id: projectId, tenantId },
        select: { id: true, code: true, name: true },
    });
    if (!project) return { ok: false as const, message: "Proyecto no encontrado." };

    const exists = await prisma.projectBudget.findFirst({
        where: { tenantId, projectId },
        select: { id: true },
    });
    if (exists) return { ok: false as const, message: "Ya existe un presupuesto para este proyecto." };

    const budget = await prisma.$transaction(async (tx) => {
        const created = await tx.projectBudget.create({
            data: {
                tenantId,
                projectId,
                version: 1,
                status: BudgetStatus.DRAFT,
                name: "Presupuesto Base",
            },
            select: { id: true, version: true, status: true, name: true },
        });

        await tx.timelineEvent.create({
            data: {
                tenantId,
                projectId,
                type: "BUDGET_CREATED",
                title: "Presupuesto creado",
                description: `v${created.version} • ${created.status} • ${created.name ?? "—"}`,
                actorUserId: userId,
                senderKind: "SYSTEM",
                metadata: {
                    budgetId: created.id,
                    version: created.version,
                    status: created.status,
                    name: created.name,
                },
            },
        });

        return created;
    });

    revalidatePath(`/projects/${projectId}/budget`);
    revalidatePath(`/projects/${projectId}`);
    return { ok: true as const, budget };
}

export async function createBudgetLineAction(projectId: string, budgetId: string, formData: FormData) {
    const tenantId = await requireTenantId();

    const codeRaw = String(formData.get("code") ?? "").trim();
    const code = codeRaw.replace(/\s+/g, ""); // quita espacios

    const title = String(formData.get("title") ?? "").trim();
    const category = String(formData.get("category") ?? "").trim() as CostCategory;

    const plannedAmountRaw = String(formData.get("plannedAmount") ?? "").trim();
    const parentIdRaw = String(formData.get("parentId") ?? "").trim();
    const parentId = parentIdRaw ? parentIdRaw : null;

    // --- validaciones básicas ---
    if (!code) return { ok: false as const, message: "Código requerido." };
    if (!title) return { ok: false as const, message: "Título requerido." };

    // formatos permitidos: SOLO 2 niveles
    const RE_ROOT = /^\d{2}$/; // "01"
    const RE_CHILD = /^\d{2}\.\d{2}$/; // "01.10"
    const isRoot = RE_ROOT.test(code);
    const isChild = RE_CHILD.test(code);

    if (!isRoot && !isChild) {
        return { ok: false as const, message: 'Código inválido. Usa "01" o "01.10".' };
    }

    // --- validar budget: pertenencia + status DRAFT ---
    const b = await prisma.projectBudget.findFirst({
        where: { id: budgetId, tenantId, projectId },
        select: { id: true, status: true },
    });
    if (!b) return { ok: false as const, message: "Presupuesto no encontrado para este proyecto." };
    if (b.status !== BudgetStatus.DRAFT) {
        return { ok: false as const, message: "Solo puedes editar líneas cuando el presupuesto está en DRAFT." };
    }

    // --- moneda única del tenant ---
    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { defaultCurrencyCode: true },
    });
    const currencyCode = tenant?.defaultCurrencyCode ?? null;
    if (!currencyCode) return { ok: false as const, message: "El tenant no tiene moneda por defecto configurada." };

    const currency = await prisma.currency.findUnique({
        where: { code: currencyCode },
        select: { code: true, isActive: true },
    });
    if (!currency || !currency.isActive) {
        return { ok: false as const, message: `Moneda inválida o inactiva: ${currencyCode}` };
    }

    // --- coherencia parent/código ---
    if (isChild && !parentId) {
        return { ok: false as const, message: "Este código es de sublínea (01.10). Debes elegir un parent." };
    }
    if (isRoot && parentId) {
        return { ok: false as const, message: "Un capítulo (01) no puede tener parent." };
    }

    // --- capítulos = totalizadores => NO deben tener monto directo ---
    // Si es capítulo, forzamos monto a 0 (ignoramos lo que manden)
    let plannedAmount = 0;

    if (isChild) {
        const n = Number(plannedAmountRaw);
        if (!Number.isFinite(n)) return { ok: false as const, message: "Monto inválido." };
        if (n < 0) return { ok: false as const, message: "El monto no puede ser negativo." };
        if (n === 0) return { ok: false as const, message: "El monto debe ser mayor a 0." };
        plannedAmount = n;
    }

    // --- si viene parentId: validar que exista, sea root, y pertenezca al mismo budget ---
    if (parentId) {
        const parent = await prisma.projectBudgetLine.findFirst({
            where: { id: parentId, tenantId, budgetId },
            select: { id: true, code: true, parentId: true },
        });
        if (!parent) return { ok: false as const, message: "Parent inválido (no pertenece a este presupuesto)." };

        // no permitir colgar de sublíneas
        if (parent.parentId) {
            return { ok: false as const, message: "Solo puedes colgar sublíneas de un capítulo (no de otra sublínea)." };
        }
        // parent debe ser root "NN"
        if (!RE_ROOT.test(parent.code)) {
            return { ok: false as const, message: "Parent inválido: el capítulo debe ser tipo 01." };
        }
        // hijo debe iniciar por "NN."
        if (!code.startsWith(parent.code + ".")) {
            return {
                ok: false as const,
                message: `El código debe iniciar por "${parent.code}." (ej: ${parent.code}.10).`,
            };
        }
    }

    // (Opcional recomendado) si intentan crear un child 01.10, exigir que exista el capítulo 01
    // Esto mantiene el árbol "limpio" incluso por API.
    if (isChild) {
        const parentCode = code.split(".")[0]; // "01"
        const rootExists = await prisma.projectBudgetLine.findFirst({
            where: { tenantId, budgetId, code: parentCode, parentId: null },
            select: { id: true },
        });
        if (!rootExists) {
            return {
                ok: false as const,
                message: `Primero crea el capítulo "${parentCode}" (ej: ${parentCode} • Compra...) antes de crear sublíneas.`,
            };
        }
    }

    try {
        const userId = await requireUserId();

        const line = await prisma.$transaction(async (tx) => {
            const created = await tx.projectBudgetLine.create({
                data: {
                    tenantId,
                    budgetId,
                    code,
                    title,
                    category,
                    plannedAmount,
                    currencyCode,
                    parentId,
                },
                select: {
                    id: true,
                    code: true,
                    title: true,
                    category: true,
                    plannedAmount: true,
                    currencyCode: true,
                    parentId: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

            await tx.timelineEvent.create({
                data: {
                    tenantId,
                    projectId,
                    type: "BUDGET_LINE_CREATED",
                    title: "Línea presupuestal creada",
                    description: `${created.code} • ${created.title}`,
                    actorUserId: userId,
                    senderKind: "SYSTEM",
                    metadata: {
                        budgetId,
                        budgetLineId: created.id,
                        code: created.code,
                        title: created.title,
                        category: created.category,
                        plannedAmount: Number(created.plannedAmount),
                        currencyCode: created.currencyCode,
                        parentId: created.parentId,
                    },
                },
            });

            return created;
        });

        revalidatePath(`/projects/${projectId}/budget`);

        return {
            ok: true as const,
            line: {
                ...line,
                plannedAmount: Number(line.plannedAmount),
            },
        };
    } catch (e: any) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
            return { ok: false as const, message: `El código "${code}" ya existe en este presupuesto.` };
        }
        console.error(e);
        return { ok: false as const, message: "No se pudo crear la línea. Revisa logs." };
    }
}

export async function approveBudgetAction(projectId: string, budgetId: string) {
    const tenantId = await requireTenantId();
    const userId = await requireUserId();

    const b = await prisma.projectBudget.findFirst({
        where: { id: budgetId, tenantId, projectId },
        select: { id: true, status: true, version: true, name: true },
    });

    if (!b) return { ok: false as const, message: "Presupuesto no encontrado." };
    if (b.status !== BudgetStatus.DRAFT) return { ok: false as const, message: "Solo se puede aprobar un presupuesto en DRAFT." };

    await prisma.$transaction(async (tx) => {
        const closed = await tx.projectBudget.updateMany({
            where: { tenantId, projectId, status: BudgetStatus.APPROVED },
            data: { status: BudgetStatus.CLOSED },
        });

        await tx.projectBudget.update({
            where: { id: b.id },
            data: { status: BudgetStatus.APPROVED },
        });

        await tx.timelineEvent.create({
            data: {
                tenantId,
                projectId,
                type: "BUDGET_APPROVED",
                title: "Presupuesto aprobado",
                description: `v${b.version} • ${b.name ?? "—"} • (cerrados: ${closed.count})`,
                actorUserId: userId,
                senderKind: "SYSTEM",
                metadata: {
                    budgetId: b.id,
                    version: b.version,
                    name: b.name,
                    closedApprovedCount: closed.count,
                },
            },
        });
    });

    revalidatePath(`/projects/${projectId}/budget`);
    revalidatePath(`/projects/${projectId}`);
    return { ok: true as const };
}

export async function createNextBudgetVersionAction(projectId: string) {
    const tenantId = await requireTenantId();

    // 1) último APPROVED (el "activo")
    const activeApproved = await prisma.projectBudget.findFirst({
        where: { tenantId, projectId, status: BudgetStatus.APPROVED },
        orderBy: [{ version: "desc" }],
        select: { id: true, version: true },
    });

    if (!activeApproved) {
        return { ok: false as const, message: "Aún no hay un presupuesto aprobado para crear una revisión." };
    }

    // 2) si ya hay DRAFT, no crear otro
    const existingDraft = await prisma.projectBudget.findFirst({
        where: { tenantId, projectId, status: BudgetStatus.DRAFT },
        orderBy: [{ version: "desc" }],
        select: { id: true, version: true },
    });
    if (existingDraft) {
        return { ok: false as const, message: `Ya existe un borrador de revisión (v${existingDraft.version}).` };
    }

    // 3) crear cabecera v+1 DRAFT
    const nextVersion = activeApproved.version + 1;

    const newBudget = await prisma.projectBudget.create({
        data: {
            tenantId,
            projectId,
            version: nextVersion,
            status: BudgetStatus.DRAFT,
            name: `Revisión ${nextVersion}`,
        },
        select: { id: true, version: true, status: true, name: true },
    });

    // 4) copiar líneas (preservando jerarquía)
    const oldLines = await prisma.projectBudgetLine.findMany({
        where: { tenantId, budgetId: activeApproved.id },
        orderBy: [{ code: "asc" }],
        select: {
            id: true,
            code: true,
            title: true,
            category: true,
            plannedAmount: true,
            currencyCode: true,
            parentId: true,
        },
    });

    const idMap = new Map<string, string>();

    // 4.1) crear primero raíces
    const roots = oldLines.filter((l) => !l.parentId);
    for (const r of roots) {
        const created = await prisma.projectBudgetLine.create({
            data: {
                tenantId,
                budgetId: newBudget.id,
                code: r.code,
                title: r.title,
                category: r.category,
                plannedAmount: r.plannedAmount,
                currencyCode: r.currencyCode,
                parentId: null,
            },
            select: { id: true },
        });
        idMap.set(r.id, created.id);
    }

    // 4.2) crear hijos (y nietos) en orden por "code" suele bastar
    const nonRoots = oldLines.filter((l) => !!l.parentId);
    for (const l of nonRoots) {
        const newParentId = l.parentId ? idMap.get(l.parentId) : null;

        // si por alguna razón no está el parent aún (código desordenado), puedes repetir en loops,
        // pero con codes tipo 01, 01.10 normalmente queda bien.
        if (l.parentId && !newParentId) continue;

        const created = await prisma.projectBudgetLine.create({
            data: {
                tenantId,
                budgetId: newBudget.id,
                code: l.code,
                title: l.title,
                category: l.category,
                plannedAmount: l.plannedAmount,
                currencyCode: l.currencyCode,
                parentId: newParentId,
            },
            select: { id: true },
        });
        idMap.set(l.id, created.id);
    }

    const userId = await requireUserId();

    await prisma.timelineEvent.create({
        data: {
            tenantId,
            projectId,
            type: "BUDGET_DRAFT_CREATED",
            title: "Borrador de presupuesto creado",
            description: `v${newBudget.version} • ${newBudget.name ?? "—"}`,
            actorUserId: userId,
            senderKind: "SYSTEM",
            metadata: {
                newBudgetId: newBudget.id,
                newVersion: newBudget.version,
                fromBudgetId: activeApproved.id,
                fromVersion: activeApproved.version,
                copiedLines: oldLines.length,
            },
        },
    });

    revalidatePath(`/projects/${projectId}/budget`);
    return { ok: true as const, budget: newBudget };
}

export async function deleteBudgetLineAction(projectId: string, budgetId: string, lineId: string) {
    const tenantId = await requireTenantId();
    const userId = await requireUserId();

    const b = await prisma.projectBudget.findFirst({
        where: { id: budgetId, tenantId, projectId },
        select: { id: true, status: true, version: true, name: true },
    });
    if (!b) return { ok: false as const, message: "Presupuesto no encontrado." };
    if (b.status !== BudgetStatus.DRAFT) return { ok: false as const, message: "Solo puedes eliminar líneas en DRAFT." };

    const line = await prisma.projectBudgetLine.findFirst({
        where: { id: lineId, tenantId, budgetId },
        select: {
            id: true,
            code: true,
            title: true,
            category: true,
            plannedAmount: true,
            currencyCode: true,
            parentId: true,
        },
    });
    if (!line) return { ok: false as const, message: "Línea no encontrada." };

    const [childrenCount, costCount, commitmentCount] = await Promise.all([
        prisma.projectBudgetLine.count({ where: { tenantId, budgetId, parentId: lineId } }),
        prisma.projectCost.count({ where: { tenantId, projectId, budgetLineId: lineId } }),
        prisma.projectCommitment.count({ where: { tenantId, projectId, budgetLineId: lineId } }),
    ]);

    if (childrenCount > 0) return { ok: false as const, message: "No puedes borrar una línea que tiene sublíneas." };
    if (costCount > 0 || commitmentCount > 0) {
        return { ok: false as const, message: "No puedes borrar una línea con movimientos (compromisos/gastos)." };
    }

    await prisma.$transaction(async (tx) => {
        await tx.projectBudgetLine.delete({ where: { id: lineId } });

        await tx.timelineEvent.create({
            data: {
                tenantId,
                projectId,
                type: "BUDGET_LINE_DELETED",
                title: "Línea presupuestal eliminada",
                description: `${line.code} • ${line.title}`,
                actorUserId: userId,
                senderKind: "SYSTEM",
                metadata: {
                    budgetId,
                    budgetVersion: b.version,
                    budgetName: b.name,
                    budgetLineId: line.id,
                    code: line.code,
                    title: line.title,
                    category: line.category,
                    plannedAmount: Number(line.plannedAmount),
                    currencyCode: line.currencyCode,
                    parentId: line.parentId,
                },
            },
        });
    });

    revalidatePath(`/projects/${projectId}/budget`);
    return { ok: true as const };
}

/**
 * Summary nuevo (usando tus tablas nuevas).
 * - currencyCode = moneda default del tenant
 * - activeBudget: último DRAFT/APPROVED (si existe)
 * - totals: planned/committed/actual/revenue
 * - lines: planned + agregados por línea (committed/actual)
 */

export async function getProjectBudgetSummaryAction(projectId: string): Promise<ProjectBudgetSummary> {
    const tenantId = await requireTenantId();

    // 1) moneda del tenant (fuente única)
    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { defaultCurrencyCode: true },
    });
    const currencyCode = tenant?.defaultCurrencyCode ?? null;

    // 2) Presupuestos: activo (último APPROVED) + borrador (último DRAFT)
    const [activeBudget, draftBudget] = await Promise.all([
        prisma.projectBudget.findFirst({
            where: { tenantId, projectId, status: BudgetStatus.APPROVED },
            orderBy: [{ version: "desc" }],
            select: { id: true, version: true, status: true, name: true, updatedAt: true },
        }),
        prisma.projectBudget.findFirst({
            where: { tenantId, projectId, status: BudgetStatus.DRAFT },
            orderBy: [{ version: "desc" }],
            select: { id: true, version: true, status: true, name: true, updatedAt: true },
        }),
    ]);

    // 3) Qué presupuesto mostramos en pantalla (y sobre cuál calculamos el PLAN)
    const budgetForView = draftBudget ?? activeBudget;

    if (!budgetForView) {
        return {
            currencyCode,
            activeBudget: null,
            draftBudget: null,
            plannedTotal: 0,
            committedTotal: 0,
            actualTotal: 0,
            revenueTotal: 0,
            availableVsActual: 0,
            availableVsCommitted: 0,
            lines: [],
        };
    }

    // 4) Líneas del budget (plan) - traemos parentId para jerarquía
    const linesRaw = await prisma.projectBudgetLine.findMany({
        where: { tenantId, budgetId: budgetForView.id },
        orderBy: [{ code: "asc" }],
        select: {
            id: true,
            code: true,
            title: true,
            category: true,
            plannedAmount: true, // Decimal
            parentId: true,
        },
    });

    // --- helpers locales ---
    const toMoneyNumber = (v: unknown): number => {
        if (v == null) return 0;
        if (typeof v === "object" && v && "toNumber" in v && typeof (v as any).toNumber === "function") {
            return (v as any).toNumber();
        }
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
    };

    const lineIds = linesRaw.map((l) => l.id);

    // 5) Movimientos del proyecto (NO dependen del budget, dependen del proyecto)
    const [commitments, costs, revenues] = await Promise.all([
        prisma.projectCommitment.findMany({
            where: { tenantId, projectId },
            select: { amount: true, budgetLineId: true },
        }),
        prisma.projectCost.findMany({
            where: { tenantId, projectId, kind: CostKind.ACTUAL },
            select: { amount: true, budgetLineId: true },
        }),
        prisma.projectRevenue.findMany({
            where: { tenantId, projectId },
            select: { amount: true },
        }),
    ]);

    // 6) Totales del proyecto (committed/actual/revenue)
    const committedTotal = commitments.reduce((acc, x) => acc + toMoneyNumber(x.amount), 0);
    const actualTotal = costs.reduce((acc, x) => acc + toMoneyNumber(x.amount), 0);
    const revenueTotal = revenues.reduce((acc, x) => acc + toMoneyNumber(x.amount), 0);

    // 7) Sumas por línea (solo para líneas existentes del budgetForView)
    const byLineCommitted = new Map<string, number>();
    for (const c of commitments) {
        if (!c.budgetLineId) continue;
        if (lineIds.length && !lineIds.includes(c.budgetLineId)) continue; // no mezclar con otras versiones
        byLineCommitted.set(c.budgetLineId, (byLineCommitted.get(c.budgetLineId) ?? 0) + toMoneyNumber(c.amount));
    }

    const byLineActual = new Map<string, number>();
    for (const x of costs) {
        if (!x.budgetLineId) continue;
        if (lineIds.length && !lineIds.includes(x.budgetLineId)) continue;
        byLineActual.set(x.budgetLineId, (byLineActual.get(x.budgetLineId) ?? 0) + toMoneyNumber(x.amount));
    }

    // 8) plannedAmountEffective:
    // - si la línea es CAPÍTULO (tiene hijos) => planned = sum(hijos)
    // - si es DETALLE (sin hijos) => planned = plannedAmount propio
    const childrenPlannedSum = new Map<string, number>(); // parentId -> sum(planned hijos)
    const childrenCount = new Map<string, number>(); // parentId -> count(hijos)

    for (const l of linesRaw) {
        if (!l.parentId) continue;
        const v = toMoneyNumber(l.plannedAmount);
        childrenPlannedSum.set(l.parentId, (childrenPlannedSum.get(l.parentId) ?? 0) + v);
        childrenCount.set(l.parentId, (childrenCount.get(l.parentId) ?? 0) + 1);
    }

    const plannedEffectiveByLine = new Map<string, number>();
    for (const l of linesRaw) {
        const hasKids = (childrenCount.get(l.id) ?? 0) > 0;
        const effective = hasKids ? (childrenPlannedSum.get(l.id) ?? 0) : toMoneyNumber(l.plannedAmount);
        plannedEffectiveByLine.set(l.id, effective);
    }

    // 9) plannedTotal:
    // Para evitar doble conteo, el total plan lo calculamos como SUM de DETALLES (hojas)
    // (alternativa equivalente: SUM de capítulos efectivos, pero solo roots)
    const plannedTotal = linesRaw.reduce((acc, l) => {
        const hasKids = (childrenCount.get(l.id) ?? 0) > 0;
        if (hasKids) return acc; // no sumar capítulos
        return acc + toMoneyNumber(l.plannedAmount);
    }, 0);

    // 10) Disponibles
    const availableVsActual = plannedTotal - actualTotal;
    const availableVsCommitted = plannedTotal - (actualTotal + committedTotal);

    // 11) Líneas serializables (sin Decimal) usando plannedAmountEffective
    const lines: BudgetLineSummary[] = linesRaw.map((l) => ({
        id: l.id,
        code: l.code,
        title: l.title,
        category: l.category,
        parentId: l.parentId ?? null,

        plannedAmount: plannedEffectiveByLine.get(l.id) ?? 0, // ✅ effective
        committedAmount: byLineCommitted.get(l.id) ?? 0,
        actualAmount: byLineActual.get(l.id) ?? 0,
    }));

    return {
        currencyCode,
        activeBudget,
        draftBudget,
        plannedTotal,
        committedTotal,
        actualTotal,
        revenueTotal,
        availableVsActual,
        availableVsCommitted,
        lines,
    };
}