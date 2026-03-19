"use server";

import { prisma } from "@/lib/prisma";
import { requireTenantId } from "@/lib/auth/session";
import { BudgetStatus, ProjectExpenseStatus } from "../../../generated/prisma/enums";

function toNumber(v: any): number {
    if (v == null) return 0;
    if (typeof v === "object" && typeof v.toNumber === "function") return v.toNumber();
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}

type ExpenseAllocationRow = {
    id: string;
    budgetLineId: string;
    budgetLineCode: string;
    budgetLineTitle: string;
    amount: number;
    notes: string | null;
};

type ExpenseItemRow = {
    id: string;
    lineNo: number;
    description: string;
    quantity: number | null;
    unitPrice: number | null;
    lineAmount: number;
    category: string | null;
    rawExtractedText: string | null;
    allocations: ExpenseAllocationRow[];
    allocatedAmount: number;
    pendingAmount: number;
};

export type ProjectExpenseDetailResult =
    | {
        ok: true;
        expense: {
            id: string;
            status: ProjectExpenseStatus;
            partnerId: string | null;
            partnerName: string | null;
            userId: string | null;
            docType: string | null;
            docNo: string | null;
            docDate: string | null;
            occurredAt: string | null;
            notes: string | null;
            sourceFileUrl: string | null;
            sourceFileName: string | null;
            ocrStatus: string | null;
            ocrRawText: string | null;
            ocrStructuredJson: unknown | null;
            currencyCode: string;
            subtotalAmount: number | null;
            taxAmount: number | null;
            totalAmount: number;
            isApproved: boolean;
            paidAt: string | null;
            createdAt: string;
            updatedAt: string;
        };
        items: ExpenseItemRow[];
        budgetLines: Array<{
            id: string;
            code: string;
            title: string;
            category: string;
        }>;
        totals: {
            expenseTotal: number;
            itemsTotal: number;
            allocatedTotal: number;
            expenseVsItemsDiff: number;
            itemsVsAllocationsDiff: number;
        };
        activeBudget: {
            id: string;
            version: number;
            status: BudgetStatus;
        } | null;
    }
    | {
        ok: false;
        message: string;
    };

