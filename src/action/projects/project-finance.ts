"use server";

import { prisma } from "@/lib/prisma";
import { requireTenantId, requireUserId } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { BudgetStatus, CommitmentType, CostDocType, CostKind, CostCategory, RevenueType, SenderKind } from "../../../generated/prisma/enums";

type MoneyNum = number;

export type CommitmentRow = {
    id: string;
    type: CommitmentType;
    category: CostCategory;
    amount: MoneyNum;
    currencyCode: string;
    budgetLineId: string;
    budgetLineCode: string;
    budgetLineTitle: string;
    partnerId: string | null;
    reference: string | null;
    occurredAt: Date | null;
    createdAt: Date;
};

export type CostRow = {
    id: string;
    amount: MoneyNum;
    currencyCode: string;
    budgetLineId: string;
    budgetLineCode: string;
    budgetLineTitle: string;
    docType: CostDocType | null;
    docNo: string | null;
    occurredAt: Date | null;
    createdAt: Date;
};

function toNumber(v: any): number {
    if (v == null) return 0;
    if (typeof v === "object" && typeof v.toNumber === "function") return v.toNumber();
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}

async function getActiveApprovedBudget(tenantId: string, projectId: string) {
    return prisma.projectBudget.findFirst({
        where: { tenantId, projectId, status: BudgetStatus.APPROVED },
        orderBy: [{ version: "desc" }],
        select: { id: true, version: true, status: true },
    });
}

async function assertMovementsAllowedAndGetActiveBudget(tenantId: string, projectId: string) {
    const active = await getActiveApprovedBudget(tenantId, projectId);
    if (!active) {
        return {
            ok: false as const,
            message: "No puedes registrar movimientos: el proyecto no tiene un presupuesto aprobado (APPROVED).",
        };
    }
    return { ok: true as const, active };
}

async function assertLineBelongsToActiveBudget(tenantId: string, projectId: string, budgetLineId: string) {
    const chk = await assertMovementsAllowedAndGetActiveBudget(tenantId, projectId);
    if (!chk.ok) return chk;

    const line = await prisma.projectBudgetLine.findFirst({
        where: { tenantId, id: budgetLineId, budgetId: chk.active.id },
        select: { id: true, code: true, title: true, parentId: true, category: true },
    });

    if (!line) {
        return {
            ok: false as const,
            message: "Línea inválida. Solo puedes registrar movimientos en líneas del presupuesto activo (APPROVED).",
        };
    }

    // Solo hojas (detalle), no capítulos
    if (!line.parentId) {
        return {
            ok: false as const,
            message: "Debes seleccionar una línea de detalle (ej: 01.10). Los capítulos (01) no son imputables.",
        };
    }

    return { ok: true as const, active: chk.active, line };
}

// ✅ Regla SAP-like: para movimientos debe existir un budget APPROVED
async function assertMovementsAllowed(tenantId: string, projectId: string) {
    const approved = await prisma.projectBudget.findFirst({
        where: { tenantId, projectId, status: BudgetStatus.APPROVED },
        select: { id: true, version: true },
        orderBy: [{ version: "desc" }],
    });
    if (!approved) {
        return { ok: false as const, message: "No puedes registrar movimientos hasta que exista un presupuesto APPROVED." };
    }
    return { ok: true as const, approved };
}

/** ---------------------------------------------------------
 *  Líneas imputables (para selects): solo detalles del APPROVED
 *  --------------------------------------------------------- */
export async function getPostableBudgetLinesAction(projectId: string) {
    const tenantId = await requireTenantId();

    const chk = await assertMovementsAllowedAndGetActiveBudget(tenantId, projectId);
    if (!chk.ok) return { ok: false as const, message: chk.message, lines: [] as const };

    const lines = await prisma.projectBudgetLine.findMany({
        where: { tenantId, budgetId: chk.active.id, parentId: { not: null } },
        orderBy: [{ code: "asc" }],
        select: { id: true, code: true, title: true, category: true },
    });

    return {
        ok: true as const,
        budget: chk.active,
        lines: lines.map((l) => ({ ...l })),
    };
}

