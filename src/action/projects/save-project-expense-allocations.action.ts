"use server";

import { prisma } from "@/lib/prisma";
import { requireTenantId } from "@/lib/auth/session";
import { saveProjectExpenseAllocationsSchema } from "@/lib/zod/projects/budgets/project-expense.schema";
import { revalidatePath } from "next/cache";

export async function saveProjectExpenseAllocationsAction(
    projectId: string,
    expenseId: string,
    input: {
        expenseItemId: string;
        allocations: Array<{
            budgetLineId: string;
            amount: string;
            notes?: string;
        }>;
    }
) {
    try {
        const tenantId = await requireTenantId();

        const parsed = saveProjectExpenseAllocationsSchema.safeParse(input);
        if (!parsed.success) {
            return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
        }

        const data = parsed.data;

        const expense = await prisma.projectExpense.findFirst({
            where: { id: expenseId, tenantId, projectId },
            select: { id: true, status: true },
        });

        if (!expense) {
            return { ok: false as const, message: "Gasto no encontrado." };
        }

        if (expense.status === "POSTED" || expense.status === "CANCELLED") {
            return { ok: false as const, message: "No puedes modificar un gasto ya cerrado." };
        }

        const item = await prisma.projectExpenseItem.findFirst({
            where: { id: data.expenseItemId, tenantId, expenseId },
            select: { id: true, lineAmount: true },
        });

        if (!item) {
            return { ok: false as const, message: "Ítem no encontrado." };
        }

        const budgetLines = await prisma.projectBudgetLine.findMany({
            where: {
                tenantId,
                id: { in: data.allocations.map((x) => x.budgetLineId) },
                budget: {
                    projectId,
                },
            },
            select: { id: true },
        });

        const validIds = new Set(budgetLines.map((x) => x.id));
        const invalid = data.allocations.find((x) => !validIds.has(x.budgetLineId));
        if (invalid) {
            return { ok: false as const, message: "Una de las líneas presupuestales no pertenece al proyecto." };
        }

        const sumAllocations = data.allocations.reduce((acc, x) => acc + Number(x.amount), 0);
        const itemAmount = Number(item.lineAmount);

        if (sumAllocations > itemAmount) {
            return { ok: false as const, message: "La suma de las asignaciones no puede superar el valor del ítem." };
        }

        await prisma.$transaction(async (tx) => {
            await tx.projectExpenseAllocation.deleteMany({
                where: {
                    tenantId,
                    expenseId,
                    expenseItemId: data.expenseItemId,
                },
            });

            await tx.projectExpenseAllocation.createMany({
                data: data.allocations.map((x) => ({
                    tenantId,
                    projectId,
                    expenseId,
                    expenseItemId: data.expenseItemId,
                    budgetLineId: x.budgetLineId,
                    amount: x.amount,
                    notes: x.notes ?? null,
                })),
            });
        });

        revalidatePath(`/projects/${projectId}/expenses/${expenseId}`);
        revalidatePath(`/projects/${projectId}/budget`);

        return {
            ok: true as const,
            message: "Asignaciones guardadas.",
        };
    } catch (error) {
        console.error("saveProjectExpenseAllocationsAction", error);
        return { ok: false as const, message: "No fue posible guardar las asignaciones." };
    }
}