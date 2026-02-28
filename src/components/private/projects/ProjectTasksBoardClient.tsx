"use client";

import { useMemo, useState, useTransition } from "react";
import { createTaskAction, setTaskStatusAction } from "@/action/projects/project-tasks";
import {
    BPRoleType,
    TaskStatus,
    TaskPriority,
    TaskCategory,
    PartnerType,
} from "../../../../generated/prisma/enums";

type Task = Awaited<
    ReturnType<typeof import("@/action/projects/project-tasks").listProjectTasksAction>
>[number];

type PartnerPick = {
    id: string;
    code: string;
    type: PartnerType;
    organizationName: string | null;
    firstName: string | null;
    lastName: string | null;
    roles: BPRoleType[];
};

const COLUMNS: { key: TaskStatus; label: string }[] = [
    { key: TaskStatus.TODO, label: "Por hacer" },
    { key: TaskStatus.IN_PROGRESS, label: "En progreso" },
    { key: TaskStatus.BLOCKED, label: "Bloqueadas" },
    { key: TaskStatus.DONE, label: "Hechas" },
];

const ROLE_FILTERS: { value: BPRoleType | "ALL"; label: string }[] = [
    { value: "ALL", label: "Todos" },
    { value: BPRoleType.CLIENT, label: "Cliente" },
    { value: BPRoleType.CONTRACTOR, label: "Contratista" },
    { value: BPRoleType.ARCHITECT, label: "Arquitecto" },
    { value: BPRoleType.ENGINEER, label: "Ingeniero" },
    { value: BPRoleType.SUPPLIER, label: "Proveedor" },
    { value: BPRoleType.STAFF, label: "Staff" },
    { value: BPRoleType.CONTACT, label: "Contacto" },
];

function partnerLabel(p: PartnerPick) {
    if (p.organizationName) return p.organizationName;
    const full = [p.firstName, p.lastName].filter(Boolean).join(" ");
    return full || p.code;
}

function formatDateCO(d: Date | string | null | undefined) {
    if (!d) return "—";
    const dt = typeof d === "string" ? new Date(d) : d;
    if (Number.isNaN(dt.getTime())) return "—";
    return dt.toLocaleDateString("es-CO");
}

function isOverdue(task: Task) {
    if (!task.dueDate) return false;
    if (task.status === TaskStatus.DONE || task.status === TaskStatus.CANCELLED)
        return false;

    return new Date(task.dueDate) < new Date();
}