/** ----------------------------
 *  Commitments: list + create
 *  ---------------------------- */

export async function listProjectCommitmentsAction(projectId: string) {
    const tenantId = await requireTenantId();

    // list siempre permitido, pero útil mostrar "active" para UI
    const active = await getActiveApprovedBudget(tenantId, projectId);

    const rows = await prisma.projectCommitment.findMany({
        where: { tenantId, projectId },
        orderBy: [{ createdAt: "desc" }],
        select: {
            id: true,
            type: true,
            category: true,
            amount: true,
            currencyCode: true,
            budgetLineId: true,
            partnerId: true,
            reference: true,
            occurredAt: true,
            createdAt: true,
            budgetLine: { select: { code: true, title: true } },
        },
    });

    return {
        ok: true as const,
        activeBudget: active,
        items: rows.map((r) => ({
            id: r.id,
            type: r.type,
            category: r.category,
            amount: toNumber(r.amount),
            currencyCode: r.currencyCode,
            budgetLineId: r.budgetLineId,
            budgetLineCode: r.budgetLine?.code ?? "—",
            budgetLineTitle: r.budgetLine?.title ?? "—",
            partnerId: r.partnerId ?? null,
            reference: r.reference ?? null,
            occurredAt: r.occurredAt ?? null,
            createdAt: r.createdAt,
        })),
    };
}

export async function createProjectCommitmentAction(projectId: string, formData: FormData) {
    const tenantId = await requireTenantId();
    const userId = await requireUserId();

    // ✅ Gate general (requiere APPROVED)
    const gate = await assertMovementsAllowed(tenantId, projectId);
    if (!gate.ok) return gate;

    const type = String(formData.get("type") ?? "").trim() as CommitmentType;
    const budgetLineId = String(formData.get("budgetLineId") ?? "").trim();

    const partnerIdRaw = String(formData.get("partnerId") ?? "").trim();
    const partnerId = partnerIdRaw ? partnerIdRaw : null;

    const amountRaw = String(formData.get("amount") ?? "").trim();
    const reference = String(formData.get("reference") ?? "").trim() || null;
    const notes = String(formData.get("notes") ?? "").trim() || null;
    const occurredAtRaw = String(formData.get("occurredAt") ?? "").trim();

    // --- Validaciones ---
    if (!budgetLineId) return { ok: false as const, message: "Selecciona una línea de detalle." };

    const amount = Number(amountRaw);
    if (!Number.isFinite(amount) || amount <= 0) {
        return { ok: false as const, message: "Monto inválido. Debe ser mayor a 0." };
    }

    const parseDate = (s: string) => {
        if (!s) return null;
        const d = new Date(s);
        return Number.isFinite(d.getTime()) ? d : null;
    };
    const occurredAt = parseDate(occurredAtRaw) ?? new Date();

    // --- Moneda del tenant ---
    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { defaultCurrencyCode: true },
    });
    const currencyCode = tenant?.defaultCurrencyCode ?? null;
    if (!currencyCode) return { ok: false as const, message: "El tenant no tiene moneda por defecto configurada." };

    // ✅ Presupuesto activo (APPROVED)
    const activeBudget = await prisma.projectBudget.findFirst({
        where: { tenantId, projectId, status: BudgetStatus.APPROVED },
        orderBy: [{ version: "desc" }],
        select: { id: true, version: true },
    });
    if (!activeBudget) return { ok: false as const, message: "No hay presupuesto aprobado (APPROVED)." };

    // ✅ Línea debe ser DETALLE del presupuesto activo (APPROVED)
    const line = await prisma.projectBudgetLine.findFirst({
        where: {
            tenantId,
            id: budgetLineId,
            budgetId: activeBudget.id,
            parentId: { not: null }, // detalle (hoja)
        },
        select: { id: true, code: true, title: true, category: true },
    });
    if (!line) {
        return { ok: false as const, message: "Línea inválida. Debe ser un detalle del presupuesto activo (APPROVED)." };
    }

    // Partner opcional, pero si llega debe existir y pertenecer al tenant
    if (partnerId) {
        const bp = await prisma.businessPartner.findFirst({
            where: { tenantId, id: partnerId },
            select: { id: true, code: true },
        });
        if (!bp) return { ok: false as const, message: "Tercero (BP) inválido." };
    }

    try {
        const created = await prisma.$transaction(async (tx) => {
            const row = await tx.projectCommitment.create({
                data: {
                    tenantId,
                    projectId,
                    type,
                    category: line.category, // ✅ SAP-like: se deriva de la línea
                    amount,
                    currencyCode,
                    partnerId,
                    budgetLineId: line.id, // ✅ obligatorio por regla de negocio
                    reference,
                    notes,
                    occurredAt,
                },
                select: { id: true },
            });

            const moneyStr = `${amount.toLocaleString("es-CO", { maximumFractionDigits: 2 })} ${currencyCode}`;

            await tx.timelineEvent.create({
                data: {
                    tenantId,
                    projectId,
                    type: "COMMITMENT_CREATED",
                    title: "Compromiso creado",
                    description: `${line.code} • ${line.title} • ${moneyStr}`,
                    actorUserId: userId,
                    senderKind: SenderKind.SYSTEM,
                    metadata: {
                        commitmentId: row.id,
                        budgetVersion: activeBudget.version,
                        budgetLineId: line.id,
                        budgetLineCode: line.code,
                        category: line.category,
                        amount,
                        currencyCode,
                        type,
                        partnerId,
                        reference,
                        occurredAt: occurredAt.toISOString(),
                    },
                },
            });

            return row;
        });

        revalidatePath(`/projects/${projectId}/budget`);
        revalidatePath(`/projects/${projectId}`);
        return { ok: true as const, id: created.id };
    } catch (e) {
        console.error(e);
        return { ok: false as const, message: "No se pudo crear el compromiso. Revisa logs." };
    }
}

