"use server";

import { prisma } from "@/lib/prisma";
import { requireTenantId } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export async function deleteProjectExpenseItemAction(
    projectId: string,
    expenseId: string,
    itemId: string
) {
    try {
        const tenantId = await requireTenantId();

        const expense = await prisma.projectExpense.findFirst({
            where: { id: expenseId, tenantId, projectId },
            select: { id: true, status: true },
        });

        if (!expense) {
            return { ok: false as const, message: "Gasto no encontrado." };
        }

        if (expense.status === "POSTED" || expense.status === "CANCELLED") {
            return {
                ok: false as const,
                message: "No puedes eliminar ítems de un gasto ya cerrado.",
            };
        }

        const item = await prisma.projectExpenseItem.findFirst({
            where: { id: itemId, tenantId, expenseId },
            select: { id: true, description: true },
        });

        if (!item) {
            return { ok: false as const, message: "Ítem no encontrado." };
        }

        await prisma.$transaction(async (tx) => {
            await tx.projectExpenseAllocation.deleteMany({
                where: {
                    tenantId,
                    expenseId,
                    expenseItemId: itemId,
                },
            });

            await tx.projectExpenseItem.delete({
                where: { id: itemId },
            });
        });

        revalidatePath(`/projects/${projectId}/expenses/${expenseId}`);
        revalidatePath(`/projects/${projectId}/budget`);

        return {
            ok: true as const,
            message: "Ítem eliminado.",
        };
    } catch (error) {
        console.error("deleteProjectExpenseItemAction", error);
        return { ok: false as const, message: "No fue posible eliminar el ítem." };
    }
}