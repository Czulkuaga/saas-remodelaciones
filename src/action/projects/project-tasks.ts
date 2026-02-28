"use server";

import { prisma } from "@/lib/prisma";
import { requireTenantId } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import {
    NumberRangeObject,
    TaskStatus,
    TaskPriority,
    TaskCategory,
} from "../../../generated/prisma/enums";
import { nextNumberRangeCode } from "@/lib/number-range";

function parseEnum<T extends Record<string, string>>(enumObj: T, value: unknown, fallback?: T[keyof T]) {
    const v = typeof value === "string" ? value : "";
    const values = Object.values(enumObj);
    if (values.includes(v as T[keyof T])) return v as T[keyof T];
    if (fallback) return fallback;
    throw new Error(`Invalid enum value: ${v}`);
}

function parseWeight(value: unknown) {
    const n = typeof value === "string" ? Number(value) : NaN;
    const w = Number.isFinite(n) ? Math.trunc(n) : 1;
    // pesos estilo story points
    const allowed = new Set([1, 2, 3, 5, 8]);
    return allowed.has(w) ? w : 1;
}

export async function listProjectTasksAction(projectId: string) {
    const tenantId = await requireTenantId();

    return prisma.remodelingTask.findMany({
        where: { tenantId, projectId },
        orderBy: [{ updatedAt: "desc" }],
        select: {
            id: true,
            code: true,
            title: true,
            description: true,
            status: true,
            dueDate: true,

            // ✅ nuevos campos
            priority: true,
            category: true,
            weight: true,

            assigneePartner: {
                select: { id: true, code: true, organizationName: true, firstName: true, lastName: true },
            },
            assigneeUser: { select: { id: true, email: true } },
            updatedAt: true,
        },
    });
}

export async function createTaskAction(projectId: string, formData: FormData) {
    const tenantId = await requireTenantId();

    const title = String(formData.get("title") ?? "").trim();
    const descriptionRaw = String(formData.get("description") ?? "").trim();
    const description = descriptionRaw ? descriptionRaw : null;

    if (!title) return { ok: false as const, message: "Título requerido." };

    const status = parseEnum(TaskStatus, formData.get("status"), TaskStatus.TODO);
    const priority = parseEnum(TaskPriority, formData.get("priority"), TaskPriority.MEDIUM);
    const category = parseEnum(TaskCategory, formData.get("category"), TaskCategory.GENERAL);
    const weight = parseWeight(formData.get("weight"));

    const dueDateStr = String(formData.get("dueDate") ?? "").trim();
    const dueDate = dueDateStr ? new Date(dueDateStr) : null;

    const assigneePartnerIdRaw = String(formData.get("assigneePartnerId") ?? "").trim();
    const assigneePartnerId = assigneePartnerIdRaw ? assigneePartnerIdRaw : null;

    // ✅ si asignan BP, intentamos mapear user del tenant (membership.partnerId)
    const assigneeUserId = assigneePartnerId
        ? (
            await prisma.tenantMembership.findFirst({
                where: { tenantId, partnerId: assigneePartnerId },
                select: { userId: true },
            })
        )?.userId ?? null
        : null;

    const code = await nextNumberRangeCode({
        tenantId,
        object: NumberRangeObject.TASK,
        defaultPrefix: "TK-",     // o "TASK-" o lo que quieras
        defaultPadding: 8,
        defaultNextNo: 1,
    });

    const created = await prisma.$transaction(async (tx) => {
        const task = await tx.remodelingTask.create({
            data: {
                tenantId,
                projectId,
                code,
                title,
                description,
                status,
                priority,
                category,
                weight,
                dueDate,
                assigneePartnerId,
                assigneeUserId,
            },
            select: {
                id: true,
                code: true,
                title: true,
                description: true,
                status: true,
                priority: true,
                category: true,
                weight: true,
                dueDate: true,
                updatedAt: true,
                assigneePartner: { select: { id: true, code: true, organizationName: true, firstName: true, lastName: true } },
                assigneeUser: { select: { id: true, email: true } },
            },
        });

        await tx.timelineEvent.create({
            data: {
                tenantId,
                projectId,
                taskId: task.id,
                type: "TASK_CREATED",
                title: "Tarea creada",
                description: `${code} — ${title}`,
                senderKind: "SYSTEM",
            },
        });

        return task;
    });

    revalidatePath(`/projects/${projectId}/tasks`);
    revalidatePath(`/projects/${projectId}`);

    return { ok: true as const, task: created };
}

export async function setTaskStatusAction(taskId: string, status: TaskStatus) {
    const tenantId = await requireTenantId();

    const t = await prisma.remodelingTask.findFirst({
        where: { id: taskId, tenantId },
        select: { projectId: true, title: true, status: true, code: true },
    });
    if (!t) return { ok: false as const, message: "Task not found." };

    // (opcional) no hagas write si no cambió
    if (t.status === status) return { ok: true as const };

    if (t.status === TaskStatus.BLOCKED && status === TaskStatus.DONE) {
        return {
            ok: false as const,
            message: "No puedes cerrar una tarea bloqueada.",
        };
    }

    await prisma.remodelingTask.update({
        where: { id: taskId },
        data: { status },
    });

    await prisma.timelineEvent.create({
        data: {
            tenantId,
            projectId: t.projectId,
            taskId,
            type: "TASK_STATUS_CHANGED",
            title: "Estado de tarea actualizado",
            description: `${t.code ?? ""} — ${t.title} → ${status}`,
            senderKind: "SYSTEM",
        },
    });

    revalidatePath(`/projects/${t.projectId}/tasks`);
    revalidatePath(`/projects/${t.projectId}`);

    return { ok: true as const };
}