export async function deleteProjectCommitmentAction(projectId: string, commitmentId: string) {
    const tenantId = await requireTenantId();
    const userId = await requireUserId();

    // Gate: solo si existe APPROVED (tu política)
    const gate = await assertMovementsAllowed(tenantId, projectId);
    if (!gate.ok) return gate;

    const row = await prisma.projectCommitment.findFirst({
        where: { tenantId, projectId, id: commitmentId },
        select: {
            id: true,
            type: true,
            category: true,
            amount: true,
            currencyCode: true,
            reference: true,
            budgetLine: { select: { code: true, title: true, id: true } },
        },
    });
    if (!row) return { ok: false as const, message: "Compromiso no encontrado." };

    try {
        await prisma.$transaction(async (tx) => {
            await tx.projectCommitment.delete({ where: { id: row.id } });

            const amountNum = Number(row.amount);
            const moneyStr = `${amountNum.toLocaleString("es-CO", { maximumFractionDigits: 2 })} ${row.currencyCode}`;

            await tx.timelineEvent.create({
                data: {
                    tenantId,
                    projectId,
                    type: "COMMITMENT_DELETED",
                    title: "Compromiso eliminado",
                    description: `${row.budgetLine?.code ?? "—"} • ${row.budgetLine?.title ?? "Sin línea"} • ${moneyStr}`,
                    actorUserId: userId,
                    senderKind: SenderKind.SYSTEM,
                    metadata: {
                        commitmentId: row.id,
                        type: row.type,
                        category: row.category,
                        amount: amountNum,
                        currencyCode: row.currencyCode,
                        reference: row.reference,
                        budgetLineId: row.budgetLine?.id ?? null,
                        budgetLineCode: row.budgetLine?.code ?? null,
                    },
                },
            });
        });

        revalidatePath(`/projects/${projectId}/budget`);
        revalidatePath(`/projects/${projectId}`);
        return { ok: true as const };
    } catch (e) {
        console.error(e);
        return { ok: false as const, message: "No se pudo eliminar el compromiso. Revisa logs." };
    }
}

