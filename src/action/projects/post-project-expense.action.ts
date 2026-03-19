"use server";

import { prisma } from "@/lib/prisma";
import { requireTenantId } from "@/lib/auth/session";
import { postProjectExpenseSchema } from "@/lib/zod/projects/budgets/project-expense.schema";
import { ProjectExpenseStatus } from "../../../generated/prisma/enums";
import { revalidatePath } from "next/cache";

export async function postProjectExpenseAction(projectId: string, expenseId: string) {
    try {
        const tenantId = await requireTenantId();

        const parsed = postProjectExpenseSchema.safeParse({ expenseId });
        if (!parsed.success) {
            return { ok: false as const, message: "Gasto inválido." };
        }

        const expense = await prisma.projectExpense.findFirst({
            where: { id: expenseId, tenantId, projectId },
            include: {
                items: {
                    include: {
                        allocations: true,
                    },
                },
            },
        });

        if (!expense) {
            return { ok: false as const, message: "Gasto no encontrado." };
        }

        if (expense.status === ProjectExpenseStatus.POSTED) {
            return { ok: false as const, message: "El gasto ya fue confirmado." };
        }

        if (expense.status === ProjectExpenseStatus.CANCELLED) {
            return { ok: false as const, message: "No puedes confirmar un gasto cancelado." };
        }

        if (expense.items.length === 0) {
            return { ok: false as const, message: "Debes agregar al menos un ítem." };
        }

        const itemsTotal = expense.items.reduce((acc, item) => acc + Number(item.lineAmount), 0);
        const expenseTotal = Number(expense.totalAmount);

        if (Number(itemsTotal.toFixed(2)) !== Number(expenseTotal.toFixed(2))) {
            return {
                ok: false as const,
                message: "La suma de los ítems debe ser igual al total del gasto.",
            };
        }

        for (const item of expense.items) {
            const allocated = item.allocations.reduce((acc, a) => acc + Number(a.amount), 0);
            const lineAmount = Number(item.lineAmount);

            if (Number(allocated.toFixed(2)) !== Number(lineAmount.toFixed(2))) {
                return {
                    ok: false as const,
                    message: `El ítem "${item.description}" no está completamente asignado.`,
                };
            }
        }

        await prisma.projectExpense.update({
            where: { id: expenseId },
            data: {
                status: ProjectExpenseStatus.POSTED,
                isApproved: true,
            },
        });

        revalidatePath(`/projects/${projectId}/expenses/${expenseId}`);
        revalidatePath(`/projects/${projectId}/expenses`);
        revalidatePath(`/projects/${projectId}/budget`);

        return {
            ok: true as const,
            message: "Gasto confirmado.",
        };
    } catch (error) {
        console.error("postProjectExpenseAction", error);
        return { ok: false as const, message: "No fue posible confirmar el gasto." };
    }
}