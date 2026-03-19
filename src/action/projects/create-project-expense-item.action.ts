"use server";

import { prisma } from "@/lib/prisma";
import { requireTenantId } from "@/lib/auth/session";
import { createProjectExpenseItemSchema } from "@/lib/zod/projects/budgets/project-expense.schema";
import { revalidatePath } from "next/cache";

export async function createProjectExpenseItemAction(
    projectId: string,
    expenseId: string,
    formData: FormData
) {
    try {
        const tenantId = await requireTenantId();

        const parsed = createProjectExpenseItemSchema.safeParse({
            description: formData.get("description")?.toString(),
            quantity: formData.get("quantity")?.toString(),
            unitPrice: formData.get("unitPrice")?.toString(),
            lineAmount: formData.get("lineAmount")?.toString(),
            category: formData.get("category")?.toString(),
            rawExtractedText: formData.get("rawExtractedText")?.toString(),
        });

        if (!parsed.success) {
            return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
        }

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

        const last = await prisma.projectExpenseItem.findFirst({
            where: { tenantId, expenseId },
            orderBy: { lineNo: "desc" },
            select: { lineNo: true },
        });

        const nextLineNo = (last?.lineNo ?? 0) + 1;
        const data = parsed.data;

        const item = await prisma.projectExpenseItem.create({
            data: {
                tenantId,
                expenseId,
                lineNo: nextLineNo,
                description: data.description,
                quantity: data.quantity ? String(data.quantity) : null,
                unitPrice: data.unitPrice ? String(data.unitPrice) : null,
                lineAmount: String(data.lineAmount),
                category: data.category ?? null,
                rawExtractedText: data.rawExtractedText ?? null,
            },
            select: {
                id: true,
                lineNo: true,
                description: true,
                lineAmount: true,
            },
        });

        revalidatePath(`/projects/${projectId}/expenses/${expenseId}`);
        revalidatePath(`/projects/${projectId}/budget`);

        return {
            ok: true as const,
            message: "Ítem creado.",
            item: {...item, lineAmount: Number(item.lineAmount)},
        };
    } catch (error) {
        console.error("createProjectExpenseItemAction", error);
        return { ok: false as const, message: "No fue posible crear el ítem." };
    }
}