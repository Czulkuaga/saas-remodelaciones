"use client";

import { useMemo, useState, useTransition } from "react";
import { createTaskAction, setTaskStatusAction } from "@/action/projects/project-tasks";

type Task = Awaited<ReturnType<typeof import("@/action/projects/project-tasks").listProjectTasksAction>>[number];
type PartnerPick = { id: string; code: string; type: "PERSON" | "ORGANIZATION"; organizationName: string | null; firstName: string | null; lastName: string | null };

const COLUMNS = [
    { key: "TODO", label: "Por hacer" },
    { key: "IN_PROGRESS", label: "En progreso" },
    { key: "BLOCKED", label: "Bloqueadas" },
    { key: "DONE", label: "Hechas" },
] as const;

function partnerLabel(p: PartnerPick) {
    if (p.organizationName) return p.organizationName;
    const full = [p.firstName, p.lastName].filter(Boolean).join(" ");
    return full || p.code;
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
    const [msg, setMsg] = useState<string | null>(null);

    const grouped = useMemo(() => {
        const m = new Map<string, Task[]>();
        for (const c of COLUMNS) m.set(c.key, []);
        for (const t of tasks) (m.get(t.status) ?? m.get("TODO")!)?.push(t);
        return m;
    }, [tasks]);

    function refreshSoft() {
        // MVP: si quieres perfecto, luego hacemos router.refresh()
        // pero esto evita re-render server y mantiene UX rápido.
    }

    return (
        <div className="space-y-6">
            {/* Create */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-fuchsia-500/60 dark:border-slate-700 shadow-sm p-5">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Crear tarea</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Rápido, estilo Kanban.</p>
                    </div>
                    {msg && (
                        <span className="text-xs font-semibold text-fuchsia-200 bg-fuchsia-500/10 border border-fuchsia-500/20 px-3 py-1 rounded-full">
                            {msg}
                        </span>
                    )}
                </div>

                <form
                    className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3"
                    onSubmit={(e) => {
                        e.preventDefault();
                        setMsg(null);
                        const fd = new FormData(e.currentTarget);
                        startTransition(async () => {
                            const res = await createTaskAction(projectId, fd);
                            if (!res.ok) {
                                setMsg(res.message);
                                return;
                            }
                            setMsg("Tarea creada.");
                            // recarga suave: agregamos placeholder local (sin re-fetch)
                            const title = String(fd.get("title") ?? "");
                            setTasks((prev) => [
                                {
                                    id: crypto.randomUUID(),
                                    code: null,
                                    title,
                                    description: String(fd.get("description") ?? "") || null,
                                    status: String(fd.get("status") ?? "TODO") as any,
                                    dueDate: (fd.get("dueDate") ? new Date(String(fd.get("dueDate"))) : null) as any,
                                    weight: 1,
                                    assigneePartner: null,
                                    assigneeUser: null,
                                    updatedAt: new Date(),
                                } as any,
                                ...prev,
                            ]);
                            (e.currentTarget as HTMLFormElement).reset();
                            refreshSoft();
                            setTimeout(() => setMsg(null), 1500);
                        });
                    }}
                >
                    <input
                        name="title"
                        placeholder="Título"
                        className="md:col-span-2 bg-slate-50 dark:bg-slate-900/40 border border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 outline-none"
                    />

                    <select
                        name="status"
                        defaultValue="TODO"
                        className="bg-slate-50 dark:bg-slate-900/40 border border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 outline-none"
                    >
                        {COLUMNS.map((c) => (
                            <option key={c.key} value={c.key}>
                                {c.label}
                            </option>
                        ))}
                    </select>

                    <select
                        name="assigneePartnerId"
                        defaultValue=""
                        className="bg-slate-50 dark:bg-slate-900/40 border border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 outline-none"
                    >
                        <option value="">(Asignar BP)</option>
                        {partners.map((p) => (
                            <option key={p.id} value={p.id}>
                                {partnerLabel(p)} [{p.code}]
                            </option>
                        ))}
                    </select>

                    <input
                        name="dueDate"
                        type="date"
                        className="bg-slate-50 dark:bg-slate-900/40 border border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 outline-none"
                    />

                    <textarea
                        name="description"
                        placeholder="Descripción (opcional)"
                        rows={2}
                        className="md:col-span-5 bg-slate-50 dark:bg-slate-900/40 border border-fuchsia-500/10 rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-fuchsia-500 outline-none resize-none"
                    />

                    <div className="md:col-span-5 flex justify-end">
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
                        <div key={col.key} className="bg-white dark:bg-slate-800 rounded-xl border-2 border-fuchsia-500/30 dark:border-slate-700 shadow-sm overflow-hidden">
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
                                        <div key={t.id} className="rounded-xl border border-fuchsia-500/10 bg-slate-50 dark:bg-slate-900/30 p-3">
                                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{t.title}</p>
                                            {t.description && <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{t.description}</p>}
                                            <div className="mt-3 flex items-center justify-between gap-2">
                                                <select
                                                    value={t.status}
                                                    onChange={(e) => {
                                                        const next = e.target.value;
                                                        startTransition(async () => {
                                                            const res = await setTaskStatusAction(t.id, next);
                                                            if (!res.ok) return;
                                                            setTasks((prev) => prev.map((x) => (x.id === t.id ? ({ ...x, status: next as any } as any) : x)));
                                                        });
                                                    }}
                                                    className="bg-transparent text-xs border border-fuchsia-500/20 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-200"
                                                >
                                                    {COLUMNS.map((c) => (
                                                        <option key={c.key} value={c.key}>
                                                            {c.label}
                                                        </option>
                                                    ))}
                                                    <option value="CANCELLED">Cancelada</option>
                                                </select>

                                                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                                    {t.dueDate ? new Date(t.dueDate as any).toLocaleDateString("es-CO") : "—"}
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