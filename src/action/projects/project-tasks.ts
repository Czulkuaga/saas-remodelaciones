"use server";

import { prisma } from "@/lib/prisma";
import { requireTenantId } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { NumberRangeObject } from "../../../generated/prisma/enums";

async function nextTaskCode() {
    const tenantId = await requireTenantId();

    const nr = await prisma.numberRange.findUnique({
        where: { tenantId_object: { tenantId, object: NumberRangeObject.TASK } },
        select: { id: true, nextNo: true, padding: true, prefix: true },
    });
    if (!nr) throw new Error("NumberRange missing for TASK");

    const seq = String(nr.nextNo).padStart(nr.padding, "0");
    const prefix = nr.prefix ? `${nr.prefix}-` : "";
    const code = `${prefix}${seq}`;

    await prisma.numberRange.update({ where: { id: nr.id }, data: { nextNo: nr.nextNo + 1 } });
    return code;
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
            weight: true,
            assigneePartner: { select: { id: true, code: true, organizationName: true, firstName: true, lastName: true } },
            assigneeUser: { select: { id: true, email: true } },
            updatedAt: true,
        },
    });
}

export async function createTaskAction(projectId: string, formData: FormData) {
    const tenantId = await requireTenantId();

    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim() || null;
    const status = String(formData.get("status") ?? "TODO");
    const dueDateStr = String(formData.get("dueDate") ?? "");
    const dueDate = dueDateStr ? new Date(dueDateStr) : null;

    const assigneePartnerId = String(formData.get("assigneePartnerId") ?? "") || null;

    if (!title) return { ok: false as const, message: "Título requerido." };

    const code = await nextTaskCode();

    const task = await prisma.remodelingTask.create({
        data: {
            tenantId,
            projectId,
            code,
            title,
            description,
            status: status as any,
            dueDate,
            assigneePartnerId,
        },
        select: { id: true },
    });

    await prisma.timelineEvent.create({
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

    revalidatePath(`/projects/${projectId}/tasks`);
    revalidatePath(`/projects/${projectId}`);
    return { ok: true as const };
}

export async function setTaskStatusAction(taskId: string, status: string) {
    const tenantId = await requireTenantId();

    const t = await prisma.remodelingTask.findFirst({ where: { id: taskId, tenantId }, select: { projectId: true, title: true } });
    if (!t) return { ok: false as const, message: "Task not found." };

    await prisma.remodelingTask.update({
        where: { id: taskId },
        data: { status: status as any },
    });

    await prisma.timelineEvent.create({
        data: {
            tenantId,
            projectId: t.projectId,
            taskId,
            type: "TASK_STATUS_CHANGED",
            title: "Estado de tarea actualizado",
            description: `${t.title} → ${status}`,
            senderKind: "SYSTEM",
        },
    });

    revalidatePath(`/projects/${t.projectId}/tasks`);
    revalidatePath(`/projects/${t.projectId}`);
    return { ok: true as const };
}