export function ProjectTasksBoardClient({
    projectId,
    initialTasks,
    partners,
}: {
    projectId: string;
    initialTasks: Task[];
    partners: PartnerPick[];
}) {
    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const [pending, startTransition] = useTransition();

    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // UI filtros para el selector de BP
    const [bpRole, setBpRole] = useState<BPRoleType | "ALL">("ALL");
    // const [bpQ, setBpQ] = useState<string>("");

    const progress = useMemo(() => {
        const totalWeight = tasks.reduce((acc, t) => acc + t.weight, 0);
        const doneWeight = tasks
            .filter((t) => t.status === TaskStatus.DONE)
            .reduce((acc, t) => acc + t.weight, 0);

        if (totalWeight === 0) return 0;
        return Math.round((doneWeight / totalWeight) * 100);
    }, [tasks]);

    const filteredPartners = useMemo(() => {
        const q = null

        return partners.filter((p) => {
            const matchRole = bpRole === "ALL" ? true : p.roles?.includes(bpRole);
            if (!matchRole) return false;

            if (!q) return true;

            const hay = [
                p.code,
                p.organizationName ?? "",
                p.firstName ?? "",
                p.lastName ?? "",
                partnerLabel(p),
            ]
                .join(" ")
                .toLowerCase();

            return hay.includes(q);
        });
    }, [partners, bpRole]);

    const grouped = useMemo(() => {
        const m = new Map<TaskStatus, Task[]>();
        for (const c of COLUMNS) m.set(c.key, []);

        for (const t of tasks) {
            // Si llega un status raro por data vieja, lo mandamos a TODO
            const key = m.has(t.status) ? t.status : TaskStatus.TODO;
            m.get(key)!.push(t);
        }

        return m;
    }, [tasks]);

    return (
        <div className="space-y-6">
            {/* Create */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-fuchsia-500/60 dark:border-slate-700 shadow-sm p-5">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Crear tarea</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Rápido, estilo Kanban. Asigna por BP (y si ese BP tiene usuario, el backend lo asigna también).
                        </p>
                    </div>

                    {msg && (
                        <span
                            className={[
                                "text-xs font-semibold px-3 py-1 rounded-full border",
                                msg.type === "success"
                                    ? "text-emerald-200 bg-emerald-500/10 border-emerald-500/20"
                                    : "text-rose-200 bg-rose-500/10 border-rose-500/20",
                            ].join(" ")}
                        >
                            {msg.text}
                        </span>
                    )}
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-fuchsia-500/20 p-4 shadow-sm mt-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                            Progreso del proyecto
                        </span>
                        <span className="text-sm font-bold text-fuchsia-500">
                            {progress}%
                        </span>
                    </div>

                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-linear-to-r from-indigo-500 to-fuchsia-500 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                <form
                    className="mt-4 grid grid-cols-1 md:grid-cols-6 gap-3"
                    onSubmit={(e) => {
                        e.preventDefault();
                        setMsg(null);

                        const form = e.currentTarget as HTMLFormElement;
                        const fd = new FormData(form);

                        startTransition(async () => {
                            const res = await createTaskAction(projectId, fd);

                            if (!res.ok) {
                                setMsg({ type: "error", text: res.message });
                                return;
                            }

                            // ✅ usamos lo que devuelve el server (ya trae code, enums, relations)
                            setTasks((prev) => [res.task, ...prev]);

                            form.reset();
                            setMsg({ type: "success", text: "Tarea creada." });
                            setTimeout(() => setMsg(null), 1500);
                        });
                    }}
                >
                    {/* Title */}
                    <input
                        name="title"
                        required
                        placeholder="Título"
                        className="md:col-span-2 bg-slate-50 dark:bg-slate-900/40 border border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 outline-none"
                        title="Indique el nombre de la tarea"
                    />

                    {/* Status */}
                    <select
                        name="status"
                        defaultValue={TaskStatus.TODO}
                        className="bg-slate-50 dark:bg-slate-900/40 border border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 outline-none"
                        title="Indique el estado inicial de la tarea"
                    >
                        {COLUMNS.map((c) => (
                            <option key={c.key} value={c.key}>
                                {c.label}
                            </option>
                        ))}
                    </select>

                    {/* Priority */}
                    <select
                        name="priority"
                        defaultValue={TaskPriority.MEDIUM}
                        className="bg-slate-50 dark:bg-slate-900/40 border border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 outline-none"
                        title="Especifique la prioridad de la tarea"
                    >
                        <option value={TaskPriority.LOW}>Baja</option>
                        <option value={TaskPriority.MEDIUM}>Media</option>
                        <option value={TaskPriority.HIGH}>Alta</option>
                        <option value={TaskPriority.URGENT}>Urgente</option>
                    </select>

                    {/* Weight */}
                    <select
                        name="weight"
                        defaultValue="1"
                        className="bg-slate-50 dark:bg-slate-900/40 border border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 outline-none"
                        title="Peso: esfuerzo/impacto (1,2,3,5,8) para priorización y progreso"
                    >
                        <option value="1">Peso 1</option>
                        <option value="2">Peso 2</option>
                        <option value="3">Peso 3</option>
                        <option value="5">Peso 5</option>
                        <option value="8">Peso 8</option>
                    </select>

                    {/* Category */}
                    <select
                        name="category"
                        defaultValue={TaskCategory.GENERAL}
                        className="bg-slate-50 dark:bg-slate-900/40 border border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 outline-none"
                        title="Indique la categoría de la tarea"
                    >
                        <option value={TaskCategory.GENERAL}>General</option>
                        <option value={TaskCategory.PROCUREMENT}>Compras</option>
                        <option value={TaskCategory.CONSTRUCTION}>Construcción</option>
                        <option value={TaskCategory.ELECTRICAL}>Eléctrico</option>
                        <option value={TaskCategory.PLUMBING}>Hidráulico</option>
                        <option value={TaskCategory.FINISHING}>Acabados</option>
                        <option value={TaskCategory.ADMIN}>Administrativo</option>
                    </select>

                    {/* BP role filter */}
                    <select
                        value={bpRole}
                        onChange={(e) => setBpRole(e.target.value as BPRoleType | "ALL")}
                        className="bg-slate-50 dark:bg-slate-900/40 border border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 outline-none"
                        title="Filtra el BP por rol"
                    >
                        {ROLE_FILTERS.map((r) => (
                            <option key={r.value} value={r.value}>
                                Rol: {r.label}
                            </option>
                        ))}
                    </select>

                    {/* BP search
                    <input
                        value={bpQ}
                        onChange={(e) => setBpQ(e.target.value)}
                        placeholder="Buscar BP (nombre / organización / código)"
                        className="md:col-span-2 bg-slate-50 dark:bg-slate-900/40 border border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 outline-none"
                    /> */}

                    {/* Assignee BP (filtered) */}
                    <select
                        name="assigneePartnerId"
                        defaultValue=""
                        className="md:col-span-4 bg-slate-50 dark:bg-slate-900/40 border border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 outline-none"
                        title="Seleccione el BP asignado a esta tarea"
                    >
                        <option value="">(Asignar BP)</option>
                        {filteredPartners.map((p) => (
                            <option key={p.id} value={p.id}>
                                {partnerLabel(p)} [{p.code}]
                            </option>
                        ))}
                    </select>

                    {/* Due date */}
                    <input
                        name="dueDate"
                        type="date"
                        className="bg-slate-50 dark:bg-slate-900/40 border border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 outline-none"
                        title="Fecha en la que se realizará la tarea"
                    />

                    {/* Description */}
                    <textarea
                        name="description"
                        placeholder="Descripción (opcional)"
                        rows={2}
                        className="md:col-span-6 bg-slate-50 dark:bg-slate-900/40 border border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 outline-none resize-none"
                        title="Proporcione una descripción mas detallada de la tarea actual"
                    />

                    <div className="md:col-span-6 flex justify-end">
                        <button
                            disabled={pending}
                            className="transition ease-in-out flex px-4 py-2 items-center justify-center rounded-md bg-linear-to-br from-indigo-500 to-fuchsia-500 text-sm font-bold text-white shadow-md shadow-indigo-500/20 hover:from-indigo-600 hover:to-fuchsia-600 disabled:opacity-60"
                        >
                            {pending ? "Creando..." : "Crear"}
                        </button>
                    </div>
                </form>
            </div>

            {/* Board */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {COLUMNS.map((col) => {
                    const items = grouped.get(col.key) ?? [];
                    return (
                        <div
                            key={col.key}
                            className="bg-white dark:bg-slate-800 rounded-xl border-2 border-fuchsia-500/30 dark:border-slate-700 shadow-sm overflow-hidden"
                        >
                            <div className="px-4 py-3 border-b border-fuchsia-500/10 bg-slate-50 dark:bg-slate-500/5">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{col.label}</p>
                                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{items.length}</span>
                                </div>
                            </div>

                            <div className="p-3 space-y-3">
                                {items.length === 0 ? (
                                    <div className="rounded-xl border border-fuchsia-500/10 bg-fuchsia-500/5 p-3 text-xs text-slate-500 dark:text-slate-400">
                                        Sin tareas.
                                    </div>
                                ) : (
                                    items.map((t) => (
                                        <div
                                            key={t.id}
                                            className="rounded-xl border border-fuchsia-500/10 bg-slate-50 dark:bg-slate-900/30 p-3"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                                                        {t.code ? `${t.code} — ` : ""}{t.title}
                                                    </p>
                                                    {t.description && (
                                                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-3">
                                                            {t.description}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* chips mini */}
                                                <div className="flex flex-col items-end gap-1 shrink-0">
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-200">
                                                        {t.priority ?? "—"}
                                                    </span>
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-500/20 bg-slate-500/10 text-slate-200">
                                                        W{t.weight ?? 1}
                                                    </span>
                                                </div>
                                                {isOverdue(t) && (
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-rose-500/20 bg-rose-500/10 text-rose-300">
                                                        Vencida
                                                    </span>
                                                )}
                                            </div>

                                            <div className="mt-3 flex items-center justify-between gap-2">
                                                <select
                                                    value={t.status}
                                                    onChange={(e) => {
                                                        const next = e.target.value as TaskStatus;

                                                        if (t.status === TaskStatus.BLOCKED && next === TaskStatus.DONE) {
                                                            setMsg({
                                                                type: "error",
                                                                text: "No puedes cerrar una tarea bloqueada.",
                                                            });
                                                            setTimeout(() => setMsg(null), 2000);
                                                            return;
                                                        }

                                                        startTransition(async () => {
                                                            const res = await setTaskStatusAction(t.id, next);
                                                            if (!res.ok) {
                                                                setMsg({ type: "error", text: res.message });
                                                                setTimeout(() => setMsg(null), 2000);
                                                                return;
                                                            }

                                                            setTasks((prev) =>
                                                                prev.map((x) => (x.id === t.id ? { ...x, status: next } : x))
                                                            );
                                                        });
                                                    }}
                                                    className="bg-slate-50 dark:bg-slate-900/40 border border-fuchsia-500/10 rounded-lg px-4 text-xs focus:ring-1 focus:ring-fuchsia-500 outline-none"
                                                >
                                                    {COLUMNS.map((c) => (
                                                        <option key={c.key} value={c.key}>
                                                            {c.label}
                                                        </option>
                                                    ))}
                                                    <option value={TaskStatus.CANCELLED}>Cancelada</option>
                                                </select>

                                                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                                    {formatDateCO(t.dueDate as unknown as Date | string | null)}
                                                </span>
                                            </div>

                                            {/* Assigned */}
                                            <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                                                Asignado:{" "}
                                                <span className="text-slate-700 dark:text-slate-200">
                                                    {t.assigneePartner
                                                        ? `${t.assigneePartner.organizationName ?? [t.assigneePartner.firstName, t.assigneePartner.lastName].filter(Boolean).join(" ") ?? t.assigneePartner.code}`
                                                        : "—"}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}