/** ----------------------------
 *  Costs (ACTUAL): list + create
 *  ---------------------------- */

export async function listProjectActualCostsAction(projectId: string) {
    const tenantId = await requireTenantId();

    const rows = await prisma.projectCost.findMany({
        where: { tenantId, projectId, kind: CostKind.ACTUAL },
        orderBy: [{ createdAt: "desc" }],
        select: {
            id: true,
            amount: true,
            currencyCode: true,
            budgetLineId: true,
            docType: true,
            docNo: true,
            occurredAt: true,
            createdAt: true,
            budgetLine: { select: { code: true, title: true } },
        },
    });

    return {
        ok: true as const,
        items: rows.map((r) => ({
            id: r.id,
            amount: toNumber(r.amount),
            currencyCode: r.currencyCode,
            budgetLineId: r.budgetLineId ?? "",
            budgetLineCode: r.budgetLine?.code ?? "—",
            budgetLineTitle: r.budgetLine?.title ?? "—",
            docType: r.docType ?? null,
            docNo: r.docNo ?? null,
            occurredAt: r.occurredAt ?? null,
            createdAt: r.createdAt,
        })),
    };
}

export async function createProjectActualCostAction(projectId: string, formData: FormData) {
    const tenantId = await requireTenantId();
    const actorUserId = await requireUserId();

    const amountRaw = String(formData.get("amount") ?? "").trim();
    const budgetLineId = String(formData.get("budgetLineId") ?? "").trim();

    const docTypeRaw = String(formData.get("docType") ?? "").trim();
    const docType = docTypeRaw ? (docTypeRaw as CostDocType) : null;

    const docNoRaw = String(formData.get("docNo") ?? "").trim();
    const docNo = docNoRaw ? docNoRaw : null;

    const occurredAtRaw = String(formData.get("occurredAt") ?? "").trim();
    const occurredAt = occurredAtRaw ? new Date(occurredAtRaw) : null;

    const notesRaw = String(formData.get("notes") ?? "").trim();
    const notes = notesRaw ? notesRaw : null;

    if (!budgetLineId) return { ok: false as const, message: "Selecciona una línea de detalle." };

    const amount = Number(amountRaw);
    if (!Number.isFinite(amount) || amount <= 0) return { ok: false as const, message: "Monto inválido." };

    // moneda del tenant
    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { defaultCurrencyCode: true },
    });
    const currencyCode = tenant?.defaultCurrencyCode ?? null;
    if (!currencyCode) return { ok: false as const, message: "El tenant no tiene moneda por defecto." };

    const chk = await assertLineBelongsToActiveBudget(tenantId, projectId, budgetLineId);
    if (!chk.ok) return { ok: false as const, message: chk.message };

    const created = await prisma.$transaction(async (tx) => {
        const c = await tx.projectCost.create({
            data: {
                tenantId,
                projectId,
                kind: CostKind.ACTUAL,
                category: chk.line.category,
                amount,
                currencyCode,
                budgetLineId,
                docType,
                docNo,
                occurredAt,
                notes,
            },
            select: { id: true },
        });

        await tx.timelineEvent.create({
            data: {
                tenantId,
                projectId,
                type: "COST_RECORDED",
                title: "Gasto registrado",
                description: `${chk.line.code} • ${chk.line.title} • ${amount.toLocaleString("es-CO")} ${currencyCode}`,
                actorUserId,
                senderKind: "SYSTEM",
                metadata: {
                    costId: c.id,
                    budgetId: chk.active.id,
                    budgetVersion: chk.active.version,
                    budgetLineId,
                    budgetLineCode: chk.line.code,
                    amount,
                    currencyCode,
                    docType,
                    docNo,
                },
            },
        });

        return c;
    });

    revalidatePath(`/projects/${projectId}/budget`);
    revalidatePath(`/projects/${projectId}`);

    return { ok: true as const, id: created.id };
}

