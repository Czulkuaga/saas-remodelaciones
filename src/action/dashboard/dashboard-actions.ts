"use server";

import { prisma } from "@/lib/prisma";
import { requireTenantId } from "@/lib/auth/session";
import { requirePermission } from "@/action/roles/rbac";
import { ProjectStatus } from "../../../generated/prisma/enums";

export type DashboardRange = "today" | "7d" | "30d";

function startOfDay(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}
function addDays(d: Date, days: number) {
    const x = new Date(d);
    x.setDate(x.getDate() + days);
    return x;
}
function clampRange(raw?: string): DashboardRange {
    if (raw === "today" || raw === "7d" || raw === "30d") return raw;
    return "7d";
}
function rangeToDates(range: DashboardRange) {
    const now = new Date();
    const end = now;
    if (range === "today") return { start: startOfDay(now), end };
    if (range === "7d") return { start: addDays(now, -7), end };
    return { start: addDays(now, -30), end };
}

function decToNumber(x: unknown): number {
    if (x == null) return 0;
    if (typeof x === "object" && x !== null && "toString" in x) return Number((x as any).toString());
    if (typeof x === "number") return x;
    if (typeof x === "string") return Number(x);
    return 0;
}

function money(n: number) {
    return n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

export type DashboardKpiKey =
    | "active_projects"
    | "overdue_tasks"
    | "risky_projects"
    | "budgets_to_approve"
    | "period_costs"
    | "period_commitments"
    | "period_revenues"
    | "period_margin"
    | "period_roi";

export type DashboardKpi = {
    key: DashboardKpiKey;
    title: string;
    value: string;
    note?: string;
    progress?: number;
    tone?: "indigo" | "emerald" | "amber" | "fuchsia" | "rose" | "blue";
};

export type WorkItem =
    | { kind: "TASK_OVERDUE"; title: string; project: string; due: Date | null; href: string }
    | { kind: "BUDGET_DRAFT"; title: string; project: string; href: string }
    | { kind: "PROJECT_STALE"; title: string; project: string; lastActivityAt: Date | null; href: string };

export type AlertItem = {
    tone: "primary" | "blue" | "amber" | "red";
    title: string;
    desc: string;
    time: string;
};

export type ActiveProjectProgressRow = {
    id: string;
    code: string;
    name: string;
    progressPct: number; // 0..100
    overdueTasks: number;
    stale: boolean;
};

export type FinancialTrendPoint = {
    label: string; // "Lun", "Mar" ... o "2026-03-05"
    costs: number;
    commitments: number;
    revenues: number;
    margin: number;
};

type AlertTone = AlertItem["tone"];

function relTime(d: Date) {
    const ms = Date.now() - d.getTime();
    const mins = Math.round(ms / 60000);
    if (mins < 60) return `Hace ${mins} min`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `Hace ${hrs} horas`;
    const days = Math.round(hrs / 24);
    return `Hace ${days} días`;
}

function toneFromAudit(action: string): AlertTone {
    const a = action.toUpperCase();
    if (a.includes("ROLE") || a.includes("PERMISSION")) return "red";
    if (a.includes("LOGIN") || a.includes("SESSION")) return "amber";
    return "primary";
}
function toneFromEvent(type: string): AlertTone {
    const t = type.toUpperCase();
    if (t.includes("SECURITY")) return "amber";
    if (t.includes("BUDGET") || t.includes("COST")) return "primary";
    return "blue";
}

function dayKey(d: Date) {
    // YYYY-MM-DD en local
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
}

function labelForRange(range: DashboardRange, isoDay: string) {
    if (range === "today") {
        // hoy no necesita etiqueta bonita
        return isoDay;
    }
    // para 7d/30d: etiqueta corta "MM-DD"
    return isoDay.slice(5);
}

export async function getDashboardOverviewAction(input?: { range?: string }) {
    // Si aún no tienes dashboard.read, puedes comentar esta línea
    await requirePermission("dashboard.read").catch(() => null);

    const tenantId = await requireTenantId();

    const range = clampRange(input?.range);
    const { start, end } = rangeToDates(range);

    // 1) Proyectos activos (portfolio)
    const activeProjects = await prisma.remodelingProject.findMany({
        where: {
            tenantId,
            archivedAt: null,
            deletedAt: null,
            status: { notIn: [ProjectStatus.COMPLETED, ProjectStatus.CANCELLED] },
        },
        select: { id: true, code: true, name: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
    });

    const activeProjectIds = activeProjects.map((p) => p.id);

    // 2) Financieros por periodo (rango)
    const [expenseAllocations, commitmentAgg, revenueAgg] = await Promise.all([
        prisma.projectExpenseAllocation.findMany({
            where: {
                tenantId,
                projectId: { in: activeProjectIds },
                expense: {
                    status: "POSTED" as any,
                    occurredAt: { gte: start, lte: end },
                },
            },
            select: {
                amount: true,
            },
        }),
        prisma.projectCommitment.aggregate({
            where: {
                tenantId,
                projectId: { in: activeProjectIds },
                occurredAt: { gte: start, lte: end },
            },
            _sum: { amount: true },
        }),
        prisma.projectRevenue.aggregate({
            where: {
                tenantId,
                projectId: { in: activeProjectIds },
                occurredAt: { gte: start, lte: end },
            },
            _sum: { amount: true },
        }),
    ]);

    const periodCosts = expenseAllocations.reduce((acc, x) => acc + decToNumber(x.amount), 0);
    const periodCommitments = decToNumber(commitmentAgg._sum.amount);
    const periodRevenues = decToNumber(revenueAgg._sum.amount);
    const periodMargin = periodRevenues - periodCosts - periodCommitments;

    const investment = periodCosts + periodCommitments;
    const periodRoi = investment > 0 ? ((periodMargin / investment) * 100) : 0;

    // 3) Presupuestos draft (pendientes)
    const budgetsDraftCount = await prisma.projectBudget.count({
        where: { tenantId, projectId: { in: activeProjectIds }, status: "DRAFT" as any },
    });

    // 4) Costos sin aprobar
    const costsNotApproved = await prisma.projectExpense.count({
        where: {
            tenantId,
            projectId: { in: activeProjectIds },
            isApproved: false,
            status: { in: ["DRAFT", "REVIEW_PENDING"] as any },
        },
    });

    // 5) Tareas vencidas (conteo + top para worklist)
    const overdueTasksTop = await prisma.remodelingTask.findMany({
        where: {
            tenantId,
            projectId: { in: activeProjectIds },
            dueDate: { not: null, lt: new Date() },
            status: { notIn: ["DONE", "CANCELLED"] as any },
        },
        select: {
            id: true,
            title: true,
            dueDate: true,
            projectId: true,
            project: { select: { id: true, name: true, code: true } },
        },
        orderBy: { dueDate: "asc" },
        take: 8,
    });

    const overdueByProject = await prisma.remodelingTask.groupBy({
        by: ["projectId"],
        where: {
            tenantId,
            projectId: { in: activeProjectIds },
            dueDate: { not: null, lt: new Date() },
            status: { notIn: ["DONE", "CANCELLED"] as any },
        },
        _count: { _all: true },
    });

    const overdueTasksCount = overdueByProject.reduce((acc, r) => acc + r._count._all, 0);
    const overdueProjectIds = new Set(overdueByProject.map((r) => r.projectId).filter(Boolean) as string[]);
    const overdueCountMap = new Map<string, number>();
    for (const r of overdueByProject) overdueCountMap.set(r.projectId, r._count._all);

    // 6) Proyectos sin actividad reciente (stale)
    const lastActivity = await prisma.timelineEvent.groupBy({
        by: ["projectId"],
        where: { tenantId, projectId: { in: activeProjectIds }, createdAt: { lte: end } },
        _max: { createdAt: true },
    });

    const lastMap = new Map<string, Date>();
    for (const row of lastActivity) {
        if (row.projectId && row._max.createdAt) lastMap.set(row.projectId, row._max.createdAt);
    }

    const staleThresholdDays = range === "today" ? 3 : 7;
    const staleThreshold = addDays(new Date(), -staleThresholdDays);

    const staleProjectIds = new Set<string>();
    for (const p of activeProjects) {
        const last = lastMap.get(p.id) ?? p.updatedAt;
        if (last < staleThreshold) staleProjectIds.add(p.id);
    }

    // 7) Proyectos en riesgo (unión: overdue OR stale)
    const riskyProjectIds = new Set<string>();
    for (const x of overdueProjectIds) riskyProjectIds.add(x);
    for (const x of staleProjectIds) riskyProjectIds.add(x);
    const riskyCount = riskyProjectIds.size;

    // 8) Proyectos activos con progreso (por tareas DONE/total peso)
    const projectsForProgress = await prisma.remodelingProject.findMany({
        where: { tenantId, id: { in: activeProjectIds } },
        select: {
            id: true,
            code: true,
            name: true,
            tasks: { select: { status: true, weight: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 6,
    });

    const activeProjectsProgress: ActiveProjectProgressRow[] = projectsForProgress.map((p) => {
        const total = p.tasks.reduce((a, t) => a + (t.weight ?? 1), 0);
        const done = p.tasks
            .filter((t) => t.status === ("DONE" as any))
            .reduce((a, t) => a + (t.weight ?? 1), 0);

        const pct = total > 0 ? Math.round((done / total) * 100) : 0;

        return {
            id: p.id,
            code: p.code,
            name: p.name,
            progressPct: pct,
            overdueTasks: overdueCountMap.get(p.id) ?? 0,
            stale: staleProjectIds.has(p.id),
        };
    });

    // 9) Tendencia financiera (dataset por día)
    // Nota: tu occurredAt puede ser null en algunos modelos; filtramos not null
    const [expenseRows, commitRows, revenueRows] = await Promise.all([
        prisma.projectExpenseAllocation.findMany({
            where: {
                tenantId,
                projectId: { in: activeProjectIds },
                expense: {
                    status: "POSTED" as any,
                    occurredAt: { not: null, gte: start, lte: end } as any,
                },
            },
            select: {
                amount: true,
                expense: {
                    select: {
                        occurredAt: true,
                    },
                },
            },
            take: 5000,
        }),
        prisma.projectCommitment.findMany({
            where: {
                tenantId,
                projectId: { in: activeProjectIds },
                occurredAt: { not: null, gte: start, lte: end } as any,
            },
            select: { occurredAt: true, amount: true },
            take: 5000,
        }),
        prisma.projectRevenue.findMany({
            where: {
                tenantId,
                projectId: { in: activeProjectIds },
                occurredAt: { not: null, gte: start, lte: end } as any,
            },
            select: { occurredAt: true, amount: true },
            take: 5000,
        }),
    ]);

    const byDay = new Map<string, { costs: number; commitments: number; revenues: number }>();

    const addTo = (iso: string, field: "costs" | "commitments" | "revenues", amount: number) => {
        const cur = byDay.get(iso) ?? { costs: 0, commitments: 0, revenues: 0 };
        cur[field] += amount;
        byDay.set(iso, cur);
    };

    for (const r of expenseRows) {
        const occurredAt = r.expense?.occurredAt;
        if (!occurredAt) continue;
        addTo(dayKey(occurredAt), "costs", decToNumber(r.amount));
    }
    for (const r of commitRows) {
        if (!r.occurredAt) continue;
        addTo(dayKey(r.occurredAt), "commitments", decToNumber(r.amount));
    }
    for (const r of revenueRows) {
        if (!r.occurredAt) continue;
        addTo(dayKey(r.occurredAt), "revenues", decToNumber(r.amount));
    }

    // Construimos serie completa día a día
    const trend: FinancialTrendPoint[] = [];
    for (let d = startOfDay(start); d <= end; d = addDays(d, 1)) {
        const iso = dayKey(d);
        const row = byDay.get(iso) ?? { costs: 0, commitments: 0, revenues: 0 };
        const margin = row.revenues - row.costs - row.commitments;
        trend.push({
            label: labelForRange(range, iso),
            costs: row.costs,
            commitments: row.commitments,
            revenues: row.revenues,
            margin,
        });
    }

    // 10) Alerts reales (AuditLog + TimelineEvent)
    const [auditLogs, events] = await Promise.all([
        prisma.auditLog.findMany({
            where: { tenantId },
            orderBy: { createdAt: "desc" },
            take: 6,
            select: { action: true, resourceType: true, message: true, createdAt: true, path: true },
        }),
        prisma.timelineEvent.findMany({
            where: { tenantId },
            orderBy: { createdAt: "desc" },
            take: 6,
            select: { type: true, title: true, description: true, createdAt: true },
        }),
    ]);

    const alerts: AlertItem[] = [
        ...auditLogs.map((a) => ({
            tone: toneFromAudit(a.action),
            title: `${a.action} · ${a.resourceType}`,
            desc: a.message ?? a.path ?? "Cambio registrado",
            time: relTime(a.createdAt),
        })),
        ...events.map((e) => ({
            tone: toneFromEvent(e.type),
            title: e.title ?? e.type,
            desc: e.description ?? "Evento registrado",
            time: relTime(e.createdAt),
        })),
    ].slice(0, 8);

    // 11) Worklist
    const worklist: WorkItem[] = [
        ...overdueTasksTop.map((t) => ({
            kind: "TASK_OVERDUE" as const,
            title: t.title,
            project: `${t.project.code} · ${t.project.name}`,
            due: t.dueDate,
            href: `/projects/${t.project.id}/tasks`,
        })),
    ];

    const draftBudgets = await prisma.projectBudget.findMany({
        where: { tenantId, projectId: { in: activeProjectIds }, status: "DRAFT" as any },
        orderBy: { updatedAt: "desc" },
        take: 6,
        select: {
            id: true,
            projectId: true,
            version: true,
            name: true,
            project: { select: { id: true, code: true, name: true } },
        },
    });

    worklist.push(
        ...draftBudgets.map((b) => ({
            kind: "BUDGET_DRAFT" as const,
            title: `Presupuesto v${b.version}${b.name ? ` · ${b.name}` : ""} (DRAFT)`,
            project: `${b.project.code} · ${b.project.name}`,
            href: `/projects/${b.project.id}/budget`,
        }))
    );

    // 12) KPIs (8 + ROI)
    const kpis: DashboardKpi[] = [
        {
            key: "active_projects",
            title: "Obras activas",
            value: String(activeProjects.length),
            note: staleProjectIds.size ? `${staleProjectIds.size} sin actividad reciente` : "Operación estable",
            tone: "indigo",
        },
        {
            key: "overdue_tasks",
            title: "Tareas vencidas",
            value: String(overdueTasksCount),
            note: overdueTasksCount ? "Prioridad alta" : "Sin vencimientos",
            tone: overdueTasksCount ? "rose" : "indigo",
        },
        {
            key: "risky_projects",
            title: "Proyectos en riesgo",
            value: String(riskyCount),
            note: riskyCount ? "Vencimientos / sin actividad" : "Sin riesgos detectados",
            tone: riskyCount ? "amber" : "indigo",
        },
        {
            key: "budgets_to_approve",
            title: "Presupuestos por aprobar",
            value: String(budgetsDraftCount),
            note: budgetsDraftCount ? "Versiones en DRAFT" : "Sin pendientes",
            tone: budgetsDraftCount ? "amber" : "indigo",
        },

        // Finanzas del periodo
        {
            key: "period_costs",
            title: "Costos del periodo",
            value: money(periodCosts),
            note: costsNotApproved ? `Sin aprobar: ${costsNotApproved}` : "Todo aprobado",
            tone: "fuchsia",
        },
        {
            key: "period_commitments",
            title: "Compromisos del periodo",
            value: money(periodCommitments),
            note: "OC / contratos / reservas",
            tone: "blue",
        },
        {
            key: "period_revenues",
            title: "Ingresos del periodo",
            value: money(periodRevenues),
            note: "Ventas / pagos / abonos",
            tone: "emerald",
        },
        {
            key: "period_margin",
            title: "Margen estimado",
            value: money(periodMargin),
            note: `Ingresos ${money(periodRevenues)} · Costos ${money(periodCosts)} · Compromisos ${money(periodCommitments)}`,
            tone: periodMargin >= 0 ? "emerald" : "rose",
        },
        {
            key: "period_roi",
            title: "ROI estimado",
            value: `${periodRoi.toFixed(1)}%`,
            note: "Retorno sobre inversión del periodo",
            tone: periodRoi >= 0 ? "emerald" : "rose",
        },
    ];

    return {
        ok: true as const,
        range,
        from: start,
        to: end,

        kpis,
        worklist,
        alerts,

        activeProjectsProgress,
        trend,

        meta: {
            periodCosts,
            periodCommitments,
            periodRevenues,
            periodMargin,
            periodRoi,
            overdueTasksCount,
            riskyCount,
            budgetsDraftCount,
            costsNotApproved,
        },
    };
}