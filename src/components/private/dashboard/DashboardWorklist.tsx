"use client";

import Link from "next/link";

type WorkItem =
    | { kind: "TASK_OVERDUE"; title: string; project: string; due: string | null; href: string }
    | { kind: "BUDGET_DRAFT"; title: string; project: string; href: string }
    | { kind: "PROJECT_STALE"; title: string; project: string; lastActivityAt: string | null; href: string };

function badge(kind: WorkItem["kind"]) {
    if (kind === "TASK_OVERDUE") return { text: "Tarea vencida", cls: "bg-rose-500/10 border-rose-500/20 text-rose-600" };
    if (kind === "BUDGET_DRAFT") return { text: "Aprobación", cls: "bg-amber-500/10 border-amber-500/20 text-amber-700" };
    return { text: "Sin actividad", cls: "bg-slate-500/10 border-slate-500/20 text-slate-700 dark:text-slate-300" };
}

export function DashboardWorklist({ items }: { items: WorkItem[] }) {
    return (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/20 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                    <div className="font-bold text-slate-700 dark:text-slate-100">Bandeja de trabajo</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Acciones recomendadas para el periodo seleccionado</div>
                </div>
                <Link href="/projects" className="text-sm text-slate-700 font-semibold hover:underline">Ver proyectos</Link>
            </div>

            <div className="p-3 space-y-2">
                {items.length === 0 ? (
                    <div className="p-6 text-sm text-slate-500 dark:text-slate-400">No hay pendientes relevantes 🎉</div>
                ) : (
                    items.slice(0, 12).map((it, idx) => {
                        const b = badge(it.kind);
                        return (
                            <Link
                                key={idx}
                                href={it.href}
                                className="block rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/20 p-3 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{it.title}</div>
                                        <div className="text-xs text-slate-500">{it.project}</div>
                                    </div>
                                    <span className={["text-[11px] px-2 py-0.5 rounded-full border", b.cls].join(" ")}>
                                        {b.text}
                                    </span>
                                </div>
                            </Link>
                        );
                    })
                )}
            </div>
        </div>
    );
}