export async function deleteProjectActualCostAction(projectId: string, costId: string) {
    const tenantId = await requireTenantId();
    const userId = await requireUserId();

    // ✅ Gate: debe existir presupuesto APPROVED
    const gate = await assertMovementsAllowed(tenantId, projectId);
    if (!gate.ok) return gate;

    // ✅ Validar costo (solo ACTUAL)
    const row = await prisma.projectCost.findFirst({
        where: { id: costId, tenantId, projectId, kind: CostKind.ACTUAL },
        select: {
            id: true,
            amount: true,
            category: true,
            occurredAt: true,
            docType: true,
            docNo: true,
            partnerId: true,
            budgetLineId: true,
            notes: true,
        },
    });

    if (!row) return { ok: false as const, message: "Gasto no encontrado." };

    await prisma.$transaction(async (tx) => {
        await tx.projectCost.delete({ where: { id: row.id } });

        await tx.timelineEvent.create({
            data: {
                tenantId,
                projectId,
                type: "COST_DELETED",
                title: "Gasto eliminado",
                description: row.docNo ? `Doc: ${row.docNo}` : null,
                actorUserId: userId,
                senderKind: "SYSTEM",
                metadata: {
                    costId: row.id,
                    amount: Number(row.amount),
                    category: row.category,
                    occurredAt: row.occurredAt,
                    docType: row.docType,
                    docNo: row.docNo,
                    partnerId: row.partnerId,
                    budgetLineId: row.budgetLineId,
                    notes: row.notes,
                },
            },
        });
    });

    revalidatePath(`/projects/${projectId}/budget`);
    revalidatePath(`/projects/${projectId}`);
    return { ok: true as const };
}

/** ----------------------------
 *  Revenues (ACTUAL): list + create
 *  ---------------------------- */

export async function listProjectRevenuesAction(projectId: string) {
    const tenantId = await requireTenantId();

    const rows = await prisma.projectRevenue.findMany({
        where: { tenantId, projectId },
        orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
        select: {
            id: true,
            type: true,
            amount: true,
            currencyCode: true,
            expectedAt: true,
            receivedAt: true,
            occurredAt: true,
            notes: true,
            createdAt: true,
        },
    });

    return {
        ok: true as const,
        rows: rows.map((r) => ({
            id: r.id,
            type: r.type,
            amount: Number(r.amount),
            currencyCode: r.currencyCode,
            expectedAt: r.expectedAt ? r.expectedAt.toISOString() : null,
            receivedAt: r.receivedAt ? r.receivedAt.toISOString() : null,
            occurredAt: r.occurredAt ? r.occurredAt.toISOString() : null,
            notes: r.notes ?? null,
            createdAt: r.createdAt.toISOString(),
        })),
    };
}

