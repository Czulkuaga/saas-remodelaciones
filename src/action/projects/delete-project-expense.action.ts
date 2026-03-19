"use server";

import { prisma } from "@/lib/prisma";
import { requireTenantId } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export async function deleteProjectExpenseAction(
    projectId: string,
    expenseId: string
) {
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
                docNo: true,
            },
        });

        if (!expense) {
            return { ok: false as const, message: "Gasto no encontrado." };
        }

        if (expense.status === "POSTED") {
            return {
                ok: false as const,
                message: "No puedes eliminar un gasto ya confirmado.",
            };
        }

        if (expense.status === "CANCELLED") {
            return {
                ok: false as const,
                message: "No puedes eliminar un gasto cancelado.",
            };
        }

        await prisma.projectExpense.delete({
            where: { id: expense.id },
        });

        revalidatePath(`/projects/${projectId}/budget`);
        revalidatePath(`/projects/${projectId}/expenses`);
        revalidatePath(`/projects/${projectId}/expenses/${expenseId}`);
        revalidatePath(`/projects/${projectId}`);

        return {
            ok: true as const,
            message: "Gasto eliminado.",
        };
    } catch (error) {
        console.error("deleteProjectExpenseAction", error);
        return {
            ok: false as const,
            message: "No fue posible eliminar el gasto.",
        };
    }
}