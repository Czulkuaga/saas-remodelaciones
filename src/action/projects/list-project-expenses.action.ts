"use server";

import { prisma } from "@/lib/prisma";
import { requireTenantId } from "@/lib/auth/session";
import { ProjectExpenseStatus } from "../../../generated/prisma/enums";

function toNumber(v: any): number {
    if (v == null) return 0;
    if (typeof v === "object" && typeof v.toNumber === "function") return v.toNumber();
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}

function normalizeString(v: FormDataEntryValue | string | null | undefined) {
    return String(v ?? "").trim();
}

function parseDateStart(value: string) {
    if (!value) return undefined;
    const d = new Date(`${value}T00:00:00.000Z`);
    return Number.isFinite(d.getTime()) ? d : undefined;
}

function parseDateEnd(value: string) {
    if (!value) return undefined;
    const d = new Date(`${value}T23:59:59.999Z`);
    return Number.isFinite(d.getTime()) ? d : undefined;
}

export type ProjectExpenseListFilters = {
    q?: string;
    status?: ProjectExpenseStatus | "";
    partnerId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
};

export type ProjectExpenseListRow = {
    id: string;
    status: ProjectExpenseStatus;
    partnerId: string | null;
    partnerName: string | null;
    docType: string | null;
    docNo: string | null;
    docDate: string | null;
    occurredAt: string | null;
    currencyCode: string;
    totalAmount: number;
    itemsCount: number;
    allocatedAmount: number;
    pendingAmount: number;
    isApproved: boolean;
    paidAt: string | null;
    createdAt: string;
    updatedAt: string;
};

export type ListProjectExpensesResult =
    | {
        ok: true;
        filters: {
            q: string;
            status: ProjectExpenseStatus | "";
            partnerId: string;
            dateFrom: string;
            dateTo: string;
            page: number;
            pageSize: number;
        };
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
        rows: ProjectExpenseListRow[];
    }
    | {
        ok: false;
        message: string;
    };

export async function listProjectExpensesAction(
    projectId: string,
    filters?: ProjectExpenseListFilters
): Promise<ListProjectExpensesResult> {
    try {
        const tenantId = await requireTenantId();

        const q = normalizeString(filters?.q);
        const status = (filters?.status ?? "") as ProjectExpenseStatus | "";
        const partnerId = normalizeString(filters?.partnerId);
        const dateFrom = normalizeString(filters?.dateFrom);
        const dateTo = normalizeString(filters?.dateTo);

        const page = Math.max(1, Number(filters?.page ?? 1) || 1);
        const pageSizeRaw = Math.max(1, Number(filters?.pageSize ?? 20) || 20);
        const pageSize = Math.min(pageSizeRaw, 100);

        const occurredAtGte = parseDateStart(dateFrom);
        const occurredAtLte = parseDateEnd(dateTo);

        const where: any = {
            tenantId,
            projectId,
        };

        if (status) {
            where.status = status;
        }

        if (partnerId) {
            where.partnerId = partnerId;
        }

        if (occurredAtGte || occurredAtLte) {
            where.occurredAt = {};
            if (occurredAtGte) where.occurredAt.gte = occurredAtGte;
            if (occurredAtLte) where.occurredAt.lte = occurredAtLte;
        }

        if (q) {
            where.OR = [
                { docNo: { contains: q, mode: "insensitive" } },
                { notes: { contains: q, mode: "insensitive" } },
                { sourceFileName: { contains: q, mode: "insensitive" } },
                { partner: { organizationName: { contains: q, mode: "insensitive" } } },
                { partner: { firstName: { contains: q, mode: "insensitive" } } },
                { partner: { lastName: { contains: q, mode: "insensitive" } } },
                { items: { some: { description: { contains: q, mode: "insensitive" } } } },
            ];
        }

        const [total, rowsRaw] = await Promise.all([
            prisma.projectExpense.count({ where }),
            prisma.projectExpense.findMany({
                where,
                orderBy: [{ occurredAt: "desc" }, { docDate: "desc" }, { createdAt: "desc" }],
                skip: (page - 1) * pageSize,
                take: pageSize,
                select: {
                    id: true,
                    status: true,
                    partnerId: true,
                    docType: true,
                    docNo: true,
                    docDate: true,
                    occurredAt: true,
                    currencyCode: true,
                    totalAmount: true,
                    isApproved: true,
                    paidAt: true,
                    createdAt: true,
                    updatedAt: true,
                    notes: true,
                    partner: {
                        select: {
                            organizationName: true,
                            firstName: true,
                            lastName: true,
                            code: true,
                        },
                    },
                    items: {
                        select: {
                            id: true,
                            lineAmount: true,
                            allocations: {
                                select: {
                                    amount: true,
                                },
                            },
                        },
                    },
                },
            }),
        ]);

        const rows: ProjectExpenseListRow[] = rowsRaw.map((row) => {
            const partnerName =
                row.partner?.organizationName?.trim() ||
                [row.partner?.firstName, row.partner?.lastName].filter(Boolean).join(" ").trim() ||
                row.partner?.code ||
                null;

            const itemsCount = row.items.length;
            const itemsTotal = row.items.reduce((acc, item) => acc + toNumber(item.lineAmount), 0);
            const allocatedAmount = row.items.reduce(
                (acc, item) => acc + item.allocations.reduce((a, x) => a + toNumber(x.amount), 0),
                0
            );

            const pendingAmount = Number((itemsTotal - allocatedAmount).toFixed(2));

            return {
                id: row.id,
                status: row.status,
                partnerId: row.partnerId ?? null,
                partnerName,
                docType: row.docType ?? null,
                docNo: row.docNo ?? null,
                docDate: row.docDate ? row.docDate.toISOString() : null,
                occurredAt: row.occurredAt ? row.occurredAt.toISOString() : null,
                currencyCode: row.currencyCode,
                totalAmount: toNumber(row.totalAmount),
                itemsCount,
                allocatedAmount: Number(allocatedAmount.toFixed(2)),
                pendingAmount,
                isApproved: row.isApproved,
                paidAt: row.paidAt ? row.paidAt.toISOString() : null,
                createdAt: row.createdAt.toISOString(),
                updatedAt: row.updatedAt.toISOString(),
            };
        });

        return {
            ok: true,
            filters: {
                q,
                status,
                partnerId,
                dateFrom,
                dateTo,
                page,
                pageSize,
            },
            pagination: {
                page,
                pageSize,
                total,
                totalPages: Math.max(1, Math.ceil(total / pageSize)),
            },
            rows,
        };
    } catch (error) {
        console.error("listProjectExpensesAction", error);
        return {
            ok: false,
            message: "No fue posible consultar los gastos del proyecto.",
        };
    }
}