export async function createProjectRevenueAction(projectId: string, formData: FormData) {
    const tenantId = await requireTenantId();
    const userId = await requireUserId(); // por si luego lo guardas en metadata/timeline

    // ✅ bloqueo
    const gate = await assertMovementsAllowed(tenantId, projectId);
    if (!gate.ok) return gate;

    const type = String(formData.get("type") ?? "").trim() as RevenueType;
    const amountRaw = String(formData.get("amount") ?? "").trim();
    const expectedAtRaw = String(formData.get("expectedAt") ?? "").trim();
    const receivedAtRaw = String(formData.get("receivedAt") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim() || null;

    const amount = Number(amountRaw);
    if (!Number.isFinite(amount) || amount <= 0) {
        return { ok: false as const, message: "Monto inválido. Debe ser mayor a 0." };
    }

    // moneda del tenant
    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { defaultCurrencyCode: true },
    });
    const currencyCode = tenant?.defaultCurrencyCode ?? null;
    if (!currencyCode) return { ok: false as const, message: "El tenant no tiene moneda por defecto configurada." };

    const parseDate = (s: string) => {
        if (!s) return null;
        const d = new Date(s);
        return Number.isFinite(d.getTime()) ? d : null;
    };

    const expectedAt = parseDate(expectedAtRaw);
    const receivedAt = parseDate(receivedAtRaw);

    const occurredAt = receivedAt ?? expectedAt ?? new Date();

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1) crear revenue
            const row = await tx.projectRevenue.create({
                data: {
                    tenantId,
                    projectId,
                    type,
                    amount,
                    currencyCode,
                    expectedAt,
                    receivedAt,
                    occurredAt,
                    notes,
                },
                select: { id: true },
            });

            // 2) timeline event
            const moneyStr = `${amount.toLocaleString("es-CO", { maximumFractionDigits: 2 })} ${currencyCode}`;
            const title = `Ingreso registrado • ${type}`;
            const descriptionParts = [
                `Monto: ${moneyStr}`,
                expectedAt ? `Esperado: ${expectedAt.toISOString().slice(0, 10)}` : null,
                receivedAt ? `Recibido: ${receivedAt.toISOString().slice(0, 10)}` : null,
                notes ? `Notas: ${notes}` : null,
            ].filter(Boolean);

            await tx.timelineEvent.create({
                data: {
                    tenantId,
                    projectId,
                    type: "REVENUE_CREATED",
                    title,
                    description: descriptionParts.join(" • "),
                    actorUserId: userId,
                    senderKind: "SYSTEM", // si prefieres USER y tu enum lo permite, cámbialo
                    metadata: {
                        revenueId: row.id,
                        revenueType: type,
                        amount,
                        currencyCode,
                        expectedAt: expectedAt?.toISOString() ?? null,
                        receivedAt: receivedAt?.toISOString() ?? null,
                        occurredAt: occurredAt.toISOString(),
                    },
                },
                select: { id: true },
            });

            return row;
        });

        revalidatePath(`/projects/${projectId}/budget`);
        revalidatePath(`/projects/${projectId}`); // opcional: si muestras timeline en overview
        return { ok: true as const, id: result.id };
    } catch (e) {
        console.error(e);
        return { ok: false as const, message: "No se pudo registrar el ingreso. Revisa logs." };
    }
}

export async function deleteProjectRevenueAction(projectId: string, revenueId: string) {
    const tenantId = await requireTenantId();
    const userId = await requireUserId();

    // ✅ Gate: debe existir APPROVED
    const gate = await assertMovementsAllowed(tenantId, projectId);
    if (!gate.ok) return gate;

    const row = await prisma.projectRevenue.findFirst({
        where: { id: revenueId, tenantId, projectId },
        select: {
            id: true,
            type: true,
            amount: true,
            currencyCode: true,
            expectedAt: true,
            receivedAt: true,
            occurredAt: true,
            notes: true,
        },
    });
    if (!row) return { ok: false as const, message: "Ingreso no encontrado." };

    try {
        await prisma.$transaction(async (tx) => {
            await tx.projectRevenue.delete({ where: { id: row.id } });

            await tx.timelineEvent.create({
                data: {
                    tenantId,
                    projectId,
                    type: "REVENUE_DELETED",
                    title: "Ingreso eliminado",
                    description: null,
                    actorUserId: userId,
                    senderKind: "SYSTEM",
                    metadata: {
                        revenueId: row.id,
                        revenueType: row.type,
                        amount: Number(row.amount),
                        currencyCode: row.currencyCode,
                        expectedAt: row.expectedAt?.toISOString() ?? null,
                        receivedAt: row.receivedAt?.toISOString() ?? null,
                        occurredAt: row.occurredAt?.toISOString?.() ?? row.occurredAt ?? null,
                        notes: row.notes,
                    },
                },
            });
        });

        revalidatePath(`/projects/${projectId}/budget`);
        revalidatePath(`/projects/${projectId}`);
        return { ok: true as const };
    } catch (e) {
        console.error(e);
        return { ok: false as const, message: "No se pudo eliminar el ingreso. Revisa logs." };
    }
}