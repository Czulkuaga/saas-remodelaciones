"use server";

import { prisma } from "@/lib/prisma";
import { requireTenantId } from "@/lib/auth/session";
import { requireUserId } from "@/lib/auth/session";
import { createProjectExpenseSchema } from "@/lib/zod/projects/budgets/project-expense.schema";
import { ProjectExpenseStatus } from "../../../generated/prisma/enums";
import { revalidatePath } from "next/cache";

function toNullableDate(v?: string) {
    return v ? new Date(v) : null;
}

function toPrismaDecimalString(v?: string) {
    return v == null || v === "" ? undefined : String(v);
}

export async function createProjectExpenseAction(projectId: string, formData: FormData) {
    try {
        const tenantId = await requireTenantId();
        const userId = await requireUserId();

        const parsed = createProjectExpenseSchema.safeParse({
            partnerId: formData.get("partnerId")?.toString(),
            userId: formData.get("userId")?.toString(),
            docType: formData.get("docType")?.toString(),
            docNo: formData.get("docNo")?.toString(),
            docDate: formData.get("docDate")?.toString(),
            occurredAt: formData.get("occurredAt")?.toString(),
            notes: formData.get("notes")?.toString(),
            currencyCode: formData.get("currencyCode")?.toString(),
            subtotalAmount: formData.get("subtotalAmount")?.toString(),
            taxAmount: formData.get("taxAmount")?.toString(),
            totalAmount: formData.get("totalAmount")?.toString(),
        });

        if (!parsed.success) {
            return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
        }

        // BP del proyecto
        const projectPartner = await prisma.remodelingProjectPartner.findFirst({
            where: {
                projectId:projectId,
                partnerId:parsed.data.partnerId,
            },
        });

        if (!projectPartner) {
            return { ok: false, message: "Partner no pertenece al proyecto." };
        }

        if (projectPartner.role === "CLIENT") {
            return { ok: false, message: "No puedes usar un cliente como gasto." };
        }

        const data = parsed.data;

        const project = await prisma.remodelingProject.findFirst({
            where: { id: projectId, tenantId },
            select: { id: true },
        });

        if (!project) {
            return { ok: false as const, message: "Proyecto no encontrado." };
        }

        const expense = await prisma.projectExpense.create({
            data: {
                tenantId,
                projectId,
                status: ProjectExpenseStatus.DRAFT,
                partnerId: data.partnerId ?? null,
                userId: data.userId ?? userId,
                docType: data.docType ?? null,
                docNo: data.docNo ?? null,
                docDate: toNullableDate(data.docDate) ?? undefined,
                occurredAt: toNullableDate(data.occurredAt) ?? undefined,
                notes: data.notes ?? null,
                currencyCode: data.currencyCode,
                subtotalAmount: toPrismaDecimalString(data.subtotalAmount),
                taxAmount: toPrismaDecimalString(data.taxAmount),
                totalAmount: String(data.totalAmount),
            },
            select: {
                id: true,
                totalAmount: true,
                status: true,
            },
        });

        revalidatePath(`/projects/${projectId}/budget`);
        revalidatePath(`/projects/${projectId}/expenses`);

        return {
            ok: true as const,
            message: "Gasto creado.",
            expense:{...expense, totalAmount: Number(expense.totalAmount)},
        };
    } catch (error) {
        console.error("createProjectExpenseAction", error);
        return { ok: false as const, message: "No fue posible crear el gasto." };
    }
}