export async function getProjectExpenseDetailAction(
    projectId: string,
    expenseId: string
): Promise<ProjectExpenseDetailResult> {
    try {
        const tenantId = await requireTenantId();

        const expense = await prisma.projectExpense.findFirst({
            where: {
                id: expenseId,
                tenantId,
                projectId,
            },
            select: {
                id: true,
                status: true,
                partnerId: true,
                userId: true,
                docType: true,
                docNo: true,
                docDate: true,
                occurredAt: true,
                notes: true,
                sourceFileUrl: true,
                sourceFileName: true,
                ocrStatus: true,
                ocrRawText: true,
                ocrStructuredJson: true,
                currencyCode: true,
                subtotalAmount: true,
                taxAmount: true,
                totalAmount: true,
                isApproved: true,
                paidAt: true,
                createdAt: true,
                updatedAt: true,
                partner: {
                    select: {
                        id: true,
                        organizationName: true,
                        firstName: true,
                        lastName: true,
                        code: true,
                    },
                },
                items: {
                    orderBy: [{ lineNo: "asc" }],
                    select: {
                        id: true,
                        lineNo: true,
                        description: true,
                        quantity: true,
                        unitPrice: true,
                        lineAmount: true,
                        category: true,
                        rawExtractedText: true,
                        allocations: {
                            orderBy: [{ createdAt: "asc" }],
                            select: {
                                id: true,
                                budgetLineId: true,
                                amount: true,
                                notes: true,
                                budgetLine: {
                                    select: {
                                        code: true,
                                        title: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!expense) {
            return { ok: false, message: "Gasto no encontrado." };
        }

        const activeBudget = await prisma.projectBudget.findFirst({
            where: {
                tenantId,
                projectId,
                status: BudgetStatus.APPROVED,
            },
            orderBy: [{ version: "desc" }],
            select: {
                id: true,
                version: true,
                status: true,
            },
        });

        const budgetLines = activeBudget
            ? await prisma.projectBudgetLine.findMany({
                where: {
                    tenantId,
                    budgetId: activeBudget.id,
                    parentId: { not: null },
                },
                orderBy: [{ code: "asc" }],
                select: {
                    id: true,
                    code: true,
                    title: true,
                    category: true,
                },
            })
            : [];

        const partnerName =
            expense.partner?.organizationName?.trim() ||
            [expense.partner?.firstName, expense.partner?.lastName].filter(Boolean).join(" ").trim() ||
            expense.partner?.code ||
            null;

        const items: ExpenseItemRow[] = expense.items.map((item) => {
            const allocations: ExpenseAllocationRow[] = item.allocations.map((a) => ({
                id: a.id,
                budgetLineId: a.budgetLineId,
                budgetLineCode: a.budgetLine?.code ?? "—",
                budgetLineTitle: a.budgetLine?.title ?? "—",
                amount: toNumber(a.amount),
                notes: a.notes ?? null,
            }));

            const lineAmount = toNumber(item.lineAmount);
            const allocatedAmount = allocations.reduce((acc, x) => acc + x.amount, 0);
            const pendingAmount = Number((lineAmount - allocatedAmount).toFixed(2));

            return {
                id: item.id,
                lineNo: item.lineNo,
                description: item.description,
                quantity: item.quantity != null ? toNumber(item.quantity) : null,
                unitPrice: item.unitPrice != null ? toNumber(item.unitPrice) : null,
                lineAmount,
                category: item.category ?? null,
                rawExtractedText: item.rawExtractedText ?? null,
                allocations,
                allocatedAmount,
                pendingAmount,
            };
        });

        const expenseTotal = toNumber(expense.totalAmount);
        const itemsTotal = items.reduce((acc, x) => acc + x.lineAmount, 0);
        const allocatedTotal = items.reduce((acc, x) => acc + x.allocatedAmount, 0);

        const expenseVsItemsDiff = Number((expenseTotal - itemsTotal).toFixed(2));
        const itemsVsAllocationsDiff = Number((itemsTotal - allocatedTotal).toFixed(2));

        return {
            ok: true,
            expense: {
                id: expense.id,
                status: expense.status,
                partnerId: expense.partnerId ?? null,
                partnerName,
                userId: expense.userId ?? null,
                docType: expense.docType ?? null,
                docNo: expense.docNo ?? null,
                docDate: expense.docDate ? expense.docDate.toISOString() : null,
                occurredAt: expense.occurredAt ? expense.occurredAt.toISOString() : null,
                notes: expense.notes ?? null,
                sourceFileUrl: expense.sourceFileUrl ?? null,
                sourceFileName: expense.sourceFileName ?? null,
                ocrStatus: expense.ocrStatus ?? null,
                ocrRawText: expense.ocrRawText ?? null,
                ocrStructuredJson: expense.ocrStructuredJson ?? null,
                currencyCode: expense.currencyCode,
                subtotalAmount: expense.subtotalAmount != null ? toNumber(expense.subtotalAmount) : null,
                taxAmount: expense.taxAmount != null ? toNumber(expense.taxAmount) : null,
                totalAmount: expenseTotal,
                isApproved: expense.isApproved,
                paidAt: expense.paidAt ? expense.paidAt.toISOString() : null,
                createdAt: expense.createdAt.toISOString(),
                updatedAt: expense.updatedAt.toISOString(),
            },
            items,
            budgetLines: budgetLines.map((l) => ({
                id: l.id,
                code: l.code,
                title: l.title,
                category: l.category,
            })),
            totals: {
                expenseTotal,
                itemsTotal: Number(itemsTotal.toFixed(2)),
                allocatedTotal: Number(allocatedTotal.toFixed(2)),
                expenseVsItemsDiff,
                itemsVsAllocationsDiff,
            },
            activeBudget,
        };
    } catch (error) {
        console.error("getProjectExpenseDetailAction", error);
        return { ok: false, message: "No fue posible consultar el detalle del gasto." };
    }
}