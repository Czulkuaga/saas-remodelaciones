"use server";

import { prisma } from "@/lib/prisma";
import { requireTenantId } from "@/lib/auth/session";

export async function getProjectBudgetSummaryAction(projectId: string) {
    const tenantId = await requireTenantId();

    const [quotes, changeOrders, expenses, payments] = await Promise.all([
        prisma.quote.findMany({
            where: { tenantId, projectId },
            orderBy: [{ createdAt: "desc" }],
            select: { id: true, code: true, status: true, total: true, currencyCode: true, createdAt: true },
        }),
        prisma.changeOrder.findMany({
            where: { tenantId, projectId, status: { in: ["APPROVED", "IMPLEMENTED"] } },
            orderBy: [{ createdAt: "desc" }],
            select: { id: true, code: true, title: true, status: true, estimatedCost: true, currencyCode: true, createdAt: true },
        }),
        prisma.expense.findMany({
            where: { tenantId, projectId, status: "CONFIRMED" },
            select: { id: true, amount: true, currencyCode: true },
        }),
        prisma.payment.findMany({
            where: { tenantId, projectId },
            select: { id: true, amount: true, currencyCode: true, paidAt: true },
        }),
    ]);

    // MVP: asume 1 moneda principal = moneda del quote más reciente, o del tenant default (si quieres luego)
    const base = quotes[0] ?? null;
    const currency = base?.currencyCode ?? changeOrders[0]?.currencyCode ?? expenses[0]?.currencyCode ?? payments[0]?.currencyCode ?? null;

    const sum = (arr: Array<{ currencyCode: string; amount?: any; total?: any; estimatedCost?: any }>, field: "amount" | "total" | "estimatedCost") =>
        arr
            .filter((x) => !currency || x.currencyCode === currency)
            .reduce((acc, x) => acc + Number(x[field] ?? 0), 0);

    const baseTotal = base && (!currency || base.currencyCode === currency) ? Number(base.total) : 0;
    const changesTotal = sum(changeOrders as any, "estimatedCost");
    const expensesTotal = sum(expenses as any, "amount");
    const paymentsTotal = sum(payments as any, "amount");

    const revisedBudget = baseTotal + changesTotal;
    const balance = revisedBudget - expensesTotal;
    const paidBalance = revisedBudget - paymentsTotal;

    return {
        currency,
        baseQuote: base,
        quotes,
        changeOrders,
        baseTotal,
        changesTotal,
        revisedBudget,
        expensesTotal,
        paymentsTotal,
        balanceVsExpenses: balance,
        balanceVsPayments: paidBalance,
    };
}